// Admin endpoint for system analytics and monitoring
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  AuthenticatedRequest,
  withAuth,
  handleCORS,
  createErrorResponse,
  createSuccessResponse,
  createSupabaseClient
} from '../_lib/auth';
import { logApiCall } from '../_lib/utils';

interface AnalyticsRequest {
  date_from?: string;
  date_to?: string;
  metrics: Array<'users' | 'content' | 'ai_usage' | 'errors' | 'performance'>;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

interface AnalyticsResponse {
  period: {
    from: string;
    to: string;
    granularity: string;
  };
  metrics: {
    users?: {
      total_users: number;
      active_users: number;
      new_signups: number;
      retention_rate: number;
    };
    content?: {
      total_items: number;
      items_created: number;
      items_processed: number;
      popular_sources: Array<{ source: string; count: number }>;
      popular_categories: Array<{ category: string; count: number }>;
    };
    ai_usage?: {
      total_jobs: number;
      successful_jobs: number;
      failed_jobs: number;
      tokens_consumed: number;
      estimated_cost_cents: number;
      average_processing_time_ms: number;
    };
    errors?: {
      total_errors: number;
      error_rate: number;
      top_errors: Array<{ error: string; count: number }>;
      critical_errors: number;
    };
    performance?: {
      average_response_time_ms: number;
      p95_response_time_ms: number;
      total_requests: number;
      successful_requests: number;
      rate_limited_requests: number;
    };
  };
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // Handle CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return createErrorResponse(res, 'Method not allowed', 405);
  }

  return await withAuth(handleAnalyticsRequest)(req as AuthenticatedRequest, res);
}

async function handleAnalyticsRequest(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const supabase = createSupabaseClient();

    // Check if user is admin (in a real app, you'd have proper admin role checking)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('subscription_tier, email')
      .eq('id', userId)
      .single();

    if (!userProfile || userProfile.subscription_tier !== 'enterprise') {
      return createErrorResponse(res, 'Insufficient permissions', 403, 'ADMIN_REQUIRED');
    }

    const analyticsRequest: AnalyticsRequest = req.body;

    if (!analyticsRequest.metrics?.length) {
      return createErrorResponse(res, 'Metrics array is required', 400);
    }

    const dateFrom = analyticsRequest.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = analyticsRequest.date_to || new Date().toISOString();
    const granularity = analyticsRequest.granularity || 'day';

    const response: AnalyticsResponse = {
      period: {
        from: dateFrom,
        to: dateTo,
        granularity
      },
      metrics: {},
      timestamp: new Date().toISOString()
    };

    // Generate analytics for each requested metric
    for (const metric of analyticsRequest.metrics) {
      switch (metric) {
        case 'users':
          response.metrics.users = await getUserMetrics(supabase, dateFrom, dateTo);
          break;
        case 'content':
          response.metrics.content = await getContentMetrics(supabase, dateFrom, dateTo);
          break;
        case 'ai_usage':
          response.metrics.ai_usage = await getAIUsageMetrics(supabase, dateFrom, dateTo);
          break;
        case 'errors':
          response.metrics.errors = await getErrorMetrics(supabase, dateFrom, dateTo);
          break;
        case 'performance':
          response.metrics.performance = await getPerformanceMetrics(supabase, dateFrom, dateTo);
          break;
      }
    }

    logApiCall('POST', '/api/admin/analytics', userId, Date.now() - startTime, 200);
    return createSuccessResponse(res, response);

  } catch (error) {
    logApiCall('POST', '/api/admin/analytics', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Failed to generate analytics', 500);
  }
}

async function getUserMetrics(supabase: any, dateFrom: string, dateTo: string) {
  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // New signups in period
  const { count: newSignups } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo);

  // Active users (users who created content in period)
  const { data: activeUsersData } = await supabase
    .from('content_items')
    .select('user_id')
    .gte('captured_at', dateFrom)
    .lte('captured_at', dateTo);

  const activeUsers = new Set(activeUsersData?.map((item: any) => item.user_id) || []).size;

  // Simple retention calculation (users who were active in both periods)
  const previousPeriodStart = new Date(new Date(dateFrom).getTime() - (new Date(dateTo).getTime() - new Date(dateFrom).getTime()));
  const { data: previousActiveUsers } = await supabase
    .from('content_items')
    .select('user_id')
    .gte('captured_at', previousPeriodStart.toISOString())
    .lt('captured_at', dateFrom);

  const previousActiveSet = new Set(previousActiveUsers?.map((item: any) => item.user_id) || []);
  const currentActiveSet = new Set(activeUsersData?.map((item: any) => item.user_id) || []);
  const retainedUsers = [...previousActiveSet].filter(userId => currentActiveSet.has(userId)).length;
  const retentionRate = previousActiveSet.size > 0 ? retainedUsers / previousActiveSet.size : 0;

  return {
    total_users: totalUsers || 0,
    active_users: activeUsers,
    new_signups: newSignups || 0,
    retention_rate: Math.round(retentionRate * 100) / 100
  };
}

