// Edge Function for context-aware content suggestions
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  getUserIdFromRequest,
  checkRateLimit,
  logInfo,
  logError,
  validateEnv
} from '../_shared/utils.ts';
import { ContextPattern } from '../_shared/types.ts';

interface ContextRequest {
  context_type: 'location' | 'time' | 'calendar' | 'pattern_check';
  context_data: {
    location?: {
      lat: number;
      lng: number;
      accuracy: number;
      address?: string;
    };
    time?: {
      timezone: string;
      current_time: string;
      day_of_week: string;
    };
    calendar?: {
      upcoming_events: Array<{
        title: string;
        start_time: string;
        location?: string;
      }>;
    };
    user_patterns?: {
      recent_activity: string[];
      current_app_usage?: string;
    };
  };
  limit?: number;
}

interface SuggestionResponse {
  suggestions: Array<{
    content_id: string;
    title: string;
    summary?: string;
    relevance_score: number;
    suggestion_reason: string;
    context_match: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;
  context_patterns: ContextPattern[];
  insights?: {
    most_active_time?: string;
    frequent_locations?: string[];
    common_patterns?: string[];
  };
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
      'context-suggestions',
      parseInt(env.RATE_LIMIT_MAX_REQUESTS || '60'),
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
    const body: ContextRequest = await req.json();

    if (!body.context_type || !body.context_data) {
      return createErrorResponse('context_type and context_data are required', 400);
    }

    // Check user preferences
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('enable_context_detection, enable_location_services, timezone, privacy_level')
      .eq('id', userId)
      .single();

    if (!userProfile?.enable_context_detection) {
      return createSuccessResponse({
        suggestions: [],
        context_patterns: [],
        insights: { message: 'Context detection disabled' }
      });
    }

    logInfo('Processing context request', {
      userId,
      contextType: body.context_type,
      hasLocation: !!body.context_data.location,
      hasTime: !!body.context_data.time,
      hasCalendar: !!body.context_data.calendar
    });

    const suggestions: SuggestionResponse['suggestions'] = [];
    const limit = body.limit || 10;

    // Get relevant content based on context
    switch (body.context_type) {
      case 'location':
        if (userProfile.enable_location_services && body.context_data.location) {
          const locationSuggestions = await getLocationBasedSuggestions(
            supabase,
            userId,
            body.context_data.location,
            limit
          );
          suggestions.push(...locationSuggestions);
        }
        break;

      case 'time':
        if (body.context_data.time) {
          const timeSuggestions = await getTimeBasedSuggestions(
            supabase,
            userId,
            body.context_data.time,
            limit
          );
          suggestions.push(...timeSuggestions);
        }
        break;

      case 'calendar':
        if (body.context_data.calendar) {
          const calendarSuggestions = await getCalendarBasedSuggestions(
            supabase,
            userId,
            body.context_data.calendar,
            limit
          );
          suggestions.push(...calendarSuggestions);
        }
        break;

      case 'pattern_check':
        const patternSuggestions = await getPatternBasedSuggestions(
          supabase,
          userId,
          body.context_data,
          limit
        );
        suggestions.push(...patternSuggestions);
        break;
    }

    // Get or update context patterns
    const contextPatterns = await updateContextPatterns(
      supabase,
      userId,
      body.context_type,
      body.context_data,
      suggestions.length > 0
    );

    // Generate insights
    const insights = await generateInsights(supabase, userId);

    // Sort suggestions by relevance score
    suggestions.sort((a, b) => b.relevance_score - a.relevance_score);

    // Log analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'context_suggestion_request',
        event_data: {
          context_type: body.context_type,
          suggestions_count: suggestions.length,
          has_location: !!body.context_data.location
        }
      });

    logInfo('Context suggestions generated', {
      userId,
      contextType: body.context_type,
      suggestionsCount: suggestions.length,
      patternsCount: contextPatterns.length
    });

    const response: SuggestionResponse = {
      suggestions: suggestions.slice(0, limit),
      context_patterns: contextPatterns,
      insights
    };

    return createSuccessResponse(response);

  } catch (error) {
    logError('Context suggestion failed', error);
    return createErrorResponse('Failed to generate context suggestions', 500, 'CONTEXT_ERROR', {
      message: error.message
    });
  }
});

