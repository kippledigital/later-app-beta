-- Initial schema for the Later app
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Create custom types
CREATE TYPE content_source AS ENUM (
  'email',
  'web_url',
  'voice_note',
  'screenshot',
  'manual_entry',
  'shared_content',
  'calendar_event',
  'location_based'
);

CREATE TYPE content_status AS ENUM (
  'captured',
  'processing',
  'processed',
  'archived',
  'deleted'
);

CREATE TYPE content_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE context_type AS ENUM (
  'location',
  'time',
  'calendar',
  'social',
  'work',
  'personal',
  'travel',
  'shopping'
);

CREATE TYPE notification_type AS ENUM (
  'reminder',
  'context_match',
  'smart_suggestion',
  'system_update'
);

-- Users table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Privacy and preferences
  privacy_level TEXT DEFAULT 'balanced' CHECK (privacy_level IN ('strict', 'balanced', 'open')),
  data_retention_days INTEGER DEFAULT 365,
  enable_ai_processing BOOLEAN DEFAULT true,
  enable_context_detection BOOLEAN DEFAULT true,
  enable_location_services BOOLEAN DEFAULT false,
  enable_calendar_integration BOOLEAN DEFAULT false,

  -- App settings
  notification_preferences JSONB DEFAULT '{"reminders": true, "suggestions": true, "updates": false}',
  interface_preferences JSONB DEFAULT '{"theme": "auto", "density": "comfortable", "animations": true}',

  -- Subscription and limits
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  monthly_content_limit INTEGER DEFAULT 100,
  storage_used_bytes BIGINT DEFAULT 0,

  CONSTRAINT valid_retention_period CHECK (data_retention_days >= 30 AND data_retention_days <= 2555) -- 30 days to 7 years
);

-- Content items table
CREATE TABLE content_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Core content data
  title TEXT,
  original_content TEXT,
  processed_content TEXT,
  summary TEXT,
  url TEXT,
  source content_source NOT NULL,
  status content_status DEFAULT 'captured',
  priority content_priority DEFAULT 'medium',

  -- AI-generated metadata
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  reading_time_minutes INTEGER,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 for AI processing confidence

  -- Context and timing
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  reminded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Location context (stored securely)
  capture_location JSONB, -- {lat, lng, accuracy, address, venue}
  relevant_locations JSONB DEFAULT '[]', -- Array of location contexts

  -- File attachments
  attachment_urls TEXT[] DEFAULT '{}',
  attachment_metadata JSONB DEFAULT '{}',

  -- User interaction
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  archive_reason TEXT,

  -- Search and performance
  search_vector tsvector,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content categories table
CREATE TABLE content_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color_hex TEXT DEFAULT '#6366f1',
  icon_name TEXT DEFAULT 'folder',
  description TEXT,
  parent_category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_system_category BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- Tags table
CREATE TABLE content_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color_hex TEXT DEFAULT '#6366f1',
  usage_count INTEGER DEFAULT 0,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- Content-category relationships
CREATE TABLE content_category_mappings (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT DEFAULT 'user' CHECK (assigned_by IN ('user', 'ai', 'system')),

  PRIMARY KEY (content_id, category_id)
);

-- Content-tag relationships
CREATE TABLE content_tag_mappings (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT DEFAULT 'user' CHECK (assigned_by IN ('user', 'ai', 'system')),
  confidence_score DECIMAL(3,2) DEFAULT 1.00,

  PRIMARY KEY (content_id, tag_id)
);

-- Context patterns table
CREATE TABLE context_patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pattern_name TEXT NOT NULL,
  context_type context_type NOT NULL,
  pattern_data JSONB NOT NULL, -- Location coords, time ranges, calendar patterns, etc.
  trigger_conditions JSONB NOT NULL,
  suggested_actions JSONB DEFAULT '[]',
  confidence_score DECIMAL(3,2) DEFAULT 0.50,
  usage_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart reminders table
CREATE TABLE smart_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  context_pattern_id UUID REFERENCES context_patterns(id) ON DELETE SET NULL,

  reminder_type notification_type DEFAULT 'reminder',
  trigger_conditions JSONB NOT NULL,
  message TEXT,
  scheduled_for TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,

  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- cron-like pattern for recurring reminders
  max_occurrences INTEGER,
  occurrence_count INTEGER DEFAULT 0,

  priority content_priority DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI processing jobs table