async function getContentMetrics(supabase: any, dateFrom: string, dateTo: string) {
  // Total content items
  const { count: totalItems } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'deleted');

  // Items created in period
  const { count: itemsCreated } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .gte('captured_at', dateFrom)
    .lte('captured_at', dateTo)
    .neq('status', 'deleted');

  // Items processed in period
  const { count: itemsProcessed } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .gte('processed_at', dateFrom)
    .lte('processed_at', dateTo)
    .eq('status', 'processed');

  // Popular sources
  const { data: sourcesData } = await supabase
    .from('content_items')
    .select('source')
    .gte('captured_at', dateFrom)
    .lte('captured_at', dateTo)
    .neq('status', 'deleted');

  const sourceCounts: Record<string, number> = {};
  sourcesData?.forEach((item: any) => {
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  });

  const popularSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Popular categories
  const { data: categoriesData } = await supabase
    .from('content_items')
    .select('categories')
    .gte('captured_at', dateFrom)
    .lte('captured_at', dateTo)
    .neq('status', 'deleted');

  const categoryCounts: Record<string, number> = {};
  categoriesData?.forEach((item: any) => {
    item.categories?.forEach((category: string) => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });

  const popularCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_items: totalItems || 0,
    items_created: itemsCreated || 0,
    items_processed: itemsProcessed || 0,
    popular_sources: popularSources,
    popular_categories: popularCategories
  };
}

async function getAIUsageMetrics(supabase: any, dateFrom: string, dateTo: string) {
  // AI processing jobs in period
  const { data: aiJobs } = await supabase
    .from('ai_processing_jobs')
    .select('status, tokens_consumed, cost_cents, processing_duration_ms')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo);

  const totalJobs = aiJobs?.length || 0;
  const successfulJobs = aiJobs?.filter((job: any) => job.status === 'completed').length || 0;
  const failedJobs = aiJobs?.filter((job: any) => job.status === 'failed').length || 0;

  const totalTokens = aiJobs?.reduce((sum: number, job: any) => sum + (job.tokens_consumed || 0), 0) || 0;
  const totalCost = aiJobs?.reduce((sum: number, job: any) => sum + (job.cost_cents || 0), 0) || 0;

  const processingTimes = aiJobs?.filter((job: any) => job.processing_duration_ms).map((job: any) => job.processing_duration_ms) || [];
  const avgProcessingTime = processingTimes.length > 0 ? processingTimes.reduce((a: number, b: number) => a + b, 0) / processingTimes.length : 0;

  return {
    total_jobs: totalJobs,
    successful_jobs: successfulJobs,
    failed_jobs: failedJobs,
    tokens_consumed: totalTokens,
    estimated_cost_cents: totalCost,
    average_processing_time_ms: Math.round(avgProcessingTime)
  };
}

async function getErrorMetrics(supabase: any, dateFrom: string, dateTo: string) {
  // For error metrics, we'd typically query from a separate error logging table
  // This is a simplified example

  const { data: analytics } = await supabase
    .from('usage_analytics')
    .select('event_type, event_data')
    .gte('occurred_at', dateFrom)
    .lte('occurred_at', dateTo);

  const totalRequests = analytics?.length || 0;
  const errorEvents = analytics?.filter((event: any) => event.event_type.includes('error')) || [];
  const errorRate = totalRequests > 0 ? errorEvents.length / totalRequests : 0;

  // Group errors by type
  const errorCounts: Record<string, number> = {};
  errorEvents.forEach((event: any) => {
    const errorType = event.event_data?.error_type || 'unknown';
    errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
  });

  const topErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const criticalErrors = errorEvents.filter((event: any) => event.event_data?.severity === 'critical').length;

  return {
    total_errors: errorEvents.length,
    error_rate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimal places
    top_errors: topErrors,
    critical_errors: criticalErrors
  };
}

async function getPerformanceMetrics(supabase: any, dateFrom: string, dateTo: string) {
  // For performance metrics, we'd typically query from a separate performance logging table
  // This is a simplified example using usage analytics

  const { data: analytics } = await supabase
    .from('usage_analytics')
    .select('event_data')
    .gte('occurred_at', dateFrom)
    .lte('occurred_at', dateTo);

  const requestEvents = analytics?.filter((event: any) => event.event_data?.response_time_ms) || [];
  const responseTimes = requestEvents.map((event: any) => event.event_data.response_time_ms);

  const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length : 0;

  // Calculate P95 (95th percentile)
  const sortedTimes = responseTimes.sort((a: number, b: number) => a - b);
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p95ResponseTime = sortedTimes.length > 0 ? sortedTimes[p95Index] || 0 : 0;

  const totalRequests = analytics?.length || 0;
  const successfulRequests = analytics?.filter((event: any) => !event.event_data?.error) || [];
  const rateLimitedRequests = analytics?.filter((event: any) => event.event_type === 'rate_limit_exceeded') || [];

  return {
    average_response_time_ms: Math.round(avgResponseTime),
    p95_response_time_ms: Math.round(p95ResponseTime),
    total_requests: totalRequests,
    successful_requests: successfulRequests.length,
    rate_limited_requests: rateLimitedRequests.length
  };
}