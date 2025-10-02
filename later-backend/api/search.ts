// API endpoint for content search
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  AuthenticatedRequest,
  withAuth,
  handleCORS,
  createErrorResponse,
  createSuccessResponse,
  createSupabaseClient
} from './_lib/auth';
import {
  parsePaginationParams,
  sanitizeOutput,
  logApiCall
} from './_lib/utils';

interface SearchRequest {
  query: string;
  filters?: {
    categories?: string[];
    tags?: string[];
    sources?: string[];
    priorities?: string[];
    date_from?: string;
    date_to?: string;
  };
  search_type?: 'full_text' | 'semantic' | 'hybrid';
  limit?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // Handle CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return createErrorResponse(res, 'Method not allowed', 405);
  }

  return await withAuth(handleSearch)(req as AuthenticatedRequest, res);
}

async function handleSearch(req: AuthenticatedRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    const userId = req.userId!;
    const supabase = createSupabaseClient();
    const searchRequest: SearchRequest = req.body;

    if (!searchRequest.query || searchRequest.query.trim().length < 2) {
      return createErrorResponse(res, 'Search query must be at least 2 characters', 400, 'INVALID_QUERY');
    }

    const searchQuery = searchRequest.query.trim();
    const searchType = searchRequest.search_type || 'full_text';
    const limit = Math.min(searchRequest.limit || 20, 100);

    logApiCall('POST', '/api/search', userId, 0, 0); // Log start

    let results: any[] = [];

    switch (searchType) {
      case 'full_text':
        results = await performFullTextSearch(supabase, userId, searchQuery, searchRequest.filters, limit);
        break;
      case 'semantic':
        results = await performSemanticSearch(supabase, userId, searchQuery, searchRequest.filters, limit);
        break;
      case 'hybrid':
        const fullTextResults = await performFullTextSearch(supabase, userId, searchQuery, searchRequest.filters, limit / 2);
        const semanticResults = await performSemanticSearch(supabase, userId, searchQuery, searchRequest.filters, limit / 2);
        results = combineSearchResults(fullTextResults, semanticResults, limit);
        break;
      default:
        return createErrorResponse(res, 'Invalid search type', 400, 'INVALID_SEARCH_TYPE');
    }

    // Log search analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: userId,
        event_type: 'content_search',
        event_data: {
          query: searchQuery,
          search_type: searchType,
          results_count: results.length,
          has_filters: !!searchRequest.filters
        }
      });

    const response = {
      query: searchQuery,
      search_type: searchType,
      results: sanitizeOutput(results),
      total_results: results.length,
      search_metadata: {
        query_time_ms: Date.now() - startTime,
        search_type: searchType,
        filters_applied: searchRequest.filters ? Object.keys(searchRequest.filters).length : 0
      }
    };

    logApiCall('POST', '/api/search', userId, Date.now() - startTime, 200);
    return createSuccessResponse(res, response);

  } catch (error) {
    logApiCall('POST', '/api/search', req.userId, Date.now() - startTime, 500, error);
    return createErrorResponse(res, 'Search failed', 500, 'SEARCH_ERROR');
  }
}

async function performFullTextSearch(
  supabase: any,
  userId: string,
  query: string,
  filters: any = {},
  limit: number
): Promise<any[]> {

  // Prepare search query with PostgreSQL full-text search
  const searchTerms = query
    .split(/\s+/)
    .filter(term => term.length > 1)
    .map(term => `${term}:*`)
    .join(' & ');

  let dbQuery = supabase
    .from('content_items')
    .select(`
      id, title, summary, url, source, priority, tags, categories,
      captured_at, reading_time_minutes, is_favorite,
      ts_rank(search_vector, to_tsquery('english', $1)) as relevance_score,
      content_category_mappings(
        content_categories(name, color_hex)
      ),
      content_tag_mappings(
        content_tags(name, color_hex)
      )
    `)
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .textSearch('search_vector', searchTerms)
    .order('relevance_score', { ascending: false })
    .limit(limit);

  // Apply filters
  dbQuery = applySearchFilters(dbQuery, filters);

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Full-text search error:', error);
    return [];
  }

  return data || [];
}

