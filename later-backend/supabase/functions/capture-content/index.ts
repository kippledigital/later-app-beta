// Edge Function for capturing content from various sources
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  getUserIdFromRequest,
  checkRateLimit,
  validateContentSize,
  sanitizeContent,
  retryWithBackoff,
  logInfo,
  logError,
  validateEnv
} from '../_shared/utils.ts';
import { ContentItem } from '../_shared/types.ts';

interface CaptureRequest {
  source: 'email' | 'web_url' | 'voice_note' | 'screenshot' | 'manual_entry' | 'shared_content' | 'calendar_event' | 'location_based';
  content?: string;
  title?: string;
  url?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  categories?: string[];
  scheduled_for?: string;
  attachment_urls?: string[];
  capture_location?: {
    lat: number;
    lng: number;
    accuracy: number;
    address?: string;
    venue?: string;
  };
  metadata?: Record<string, any>;
  auto_process?: boolean; // Whether to trigger AI processing
}

interface CaptureResponse {
  content_item: ContentItem;
  processing_queued?: boolean;
  warnings?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCORSPreflight();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Validate environment
    const env = validateEnv(Deno.env.toObject());
    const supabase = createSupabaseClient(env);

    // Get user ID from request
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check rate limiting
    const { allowed, info } = await checkRateLimit(
      supabase,
      userId,
      'capture-content',
      parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100'),
      parseInt(env.RATE_LIMIT_WINDOW_MS || '900000')
    );

    if (!allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': info.reset.toString(),
          'Retry-After': info.retryAfter?.toString() || '900',
        }
      });
    }

    // Parse request body
    const body: CaptureRequest = await req.json();

    if (!body.source) {
      return createErrorResponse('Source is required', 400);
    }

    // Validate content size
    if (body.content && !validateContentSize(body.content)) {
      return createErrorResponse('Content too large', 413);
    }

    // Check user's content limit
    const { data: limitCheck } = await supabase
      .rpc('check_content_limit', { user_uuid: userId });

    if (!limitCheck) {
      return createErrorResponse('Monthly content limit reached', 429, 'CONTENT_LIMIT_EXCEEDED');
    }

    // Get user preferences
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('enable_ai_processing, enable_location_services, privacy_level')
      .eq('id', userId)
      .single();

    const warnings: string[] = [];

    // Validate and process location data
    if (body.capture_location) {
      if (!userProfile?.enable_location_services) {
        warnings.push('Location data ignored - location services disabled');
        body.capture_location = undefined;
      } else if (userProfile.privacy_level === 'strict') {
        // For strict privacy, only store approximate location
        body.capture_location = {
          lat: Math.round(body.capture_location.lat * 100) / 100,
          lng: Math.round(body.capture_location.lng * 100) / 100,
          accuracy: Math.max(body.capture_location.accuracy, 1000)
        };
        warnings.push('Location data approximated for privacy');
      }
    }

    logInfo('Starting content capture', {
      userId,
      source: body.source,
      hasContent: !!body.content,
      hasUrl: !!body.url,
      hasLocation: !!body.capture_location
    });

    let processedContent = body.content;
    let extractedTitle = body.title;

    // Handle URL-based content
    if (body.source === 'web_url' && body.url && !body.content) {
      try {
        // Call content extraction function
        const extractResponse = await fetch(
          new URL('../extract-content', req.url),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({
              url: body.url,
              timeout: 15000
            })
          }
        );

        if (extractResponse.ok) {
          const extractedData = await extractResponse.json();
          processedContent = extractedData.content;
          extractedTitle = extractedTitle || extractedData.title;

          // Merge metadata
          body.metadata = {
            ...body.metadata,
            ...extractedData.metadata,
            extraction_method: 'automated'
          };
        } else {
          warnings.push('Could not extract content from URL automatically');
        }
      } catch (error) {
        logError('URL content extraction failed', error, { url: body.url });
        warnings.push('URL content extraction failed');
      }
    }

    // Sanitize content
    if (processedContent) {
      processedContent = sanitizeContent(processedContent);
    }

    // Prepare content item data
    const contentItemData = {
      user_id: userId,
      title: extractedTitle,
      original_content: processedContent,
      url: body.url,
      source: body.source,
      status: 'captured' as const,
      priority: body.priority || 'medium',
      tags: body.tags || [],
      categories: body.categories || [],
      scheduled_for: body.scheduled_for ? new Date(body.scheduled_for).toISOString() : null,
      capture_location: body.capture_location,
      attachment_urls: body.attachment_urls || [],
      attachment_metadata: body.metadata || {},
      captured_at: new Date().toISOString()
    };

    // Insert content item
    const { data: contentItem, error: insertError } = await supabase
      .from('content_items')
      .insert(contentItemData)
      .select('*')
      .single();

    if (insertError) {
      logError('Failed to insert content item', insertError, { userId, source: body.source });
      return createErrorResponse('Failed to save content', 500, 'DATABASE_ERROR');
    }

    // Auto-assign to categories based on content
    if (processedContent && (!body.categories || body.categories.length === 0)) {
      try {
        const suggestedCategories = await suggestCategories(supabase, userId, processedContent, extractedTitle);
        if (suggestedCategories.length > 0) {
          // Update content item with suggested categories
          await supabase
            .from('content_items')
            .update({ categories: suggestedCategories })
            .eq('id', contentItem.id);

          contentItem.categories = suggestedCategories;
        }
      } catch (error) {
        logError('Category suggestion failed', error, { contentId: contentItem.id });
      }
    }

    let processingQueued = false;

    // Queue AI processing if enabled and content exists
    if (
      body.auto_process !== false &&
      userProfile?.enable_ai_processing &&
      processedContent &&
      processedContent.length > 50
    ) {
      try {
        const processingResponse = await fetch(
          new URL('../process-content-ai', req.url),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({
              content_id: contentItem.id,
              content: processedContent,
              title: extractedTitle,
              url: body.url,
              source: body.source,
              processing_types: ['summarize', 'generate_tags', 'categorize', 'sentiment_analysis']
            })
          }
        );

        if (processingResponse.ok) {
          processingQueued = true;
        } else {
          warnings.push('AI processing could not be queued');
        }
      } catch (error) {
        logError('Failed to queue AI processing', error, { contentId: contentItem.id });
        warnings.push('AI processing could not be queued');
      }
    }

    // Log usage analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'content_captured',
        event_data: {
          source: body.source,
          has_url: !!body.url,
          has_location: !!body.capture_location,
          content_length: processedContent?.length || 0,
          processing_queued: processingQueued
        }
      });

    logInfo('Content capture completed', {
      userId,
      contentId: contentItem.id,
      source: body.source,
      processingQueued,
      warningsCount: warnings.length
    });

    const response: CaptureResponse = {
      content_item: contentItem,
      processing_queued: processingQueued,
      warnings: warnings.length > 0 ? warnings : undefined
    };

    return createSuccessResponse(response, 201);

  } catch (error) {
    logError('Content capture failed', error);
    return createErrorResponse('Failed to capture content', 500, 'CAPTURE_ERROR', {
      message: error.message
    });
  }
});

