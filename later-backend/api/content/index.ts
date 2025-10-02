// API endpoint for content management
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  AuthenticatedRequest,
  withAuth,
  handleCORS,
  createErrorResponse,
  createSuccessResponse,
  createSupabaseClient
} from '../_lib/auth';
import {
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  buildContentQuery,
  validateContentInput,
  checkUserLimits,
  sanitizeOutput,
  logApiCall
} from '../_lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // Handle CORS
  if (handleCORS(req, res)) return;

  try {
    switch (req.method) {
      case 'GET':
        return await withAuth(handleGetContent)(req as AuthenticatedRequest, res);
      case 'POST':
        return await withAuth(handleCreateContent)(req as AuthenticatedRequest, res);
      default:
        return createErrorResponse(res, 'Method not allowed', 405);
    }
  } catch (error) {
    logApiCall(req.method!, '/api/content', undefined, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Internal server error', 500);
  }
}

async function handleGetContent(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const pagination = parsePaginationParams(req.query);
    const sort = parseSortParams(req.query);
    const filters = parseFilterParams(req.query);

    // Build and execute query
    const { data: content, count, error } = await buildContentQuery(
      userId,
      filters,
      sort,
      pagination
    );

    if (error) {
      logApiCall(req.method!, '/api/content', userId, Date.now() - startTime, 400, error);
      return createErrorResponse(res, 'Failed to fetch content', 400, 'QUERY_ERROR', error);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / pagination.limit!);
    const hasNextPage = pagination.page! < totalPages;
    const hasPreviousPage = pagination.page! > 1;

    const response = {
      content: sanitizeOutput(content),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filters,
      sort
    };

    logApiCall(req.method!, '/api/content', userId, Date.now() - startTime, 200);
    return createSuccessResponse(res, response);

  } catch (error) {
    logApiCall(req.method!, '/api/content', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Failed to fetch content', 500);
  }
}

async function handleCreateContent(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const supabase = createSupabaseClient();

    // Validate input
    const validation = validateContentInput(req.body);
    if (!validation.isValid) {
      logApiCall(req.method!, '/api/content', userId, Date.now() - startTime, 400);
      return createErrorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', {
        errors: validation.errors
      });
    }

    // Check user limits
    const limits = await checkUserLimits(userId);
    if (!limits.canAddContent) {
      logApiCall(req.method!, '/api/content', userId, Date.now() - startTime, 429);
      return createErrorResponse(res, 'Monthly content limit reached', 429, 'LIMIT_EXCEEDED', {
        remainingContent: limits.remainingContent
      });
    }

    // Prepare content data
    const contentData = {
      user_id: userId,
      title: req.body.title,
      original_content: req.body.content,
      url: req.body.url,
      source: req.body.source,
      priority: req.body.priority || 'medium',
      tags: req.body.tags || [],
      categories: req.body.categories || [],
      scheduled_for: req.body.scheduled_for ? new Date(req.body.scheduled_for).toISOString() : null,
      capture_location: req.body.capture_location,
      attachment_urls: req.body.attachment_urls || [],
      attachment_metadata: req.body.metadata || {},
      status: 'captured'
    };

    // Insert content
    const { data: newContent, error: insertError } = await supabase
      .from('content_items')
      .insert(contentData)
      .select(`
        *,
        content_category_mappings(
          content_categories(name, color_hex, icon_name)
        ),
        content_tag_mappings(
          content_tags(name, color_hex)
        )
      `)
      .single();

    if (insertError) {
      logApiCall(req.method!, '/api/content', userId, Date.now() - startTime, 400, insertError);
      return createErrorResponse(res, 'Failed to create content', 400, 'CREATE_ERROR', insertError);
    }

    // Log analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'content_created_api',
        event_data: {
          source: req.body.source,
          has_url: !!req.body.url,
          has_location: !!req.body.capture_location,
          content_length: req.body.content?.length || 0
        }
      });

    logApiCall(req.method!, '/api/content', userId, Date.now() - startTime, 201);
    return createSuccessResponse(res, sanitizeOutput(newContent), 201);

  } catch (error) {
    logApiCall(req.method!, '/api/content', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Failed to create content', 500);
  }
}