CREATE TABLE ai_processing_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('summarize', 'categorize', 'extract_entities', 'sentiment_analysis', 'generate_tags')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  input_data JSONB,
  output_data JSONB,
  error_message TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,

  model_used TEXT,
  tokens_consumed INTEGER,
  cost_cents INTEGER,

  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage analytics table
CREATE TABLE usage_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id UUID,
  device_info JSONB,

  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for analytics queries
  INDEX CONCURRENTLY idx_usage_analytics_user_event (user_id, event_type, occurred_at),
  INDEX CONCURRENTLY idx_usage_analytics_session (session_id, occurred_at)
);

-- User sessions table
CREATE TABLE user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  session_token TEXT UNIQUE NOT NULL,
  device_id TEXT,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,

  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API rate limiting table
CREATE TABLE api_rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET,
  endpoint TEXT NOT NULL,

  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL,

  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint, window_start),
  UNIQUE(ip_address, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_content_items_user_id ON content_items(user_id);
CREATE INDEX CONCURRENTLY idx_content_items_status ON content_items(status);
CREATE INDEX CONCURRENTLY idx_content_items_source ON content_items(source);
CREATE INDEX CONCURRENTLY idx_content_items_captured_at ON content_items(captured_at DESC);
CREATE INDEX CONCURRENTLY idx_content_items_scheduled_for ON content_items(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_content_items_tags ON content_items USING GIN(tags);
CREATE INDEX CONCURRENTLY idx_content_items_categories ON content_items USING GIN(categories);
CREATE INDEX CONCURRENTLY idx_content_items_search ON content_items USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_content_items_location ON content_items USING GIN(capture_location) WHERE capture_location IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_smart_reminders_user_scheduled ON smart_reminders(user_id, scheduled_for) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_smart_reminders_trigger_conditions ON smart_reminders USING GIN(trigger_conditions);

CREATE INDEX CONCURRENTLY idx_context_patterns_user_type ON context_patterns(user_id, context_type);
CREATE INDEX CONCURRENTLY idx_context_patterns_active ON context_patterns(user_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_ai_jobs_content_status ON ai_processing_jobs(content_id, status);
CREATE INDEX CONCURRENTLY idx_ai_jobs_pending ON ai_processing_jobs(created_at) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY idx_user_sessions_active ON user_sessions(user_id, expires_at) WHERE is_active = true;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_context_patterns_updated_at BEFORE UPDATE ON context_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_smart_reminders_updated_at BEFORE UPDATE ON smart_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_processing_jobs_updated_at BEFORE UPDATE ON ai_processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_rate_limits_updated_at BEFORE UPDATE ON api_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.processed_content, NEW.original_content, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.categories, ' ')), 'B');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_search_vector_trigger
  BEFORE INSERT OR UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

-- Create function to auto-expire old content based on user preferences
CREATE OR REPLACE FUNCTION auto_expire_old_content()
RETURNS void AS $$
BEGIN
  UPDATE content_items
  SET status = 'archived', archive_reason = 'auto_expired'
  WHERE status != 'archived'
    AND status != 'deleted'
    AND captured_at < NOW() - INTERVAL '1 day' * (
      SELECT data_retention_days
      FROM profiles
      WHERE profiles.id = content_items.user_id
    );
END;
$$ language 'plpgsql';

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;

  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- Insert default system categories
INSERT INTO content_categories (id, user_id, name, color_hex, icon_name, is_system_category) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'General', '#6366f1', 'folder', true),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Work', '#059669', 'briefcase', true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Personal', '#dc2626', 'user', true),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Shopping', '#7c3aed', 'shopping-cart', true),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Travel', '#ea580c', 'map', true),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'Health', '#16a34a', 'heart', true),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'Finance', '#0891b2', 'dollar-sign', true),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'Learning', '#c2410c', 'book', true);

COMMENT ON TABLE profiles IS 'Extended user profiles with preferences and settings';
COMMENT ON TABLE content_items IS 'Core content storage with AI processing and context data';
COMMENT ON TABLE content_categories IS 'User-defined and system categories for content organization';
COMMENT ON TABLE content_tags IS 'Flexible tagging system for content';
COMMENT ON TABLE context_patterns IS 'Learned patterns for context-aware suggestions';
COMMENT ON TABLE smart_reminders IS 'Context-aware reminder system';
COMMENT ON TABLE ai_processing_jobs IS 'Async AI processing job queue';
COMMENT ON TABLE usage_analytics IS 'Privacy-compliant usage analytics';
COMMENT ON TABLE user_sessions IS 'Secure session management';
COMMENT ON TABLE api_rate_limits IS 'Rate limiting and abuse prevention';