async function performSemanticSearch(
  supabase: any,
  userId: string,
  query: string,
  filters: any = {},
  limit: number
): Promise<any[]> {

  // For semantic search, we would typically use vector embeddings
  // This is a simplified implementation using keyword matching and content analysis

  const keywords = extractSearchKeywords(query);

  let dbQuery = supabase
    .from('content_items')
    .select(`
      id, title, summary, url, source, priority, tags, categories,
      captured_at, reading_time_minutes, is_favorite, original_content,
      content_category_mappings(
        content_categories(name, color_hex)
      ),
      content_tag_mappings(
        content_tags(name, color_hex)
      )
    `)
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .limit(limit * 2); // Get more for scoring

  // Apply filters
  dbQuery = applySearchFilters(dbQuery, filters);

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Semantic search error:', error);
    return [];
  }

  if (!data?.length) return [];

  // Score results based on semantic similarity
  const scoredResults = data.map((item: any) => {
    const semanticScore = calculateSemanticScore(item, query, keywords);
    return {
      ...item,
      relevance_score: semanticScore
    };
  });

  // Sort by semantic score and return top results
  return scoredResults
    .filter(item => item.relevance_score > 0.1)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);
}

function combineSearchResults(fullTextResults: any[], semanticResults: any[], limit: number): any[] {
  const resultMap = new Map();

  // Add full-text results with boost
  fullTextResults.forEach(result => {
    resultMap.set(result.id, {
      ...result,
      relevance_score: (result.relevance_score || 0) * 1.2, // Boost full-text matches
      search_source: 'full_text'
    });
  });

  // Add or merge semantic results
  semanticResults.forEach(result => {
    if (resultMap.has(result.id)) {
      // Combine scores for items found in both searches
      const existing = resultMap.get(result.id);
      existing.relevance_score = Math.max(existing.relevance_score, result.relevance_score);
      existing.search_source = 'hybrid';
    } else {
      resultMap.set(result.id, {
        ...result,
        search_source: 'semantic'
      });
    }
  });

  // Sort by relevance and return top results
  return Array.from(resultMap.values())
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);
}

function applySearchFilters(query: any, filters: any): any {
  if (filters.categories?.length) {
    query = query.overlaps('categories', filters.categories);
  }

  if (filters.tags?.length) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters.sources?.length) {
    query = query.in('source', filters.sources);
  }

  if (filters.priorities?.length) {
    query = query.in('priority', filters.priorities);
  }

  if (filters.date_from) {
    query = query.gte('captured_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('captured_at', filters.date_to);
  }

  return query;
}

function extractSearchKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'but', 'day', 'get', 'has', 'him', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who'].includes(word));
}

function calculateSemanticScore(item: any, query: string, keywords: string[]): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  // Title matching (highest weight)
  if (item.title) {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 0.5;
    } else {
      // Keyword matching in title
      keywords.forEach(keyword => {
        if (titleLower.includes(keyword)) {
          score += 0.2;
        }
      });
    }
  }

  // Summary matching
  if (item.summary) {
    const summaryLower = item.summary.toLowerCase();
    if (summaryLower.includes(queryLower)) {
      score += 0.3;
    } else {
      keywords.forEach(keyword => {
        if (summaryLower.includes(keyword)) {
          score += 0.1;
        }
      });
    }
  }

  // Tag matching
  if (item.tags?.length) {
    const tagsText = item.tags.join(' ').toLowerCase();
    keywords.forEach(keyword => {
      if (tagsText.includes(keyword)) {
        score += 0.15;
      }
    });
  }

  // Category matching
  if (item.categories?.length) {
    const categoriesText = item.categories.join(' ').toLowerCase();
    keywords.forEach(keyword => {
      if (categoriesText.includes(keyword)) {
        score += 0.1;
      }
    });
  }

  // Content matching (lower weight due to noise)
  if (item.original_content) {
    const contentLower = item.original_content.toLowerCase();
    if (contentLower.includes(queryLower)) {
      score += 0.2;
    } else {
      let keywordMatches = 0;
      keywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          keywordMatches++;
        }
      });
      score += Math.min(0.2, keywordMatches * 0.05);
    }
  }

  // Boost for favorites
  if (item.is_favorite) {
    score *= 1.1;
  }

  // Recency boost (content from last 7 days gets small boost)
  const daysSinceCapture = (Date.now() - new Date(item.captured_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCapture <= 7) {
    score *= 1.05;
  }

  return Math.min(1.0, score);
}