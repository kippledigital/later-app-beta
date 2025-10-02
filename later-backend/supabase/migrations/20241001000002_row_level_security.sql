-- Row Level Security (RLS) policies for the Later app
-- Enable RLS on all tables

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is service role
CREATE OR REPLACE FUNCTION auth.is_service_role() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  ) = 'service_role'
$$ LANGUAGE SQL STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.user_id() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.user_id() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.user_id() = id);

-- Service role can manage all profiles
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (auth.is_service_role());

-- Content items policies
CREATE POLICY "Users can view own content" ON content_items
  FOR SELECT USING (auth.user_id() = user_id);

CREATE POLICY "Users can insert own content" ON content_items
  FOR INSERT WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update own content" ON content_items
  FOR UPDATE USING (auth.user_id() = user_id);

CREATE POLICY "Users can delete own content" ON content_items
  FOR DELETE USING (auth.user_id() = user_id);

-- Service role can manage all content for AI processing
CREATE POLICY "Service role can manage content" ON content_items
  FOR ALL USING (auth.is_service_role());

-- Content categories policies
CREATE POLICY "Users can view own categories" ON content_categories
  FOR SELECT USING (
    auth.user_id() = user_id OR
    is_system_category = true
  );

CREATE POLICY "Users can insert own categories" ON content_categories
  FOR INSERT WITH CHECK (auth.user_id() = user_id AND is_system_category = false);

CREATE POLICY "Users can update own categories" ON content_categories
  FOR UPDATE USING (auth.user_id() = user_id AND is_system_category = false);

CREATE POLICY "Users can delete own categories" ON content_categories
  FOR DELETE USING (auth.user_id() = user_id AND is_system_category = false);

-- Service role can manage all categories
CREATE POLICY "Service role can manage categories" ON content_categories
  FOR ALL USING (auth.is_service_role());

-- Content tags policies
CREATE POLICY "Users can view own tags" ON content_tags
  FOR SELECT USING (auth.user_id() = user_id);

CREATE POLICY "Users can insert own tags" ON content_tags
  FOR INSERT WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update own tags" ON content_tags
  FOR UPDATE USING (auth.user_id() = user_id);

CREATE POLICY "Users can delete own tags" ON content_tags
  FOR DELETE USING (auth.user_id() = user_id);

-- Service role can manage all tags
CREATE POLICY "Service role can manage tags" ON content_tags
  FOR ALL USING (auth.is_service_role());

-- Content category mappings policies
CREATE POLICY "Users can view own content category mappings" ON content_category_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_category_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can insert own content category mappings" ON content_category_mappings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_category_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can update own content category mappings" ON content_category_mappings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_category_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can delete own content category mappings" ON content_category_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_category_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

-- Service role can manage all content category mappings
CREATE POLICY "Service role can manage content category mappings" ON content_category_mappings
  FOR ALL USING (auth.is_service_role());

-- Content tag mappings policies (similar to category mappings)
CREATE POLICY "Users can view own content tag mappings" ON content_tag_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_tag_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can insert own content tag mappings" ON content_tag_mappings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_tag_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can update own content tag mappings" ON content_tag_mappings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_tag_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can delete own content tag mappings" ON content_tag_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = content_tag_mappings.content_id
      AND user_id = auth.user_id()
    )
  );

-- Service role can manage all content tag mappings
CREATE POLICY "Service role can manage content tag mappings" ON content_tag_mappings
  FOR ALL USING (auth.is_service_role());

-- Context patterns policies
CREATE POLICY "Users can view own context patterns" ON context_patterns
  FOR SELECT USING (auth.user_id() = user_id);

CREATE POLICY "Users can insert own context patterns" ON context_patterns
  FOR INSERT WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update own context patterns" ON context_patterns
  FOR UPDATE USING (auth.user_id() = user_id);

CREATE POLICY "Users can delete own context patterns" ON context_patterns
  FOR DELETE USING (auth.user_id() = user_id);

-- Service role can manage all context patterns
CREATE POLICY "Service role can manage context patterns" ON context_patterns
  FOR ALL USING (auth.is_service_role());

-- Smart reminders policies
CREATE POLICY "Users can view own reminders" ON smart_reminders
  FOR SELECT USING (auth.user_id() = user_id);