async function getLocationBasedSuggestions(
  supabase: any,
  userId: string,
  location: { lat: number; lng: number; accuracy: number; address?: string },
  limit: number
): Promise<SuggestionResponse['suggestions']> {

  // Find content within 1km radius
  const { data: nearbyContent } = await supabase
    .from('content_items')
    .select('id, title, summary, capture_location, tags, priority, captured_at')
    .eq('user_id', userId)
    .eq('status', 'processed')
    .not('capture_location', 'is', null)
    .limit(50);

  if (!nearbyContent?.length) return [];

  const suggestions: SuggestionResponse['suggestions'] = [];

  for (const content of nearbyContent) {
    if (!content.capture_location) continue;

    const distance = calculateDistance(
      location.lat,
      location.lng,
      content.capture_location.lat,
      content.capture_location.lng
    );

    if (distance <= 1000) { // Within 1km
      const relevanceScore = calculateLocationRelevance(distance, content);

      suggestions.push({
        content_id: content.id,
        title: content.title || 'Untitled',
        summary: content.summary,
        relevance_score: relevanceScore,
        suggestion_reason: `Previously captured ${Math.round(distance)}m from here`,
        context_match: 'location',
        priority: content.priority || 'medium'
      });
    }
  }

  return suggestions;
}

async function getTimeBasedSuggestions(
  supabase: any,
  userId: string,
  timeData: { timezone: string; current_time: string; day_of_week: string },
  limit: number
): Promise<SuggestionResponse['suggestions']> {

  const currentHour = new Date(timeData.current_time).getHours();
  const dayOfWeek = timeData.day_of_week.toLowerCase();

  // Find content scheduled for this time or historically accessed at this time
  const { data: timeRelevantContent } = await supabase
    .from('content_items')
    .select('id, title, summary, scheduled_for, captured_at, last_viewed_at, priority, tags')
    .eq('user_id', userId)
    .in('status', ['processed', 'captured'])
    .limit(50);

  if (!timeRelevantContent?.length) return [];

  const suggestions: SuggestionResponse['suggestions'] = [];

  for (const content of timeRelevantContent) {
    let relevanceScore = 0;
    let reason = '';

    // Check if scheduled for now
    if (content.scheduled_for) {
      const scheduledTime = new Date(content.scheduled_for);
      const timeDiff = Math.abs(new Date(timeData.current_time).getTime() - scheduledTime.getTime());

      if (timeDiff <= 3600000) { // Within 1 hour
        relevanceScore = 0.9;
        reason = 'Scheduled for this time';
      }
    }

    // Check historical patterns
    if (content.last_viewed_at) {
      const lastViewHour = new Date(content.last_viewed_at).getHours();
      if (Math.abs(currentHour - lastViewHour) <= 1) {
        relevanceScore = Math.max(relevanceScore, 0.6);
        reason = reason || 'Often viewed at this time';
      }
    }

    // Time-based tag relevance
    const timeRelevantTags = ['morning', 'afternoon', 'evening', 'weekend', 'workday'];
    const hasTimeTag = content.tags?.some((tag: string) =>
      timeRelevantTags.some(timeTag => tag.toLowerCase().includes(timeTag))
    );

    if (hasTimeTag) {
      relevanceScore = Math.max(relevanceScore, 0.5);
      reason = reason || 'Time-relevant content';
    }

    if (relevanceScore > 0.4) {
      suggestions.push({
        content_id: content.id,
        title: content.title || 'Untitled',
        summary: content.summary,
        relevance_score: relevanceScore,
        suggestion_reason: reason,
        context_match: 'time',
        priority: content.priority || 'medium'
      });
    }
  }

  return suggestions;
}

async function getCalendarBasedSuggestions(
  supabase: any,
  userId: string,
  calendarData: { upcoming_events: Array<{ title: string; start_time: string; location?: string }> },
  limit: number
): Promise<SuggestionResponse['suggestions']> {

  if (!calendarData.upcoming_events?.length) return [];

  const suggestions: SuggestionResponse['suggestions'] = [];

  // Get content that might be relevant to upcoming events
  const { data: userContent } = await supabase
    .from('content_items')
    .select('id, title, summary, tags, categories, original_content, priority')
    .eq('user_id', userId)
    .in('status', ['processed', 'captured'])
    .limit(100);

  if (!userContent?.length) return [];

  for (const event of calendarData.upcoming_events) {
    const eventKeywords = extractKeywords(event.title + ' ' + (event.location || ''));

    for (const content of userContent) {
      const contentText = (
        (content.title || '') + ' ' +
        (content.summary || '') + ' ' +
        (content.tags?.join(' ') || '') + ' ' +
        (content.categories?.join(' ') || '')
      ).toLowerCase();

      let matchScore = 0;
      for (const keyword of eventKeywords) {
        if (contentText.includes(keyword.toLowerCase())) {
          matchScore += 0.2;
        }
      }

      if (matchScore > 0.3) {
        suggestions.push({
          content_id: content.id,
          title: content.title || 'Untitled',
          summary: content.summary,
          relevance_score: Math.min(matchScore, 1.0),
          suggestion_reason: `Relevant to upcoming event: ${event.title}`,
          context_match: 'calendar',
          priority: content.priority || 'medium'
        });
      }
    }
  }

  return suggestions;
}