async function suggestCategories(
  supabase: any,
  userId: string,
  content: string,
  title?: string
): Promise<string[]> {

  // Simple keyword-based category suggestion
  const categoryKeywords = {
    'Work': ['job', 'career', 'business', 'professional', 'meeting', 'project', 'deadline', 'client', 'company'],
    'Personal': ['family', 'friend', 'personal', 'home', 'hobby', 'relationship', 'life'],
    'Shopping': ['buy', 'purchase', 'shop', 'store', 'price', 'sale', 'discount', 'product', 'order'],
    'Travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'destination', 'journey', 'airport'],
    'Health': ['health', 'doctor', 'medical', 'fitness', 'exercise', 'diet', 'wellness', 'medication'],
    'Finance': ['money', 'bank', 'investment', 'budget', 'financial', 'tax', 'payment', 'credit'],
    'Learning': ['learn', 'education', 'course', 'tutorial', 'study', 'knowledge', 'skill', 'book'],
    'Entertainment': ['movie', 'music', 'game', 'entertainment', 'fun', 'watch', 'play', 'enjoy']
  };

  const textToAnalyze = `${title || ''} ${content}`.toLowerCase();
  const suggestions: Array<{ category: string; score: number }> = [];

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      const matches = (textToAnalyze.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    }

    if (score > 0) {
      suggestions.push({ category, score });
    }
  }

  // Get user's existing categories
  const { data: userCategories } = await supabase
    .from('content_categories')
    .select('name')
    .eq('user_id', userId)
    .order('usage_count', { ascending: false });

  const userCategoryNames = new Set(userCategories?.map((c: any) => c.name) || []);

  // Filter to user's categories and sort by score
  return suggestions
    .filter(s => userCategoryNames.has(s.category))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(s => s.category);
}