CREATE POLICY "Users can insert own reminders" ON smart_reminders
  FOR INSERT WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update own reminders" ON smart_reminders
  FOR UPDATE USING (auth.user_id() = user_id);

CREATE POLICY "Users can delete own reminders" ON smart_reminders
  FOR DELETE USING (auth.user_id() = user_id);

-- Service role can manage all reminders for processing
CREATE POLICY "Service role can manage reminders" ON smart_reminders
  FOR ALL USING (auth.is_service_role());

-- AI processing jobs policies
CREATE POLICY "Users can view own AI jobs" ON ai_processing_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_items
      WHERE id = ai_processing_jobs.content_id
      AND user_id = auth.user_id()
    )
  );

-- Only service role can insert/update/delete AI jobs
CREATE POLICY "Service role can manage AI jobs" ON ai_processing_jobs
  FOR ALL USING (auth.is_service_role());

-- Usage analytics policies
CREATE POLICY "Users can view own analytics" ON usage_analytics
  FOR SELECT USING (auth.user_id() = user_id);

CREATE POLICY "Users can insert own analytics" ON usage_analytics
  FOR INSERT WITH CHECK (auth.user_id() = user_id);

-- Service role can manage all analytics
CREATE POLICY "Service role can manage analytics" ON usage_analytics
  FOR ALL USING (auth.is_service_role());

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.user_id() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.user_id() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.user_id() = user_id);

-- Service role can manage all sessions for cleanup
CREATE POLICY "Service role can manage sessions" ON user_sessions
  FOR ALL USING (auth.is_service_role());

-- API rate limits policies
CREATE POLICY "Users can view own rate limits" ON api_rate_limits
  FOR SELECT USING (auth.user_id() = user_id);

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits" ON api_rate_limits
  FOR ALL USING (auth.is_service_role());

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create default personal categories for the new user
  INSERT INTO public.content_categories (user_id, name, color_hex, icon_name, is_system_category)
  SELECT
    NEW.id,
    name,
    color_hex,
    icon_name,
    false
  FROM public.content_categories
  WHERE is_system_category = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically cleanup user data on account deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- This will cascade delete all related records due to foreign key constraints
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup on user deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Create function to check user subscription limits
CREATE OR REPLACE FUNCTION public.check_content_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_limit INTEGER;
  current_count INTEGER;
BEGIN
  -- Get user's monthly limit
  SELECT monthly_content_limit INTO user_limit
  FROM profiles
  WHERE id = user_uuid;

  -- Count current month's content
  SELECT COUNT(*) INTO current_count
  FROM content_items
  WHERE user_id = user_uuid
    AND captured_at >= date_trunc('month', NOW())
    AND status != 'deleted';

  RETURN current_count < user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update tag usage counts
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_tags
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain tag usage counts
CREATE TRIGGER maintain_tag_usage_count
  AFTER INSERT OR DELETE ON content_tag_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_tag_usage_count();

-- Create function to update user storage usage
CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
  attachment_size BIGINT := 0;
  old_attachment_size BIGINT := 0;
BEGIN
  -- Calculate size of attachments (simplified - would need actual file size calculation)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    attachment_size := COALESCE(array_length(NEW.attachment_urls, 1), 0) * 1048576; -- Estimate 1MB per attachment
  END IF;

  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    old_attachment_size := COALESCE(array_length(OLD.attachment_urls, 1), 0) * 1048576;
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET storage_used_bytes = storage_used_bytes + attachment_size
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE profiles
    SET storage_used_bytes = storage_used_bytes + attachment_size - old_attachment_size
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET storage_used_bytes = GREATEST(0, storage_used_bytes - old_attachment_size)
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to maintain storage usage
CREATE TRIGGER maintain_storage_usage
  AFTER INSERT OR UPDATE OR DELETE ON content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_storage_usage();

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile and default categories on signup';
COMMENT ON FUNCTION public.handle_user_delete() IS 'Cleans up user data on account deletion';
COMMENT ON FUNCTION public.check_content_limit(UUID) IS 'Checks if user has reached their monthly content limit';
COMMENT ON FUNCTION public.update_tag_usage_count() IS 'Maintains accurate usage counts for content tags';
COMMENT ON FUNCTION public.update_storage_usage() IS 'Tracks user storage usage for billing and limits';