async function getPatternBasedSuggestions(
  supabase: any,
  userId: string,
  contextData: any,
  limit: number
): Promise<SuggestionResponse['suggestions']> {

  // Get user's active context patterns
  const { data: patterns } = await supabase
    .from('context_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('confidence_score', { ascending: false });

  if (!patterns?.length) return [];

  const suggestions: SuggestionResponse['suggestions'] = [];

  // Check each pattern for matches
  for (const pattern of patterns) {
    const patternMatch = checkPatternMatch(pattern, contextData);

    if (patternMatch.matches) {
      // Find content related to this pattern
      const relatedContent = await findContentForPattern(supabase, userId, pattern);

      for (const content of relatedContent) {
        suggestions.push({
          content_id: content.id,
          title: content.title || 'Untitled',
          summary: content.summary,
          relevance_score: patternMatch.confidence * pattern.confidence_score,
          suggestion_reason: `Matches pattern: ${pattern.pattern_name}`,
          context_match: 'pattern',
          priority: content.priority || 'medium'
        });
      }
    }
  }

  return suggestions;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateLocationRelevance(distance: number, content: any): number {
  // Closer content is more relevant
  const baseScore = Math.max(0.1, 1 - (distance / 1000));

  // Boost for recent content
  const daysSinceCapture = (Date.now() - new Date(content.captured_at).getTime()) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 1 - (daysSinceCapture / 30)); // Fade over 30 days

  return Math.min(1.0, baseScore + (recencyBoost * 0.2));
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'day', 'get', 'has', 'him', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
}

function checkPatternMatch(pattern: ContextPattern, contextData: any): { matches: boolean; confidence: number } {
  // Simplified pattern matching - would be more sophisticated in production
  let confidence = 0;

  if (pattern.context_type === 'time' && contextData.time) {
    const patternHour = pattern.pattern_data.preferred_hour;
    const currentHour = new Date(contextData.time.current_time).getHours();

    if (patternHour && Math.abs(currentHour - patternHour) <= 1) {
      confidence = 0.8;
    }
  }

  if (pattern.context_type === 'location' && contextData.location) {
    const patternLocation = pattern.pattern_data.location;
    if (patternLocation) {
      const distance = calculateDistance(
        contextData.location.lat,
        contextData.location.lng,
        patternLocation.lat,
        patternLocation.lng
      );

      if (distance <= 500) {
        confidence = 0.9;
      }
    }
  }

  return {
    matches: confidence > 0.5,
    confidence
  };
}

async function findContentForPattern(supabase: any, userId: string, pattern: ContextPattern): Promise<any[]> {
  // Find content that matches pattern criteria
  const { data: content } = await supabase
    .from('content_items')
    .select('id, title, summary, priority')
    .eq('user_id', userId)
    .in('status', ['processed', 'captured'])
    .limit(5);

  return content || [];
}

async function updateContextPatterns(
  supabase: any,
  userId: string,
  contextType: string,
  contextData: any,
  hadSuggestions: boolean
): Promise<ContextPattern[]> {

  // This would implement pattern learning logic
  // For now, just return existing patterns

  const { data: patterns } = await supabase
    .from('context_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('context_type', contextType)
    .order('confidence_score', { ascending: false })
    .limit(5);

  return patterns || [];
}

async function generateInsights(supabase: any, userId: string): Promise<any> {
  // Generate usage insights
  const { data: analytics } = await supabase
    .from('usage_analytics')
    .select('event_data, occurred_at')
    .eq('user_id', userId)
    .eq('event_type', 'content_captured')
    .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('occurred_at', { ascending: false });

  const insights: any = {};

  if (analytics?.length) {
    // Most active time analysis
    const hourCounts: Record<number, number> = {};
    analytics.forEach((record: any) => {
      const hour = new Date(record.occurred_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    if (mostActiveHour) {
      insights.most_active_time = `${mostActiveHour[0]}:00`;
    }
  }

  return insights;
}