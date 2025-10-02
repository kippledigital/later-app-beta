// API endpoint for individual content item operations
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
  validateContentInput,
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
        return await withAuth(handleGetContentById)(req as AuthenticatedRequest, res);
      case 'PUT':
        return await withAuth(handleUpdateContent)(req as AuthenticatedRequest, res);
      case 'DELETE':
        return await withAuth(handleDeleteContent)(req as AuthenticatedRequest, res);
      default:
        return createErrorResponse(res, 'Method not allowed', 405);
    }
  } catch (error) {
    logApiCall(req.method!, '/api/content/[id]', undefined, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Internal server error', 500);
  }
}

async function handleGetContentById(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const contentId = req.query.id as string;
    const supabase = createSupabaseClient();

    if (!contentId) {
      return createErrorResponse(res, 'Content ID is required', 400);
    }

    // Fetch content with related data
    const { data: content, error } = await supabase
      .from('content_items')
      .select(`
        *,
        content_category_mappings(
          content_categories(name, color_hex, icon_name)
        ),
        content_tag_mappings(
          content_tags(name, color_hex)
        )
      `)
      .eq('id', contentId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (error || !content) {
      logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 404);
      return createErrorResponse(res, 'Content not found', 404, 'NOT_FOUND');
    }

    // Update view count and last viewed timestamp
    await supabase
      .from('content_items')
      .update({
        view_count: (content.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .eq('user_id', userId);

    // Log analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'content_viewed',
        event_data: {
          content_id: contentId,
          source: content.source,
          view_count: (content.view_count || 0) + 1
        }
      });

    logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 200);
    return createSuccessResponse(res, sanitizeOutput(content));

  } catch (error) {
    logApiCall(req.method!, '/api/content/[id]', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Failed to fetch content', 500);
  }
}

async function handleUpdateContent(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const contentId = req.query.id as string;
    const supabase = createSupabaseClient();

    if (!contentId) {
      return createErrorResponse(res, 'Content ID is required', 400);
    }

    // Validate input (partial validation for updates)
    const allowedFields = [
      'title', 'original_content', 'processed_content', 'summary', 'url',
      'priority', 'tags', 'categories', 'scheduled_for', 'capture_location',
      'attachment_urls', 'attachment_metadata', 'is_favorite', 'is_archived'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse(res, 'No valid fields to update', 400, 'NO_UPDATE_DATA');
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Check if content exists and belongs to user
    const { data: existingContent, error: fetchError } = await supabase
      .from('content_items')
      .select('id, status')
      .eq('id', contentId)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .single();

    if (fetchError || !existingContent) {
      logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 404);
      return createErrorResponse(res, 'Content not found', 404, 'NOT_FOUND');
    }

    // Update content
    const { data: updatedContent, error: updateError } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', contentId)
      .eq('user_id', userId)
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

    if (updateError) {
      logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 400, updateError);
      return createErrorResponse(res, 'Failed to update content', 400, 'UPDATE_ERROR', updateError);
    }

    // Log analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'content_updated',
        event_data: {
          content_id: contentId,
          updated_fields: Object.keys(updateData),
          is_archived: updateData.is_archived,
          is_favorite: updateData.is_favorite
        }
      });

    logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 200);
    return createSuccessResponse(res, sanitizeOutput(updatedContent));

  } catch (error) {
    logApiCall(req.method!, '/api/content/[id]', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Failed to update content', 500);
  }
}

async function handleDeleteContent(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const contentId = req.query.id as string;
    const supabase = createSupabaseClient();

    if (!contentId) {
      return createErrorResponse(res, 'Content ID is required', 400);
    }

    const hardDelete = req.query.hard === 'true';

    // Check if content exists and belongs to user
    const { data: existingContent, error: fetchError } = await supabase
      .from('content_items')
      .select('id, status')
      .eq('id', contentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingContent) {
      logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 404);
      return createErrorResponse(res, 'Content not found', 404, 'NOT_FOUND');
    }

    if (hardDelete) {
      // Permanently delete content and all related data
      const { error: deleteError } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentId)
        .eq('user_id', userId);

      if (deleteError) {
        logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 400, deleteError);
        return createErrorResponse(res, 'Failed to delete content', 400, 'DELETE_ERROR', deleteError);
      }

    } else {
      // Soft delete - mark as deleted
      const { error: updateError } = await supabase
        .from('content_items')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .eq('user_id', userId);

      if (updateError) {
        logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 400, updateError);
        return createErrorResponse(res, 'Failed to delete content', 400, 'DELETE_ERROR', updateError);
      }
    }

    // Log analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'content_deleted',
        event_data: {
          content_id: contentId,
          hard_delete: hardDelete
        }
      });

    logApiCall(req.method!, '/api/content/[id]', userId, Date.now() - startTime, 200);
    return createSuccessResponse(res, {
      message: `Content ${hardDelete ? 'permanently deleted' : 'moved to trash'}`,
      content_id: contentId,
      hard_delete: hardDelete
    });

  } catch (error) {
    logApiCall(req.method!, '/api/content/[id]', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Failed to delete content', 500);
  }
}