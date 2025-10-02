// Shared types for Edge Functions

export interface ContentItem {
  id: string;
  user_id: string;
  title?: string;
  original_content?: string;
  processed_content?: string;
  summary?: string;
  url?: string;
  source: 'email' | 'web_url' | 'voice_note' | 'screenshot' | 'manual_entry' | 'shared_content' | 'calendar_event' | 'location_based';
  status: 'captured' | 'processing' | 'processed' | 'archived' | 'deleted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  categories: string[];
  sentiment_score?: number;
  reading_time_minutes?: number;
  confidence_score?: number;
  captured_at: string;
  processed_at?: string;
  capture_location?: {
    lat: number;
    lng: number;
    accuracy: number;
    address?: string;
    venue?: string;
  };
  attachment_urls: string[];
  attachment_metadata: Record<string, any>;
  view_count: number;
  is_favorite: boolean;
  is_archived: boolean;
}

export interface AIProcessingJob {
  id: string;
  content_id: string;
  job_type: 'summarize' | 'categorize' | 'extract_entities' | 'sentiment_analysis' | 'generate_tags';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  model_used?: string;
  tokens_consumed?: number;
  cost_cents?: number;
  retry_count: number;
  max_retries: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  tokens_used?: number;
  processing_time_ms?: number;
}

export interface ContentExtractionResult {
  title?: string;
  content: string;
  metadata?: {
    description?: string;
    author?: string;
    publish_date?: string;
    image_url?: string;
    reading_time?: number;
  };
  error?: string;
}

export interface AIResponse {
  summary?: string;
  tags?: string[];
  categories?: string[];
  sentiment_score?: number;
  confidence_score?: number;
  reading_time_minutes?: number;
  key_entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

export interface ContextPattern {
  id: string;
  user_id: string;
  pattern_name: string;
  context_type: 'location' | 'time' | 'calendar' | 'social' | 'work' | 'personal' | 'travel' | 'shopping';
  pattern_data: Record<string, any>;
  trigger_conditions: Record<string, any>;
  suggested_actions: Array<{
    action: string;
    confidence: number;
    data?: Record<string, any>;
  }>;
  confidence_score: number;
  usage_count: number;
  is_active: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Environment variables interface
export interface EnvVars {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  MAX_CONTENT_SIZE?: string;
  CONTENT_EXTRACTION_TIMEOUT?: string;
}