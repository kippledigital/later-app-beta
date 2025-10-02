-- Initial schema for the Later app (Fixed version)
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
  key_entities JSONB,
  sentiment_score FLOAT,
  reading_time_minutes INTEGER,
  word_count INTEGER,
  language TEXT DEFAULT 'en',

  -- Context and scheduling
  context JSONB,
  metadata JSONB,
  scheduled_for TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Search vector for full-text search
  search_vector TSVECTOR
);

-- User contexts table
CREATE TABLE user_contexts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  context_type context_type NOT NULL,
  name TEXT NOT NULL,
  rules JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content highlights table
CREATE TABLE content_highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  highlighted_text TEXT NOT NULL,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  position JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table
CREATE TABLE collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_public BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection items table
CREATE TABLE collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, content_id)
);

-- Consumption sessions table
CREATE TABLE consumption_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  progress_percentage FLOAT DEFAULT 0,
  device_info JSONB,
  context JSONB
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI processing logs table
CREATE TABLE ai_processing_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  processing_type TEXT NOT NULL,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  device_info JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline sync queue table
CREATE TABLE offline_sync_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_items_user_id ON content_items(user_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_created_at ON content_items(created_at);
CREATE INDEX idx_content_items_scheduled_for ON content_items(scheduled_for);
CREATE INDEX idx_content_items_search_vector ON content_items USING gin(search_vector);

CREATE INDEX idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX idx_content_highlights_user_id ON content_highlights(user_id);
CREATE INDEX idx_content_highlights_content_id ON content_highlights(content_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_consumption_sessions_user_id ON consumption_sessions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_ai_processing_logs_content_id ON ai_processing_logs(content_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_offline_sync_queue_user_id ON offline_sync_queue(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_contexts_updated_at
  BEFORE UPDATE ON user_contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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