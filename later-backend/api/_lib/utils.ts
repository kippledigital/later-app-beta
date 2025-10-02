// Utility functions for Vercel API routes
import { createSupabaseClient } from './auth';

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  source?: string;
  priority?: string;
  category?: string;
  tag?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export function parsePaginationParams(query: any): PaginationParams {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 items per page
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function parseSortParams(query: any): SortParams {
  const allowedSortFields = [
    'created_at', 'updated_at', 'captured_at', 'processed_at',
    'title', 'priority', 'view_count', 'reading_time_minutes'
  ];

  const sort_by = allowedSortFields.includes(query.sort_by) ? query.sort_by : 'captured_at';
  const sort_order = query.sort_order === 'asc' ? 'asc' : 'desc';

  return { sort_by, sort_order };
}

export function parseFilterParams(query: any): FilterParams {
  return {
    status: query.status,
    source: query.source,
    priority: query.priority,
    category: query.category,
    tag: query.tag,
    search: query.search,
    date_from: query.date_from,
    date_to: query.date_to
  };
}

export async function buildContentQuery(
  userId: string,
  filters: FilterParams,
  sort: SortParams,
  pagination: PaginationParams
) {
  const supabase = createSupabaseClient();

  let query = supabase
    .from('content_items')
    .select(`
      *,
      content_category_mappings(
        content_categories(name, color_hex, icon_name)
      ),
      content_tag_mappings(
        content_tags(name, color_hex)
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .neq('status', 'deleted');

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.source) {
    query = query.eq('source', filters.source);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters.category) {
    query = query.contains('categories', [filters.category]);
  }

  if (filters.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  if (filters.search) {
    query = query.textSearch('search_vector', filters.search);
  }

  if (filters.date_from) {
    query = query.gte('captured_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('captured_at', filters.date_to);
  }

  // Apply sorting
  query = query.order(sort.sort_by!, { ascending: sort.sort_order === 'asc' });

  // Apply pagination
  query = query.range(pagination.offset!, pagination.offset! + pagination.limit! - 1);

  return query;
}

export function validateContentInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.source) {
    errors.push('Source is required');
  }

  const validSources = ['email', 'web_url', 'voice_note', 'screenshot', 'manual_entry', 'shared_content', 'calendar_event', 'location_based'];
  if (data.source && !validSources.includes(data.source)) {
    errors.push('Invalid source');
  }

  if (data.priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(data.priority)) {
      errors.push('Invalid priority');
    }
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  if (data.categories && !Array.isArray(data.categories)) {
    errors.push('Categories must be an array');
  }

  if (data.url && data.url.length > 2048) {
    errors.push('URL too long');
  }

  if (data.title && data.title.length > 500) {
    errors.push('Title too long');
  }

  if (data.content && data.content.length > 10485760) { // 10MB
    errors.push('Content too large');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function checkUserLimits(userId: string): Promise<{
  canAddContent: boolean;
  remainingContent: number;
  storageUsed: number;
  storageLimit: number;
}> {
  const supabase = createSupabaseClient();

  // Get user profile with limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('monthly_content_limit, storage_used_bytes, subscription_tier')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  // Count current month's content
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: currentMonthCount } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('captured_at', startOfMonth.toISOString())
    .neq('status', 'deleted');

  const remainingContent = Math.max(0, profile.monthly_content_limit - (currentMonthCount || 0));

  // Storage limits by tier
  const storageLimits = {
    'free': 1073741824, // 1GB
    'premium': 10737418240, // 10GB
    'enterprise': 107374182400 // 100GB
  };

  const storageLimit = storageLimits[profile.subscription_tier as keyof typeof storageLimits] || storageLimits.free;

  return {
    canAddContent: remainingContent > 0,
    remainingContent,
    storageUsed: profile.storage_used_bytes || 0,
    storageLimit
  };
}

export function sanitizeOutput(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive fields
      if (['ip_address', 'session_token', 'error_message'].includes(key)) {
        continue;
      }

      // Truncate large text fields for list views
      if (key === 'original_content' && typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '...';
      } else {
        sanitized[key] = sanitizeOutput(value);
      }
    }

    return sanitized;
  }

  return data;
}

export function logApiCall(
  method: string,
  endpoint: string,
  userId?: string,
  duration?: number,
  status?: number,
  error?: any
) {
  console.log(JSON.stringify({
    level: error ? 'error' : 'info',
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    userId,
    duration,
    status,
    error: error?.message,
    stack: error?.stack
  }));
}