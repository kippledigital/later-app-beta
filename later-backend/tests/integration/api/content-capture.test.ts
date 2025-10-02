// Integration tests for content capture API workflow
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  setupTestDatabase,
  cleanup,
  TEST_USERS,
  TEST_CONFIG,
  createTestSupabaseClient,
} from '../../config/test-setup';

describe('Content Capture API Integration', () => {
  let supabase: any;

  beforeEach(async () => {
    supabase = await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('End-to-End Content Capture Flow', () => {
    it('should capture, extract, and process content successfully', async () => {
      // Step 1: Capture content
      const captureRequest = {
        url: 'https://example.com/article',
        source: 'web_url',
        metadata: {
          capture_method: 'share_extension',
          device_context: 'mobile',
        },
      };

      const { data: capturedContent, error: captureError } = await supabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          url: captureRequest.url,
          source: captureRequest.source,
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: captureRequest.metadata,
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        })
        .select()
        .single();

      expect(captureError).toBeNull();
      expect(capturedContent).toBeDefined();
      expect(capturedContent.status).toBe('captured');

      // Step 2: Process content extraction
      const extractionResult = {
        title: 'Test Article Title',
        content: 'This is the extracted content from the article.',
        metadata: {
          description: 'Article description',
          author: 'Test Author',
          reading_time: 3,
          word_count: 600,
        },
      };

      const { error: updateError } = await supabase
        .from('content_items')
        .update({
          title: extractionResult.title,
          original_content: extractionResult.content,
          status: 'processing',
          reading_time_minutes: extractionResult.metadata.reading_time,
        })
        .eq('id', capturedContent.id);

      expect(updateError).toBeNull();

      // Step 3: AI processing
      const aiResult = {
        summary: 'A concise summary of the article content.',
        tags: ['technology', 'productivity'],
        categories: ['articles'],
        sentiment_score: 0.7,
        confidence_score: 0.85,
      };

      const { error: aiUpdateError } = await supabase
        .from('content_items')
        .update({
          processed_content: aiResult.summary,
          tags: aiResult.tags,
          categories: aiResult.categories,
          sentiment_score: aiResult.sentiment_score,
          confidence_score: aiResult.confidence_score,
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', capturedContent.id);

      expect(aiUpdateError).toBeNull();

      // Step 4: Verify final state
      const { data: finalContent, error: fetchError } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', capturedContent.id)
        .single();

      expect(fetchError).toBeNull();
      expect(finalContent.status).toBe('processed');
      expect(finalContent.title).toBe(extractionResult.title);
      expect(finalContent.processed_content).toBe(aiResult.summary);
      expect(finalContent.tags).toEqual(aiResult.tags);
      expect(finalContent.categories).toEqual(aiResult.categories);
      expect(finalContent.processed_at).toBeDefined();
    });

    it('should handle content capture with attachments', async () => {
      const captureRequest = {
        source: 'screenshot',
        metadata: {
          capture_method: 'camera',
          device_context: 'mobile',
          location: {
            lat: 37.7749,
            lng: -122.4194,
            accuracy: 10,
          },
        },
        attachments: [
          {
            type: 'image',
            url: 'https://storage.example.com/screenshot-123.png',
            metadata: {
              size: 1024000,
              dimensions: { width: 1080, height: 1920 },
            },
          },
        ],
      };

      const { data: capturedContent, error } = await supabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          source: captureRequest.source,
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          capture_location: captureRequest.metadata.location,
          attachment_urls: captureRequest.attachments.map(a => a.url),
          attachment_metadata: {
            attachments: captureRequest.attachments,
          },
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(capturedContent.attachment_urls).toHaveLength(1);
      expect(capturedContent.capture_location).toEqual(captureRequest.metadata.location);
      expect(capturedContent.attachment_metadata.attachments).toHaveLength(1);
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce required fields', async () => {
      const invalidRequest = {
        // Missing required fields
        status: 'captured',
      };

      const { error } = await supabase
        .from('content_items')
        .insert(invalidRequest);

      expect(error).toBeDefined();
      expect(error.message).toContain('null value');
    });

    it('should validate enum values', async () => {
      const invalidStatus = {
        user_id: TEST_USERS.validUser.id,
        source: 'web_url',
        status: 'invalid_status', // Invalid enum value
        priority: 'medium',
        tags: [],
        categories: [],
        captured_at: new Date().toISOString(),
        attachment_urls: [],
        attachment_metadata: {},
        view_count: 0,
        is_favorite: false,
        is_archived: false,
      };

      const { error } = await supabase
        .from('content_items')
        .insert(invalidStatus);

      expect(error).toBeDefined();
      expect(error.message).toContain('invalid input value');
    });

    it('should validate JSON schema for metadata fields', async () => {
      const validContent = {
        user_id: TEST_USERS.validUser.id,
        source: 'web_url',
        status: 'captured',
        priority: 'medium',
        tags: ['valid', 'tags'],
        categories: ['valid-category'],
        captured_at: new Date().toISOString(),
        attachment_urls: ['https://example.com/file.pdf'],
        attachment_metadata: {
          validField: 'value',
          nestedObject: {
            key: 'value',
          },
        },
        view_count: 0,
        is_favorite: false,
        is_archived: false,
      };

      const { error } = await supabase
        .from('content_items')
        .insert(validContent);

      expect(error).toBeNull();
    });
  });

  describe('Row Level Security (RLS)', () => {
    it('should prevent users from accessing other users content', async () => {
      // Create content for user 1
      const { data: user1Content } = await supabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        })
        .select()
        .single();

      // Try to access with different user context
      const unauthorizedSupabase = createTestSupabaseClient();
      await unauthorizedSupabase.auth.signInWithPassword({
        email: TEST_USERS.unauthorizedUser.email,
        password: 'test-password',
      });

      const { data: accessAttempt, error } = await unauthorizedSupabase
        .from('content_items')
        .select('*')
        .eq('id', user1Content.id);

      // Should return empty result due to RLS
      expect(accessAttempt).toEqual([]);
    });

    it('should allow users to access their own content', async () => {
      const userSupabase = createTestSupabaseClient();
      await userSupabase.auth.signInWithPassword({
        email: TEST_USERS.validUser.email,
        password: 'test-password',
      });

      // Create content
      const { data: createdContent } = await userSupabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        })
        .select()
        .single();

      // Access own content
      const { data: ownContent, error } = await userSupabase
        .from('content_items')
        .select('*')
        .eq('id', createdContent.id)
        .single();

      expect(error).toBeNull();
      expect(ownContent).toBeDefined();
      expect(ownContent.id).toBe(createdContent.id);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk content insertion efficiently', async () => {
      const startTime = performance.now();

      const bulkContent = Array(100).fill(null).map((_, index) => ({
        user_id: TEST_USERS.validUser.id,
        title: `Bulk Content ${index}`,
        source: 'web_url',
        status: 'captured',
        priority: 'medium',
        tags: [`tag-${index % 5}`],
        categories: [`category-${index % 3}`],
        captured_at: new Date().toISOString(),
        attachment_urls: [],
        attachment_metadata: {},
        view_count: 0,
        is_favorite: false,
        is_archived: false,
      }));

      const { data, error } = await supabase
        .from('content_items')
        .insert(bulkContent)
        .select();

      const duration = performance.now() - startTime;

      expect(error).toBeNull();
      expect(data).toHaveLength(100);
      expect(duration).toBeLessThan(TEST_CONFIG.performance.maxResponseTime);
    });

    it('should optimize queries with proper indexing', async () => {
      // Create test content with various attributes
      const testContent = Array(50).fill(null).map((_, index) => ({
        user_id: TEST_USERS.validUser.id,
        title: `Test Content ${index}`,
        source: 'web_url',
        status: index % 2 === 0 ? 'processed' : 'captured',
        priority: ['low', 'medium', 'high'][index % 3],
        tags: [`tag-${index % 10}`],
        categories: [`category-${index % 5}`],
        captured_at: new Date(Date.now() - index * 86400000).toISOString(), // Spread over days
        attachment_urls: [],
        attachment_metadata: {},
        view_count: index,
        is_favorite: index % 10 === 0,
        is_archived: index % 15 === 0,
      }));

      await supabase.from('content_items').insert(testContent);

      const startTime = performance.now();

      // Complex query that should use indexes
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', TEST_USERS.validUser.id)
        .eq('status', 'processed')
        .in('priority', ['medium', 'high'])
        .contains('tags', ['tag-1'])
        .order('captured_at', { ascending: false })
        .limit(10);

      const queryDuration = performance.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryDuration).toBeLessThan(100); // Should be very fast with proper indexes
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle database connection failures gracefully', async () => {
      // Simulate connection failure by using invalid credentials
      const invalidSupabase = createTestSupabaseClient();

      // Override with invalid URL to simulate connection failure
      const originalUrl = TEST_CONFIG.supabase.url;
      TEST_CONFIG.supabase.url = 'http://invalid-url:54321';

      try {
        const { error } = await invalidSupabase
          .from('content_items')
          .insert({
            user_id: TEST_USERS.validUser.id,
            source: 'web_url',
            status: 'captured',
            priority: 'medium',
            tags: [],
            categories: [],
            captured_at: new Date().toISOString(),
            attachment_urls: [],
            attachment_metadata: {},
            view_count: 0,
            is_favorite: false,
            is_archived: false,
          });

        expect(error).toBeDefined();
        expect(error.message).toContain('connection');
      } finally {
        // Restore original URL
        TEST_CONFIG.supabase.url = originalUrl;
      }
    });

    it('should handle concurrent updates with conflict resolution', async () => {
      // Create initial content
      const { data: initialContent } = await supabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        })
        .select()
        .single();

      // Simulate concurrent updates
      const update1Promise = supabase
        .from('content_items')
        .update({ view_count: 1, tags: ['tag1'] })
        .eq('id', initialContent.id);

      const update2Promise = supabase
        .from('content_items')
        .update({ view_count: 2, tags: ['tag2'] })
        .eq('id', initialContent.id);

      const [result1, result2] = await Promise.all([update1Promise, update2Promise]);

      // Both updates should succeed (last write wins)
      expect(result1.error).toBeNull();
      expect(result2.error).toBeNull();

      // Verify final state
      const { data: finalContent } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', initialContent.id)
        .single();

      expect(finalContent.view_count).toBeGreaterThan(0);
      expect(finalContent.tags).toHaveLength(1);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Try to create content with non-existent user
      const { error } = await supabase
        .from('content_items')
        .insert({
          user_id: 'non-existent-user-id',
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        });

      expect(error).toBeDefined();
      expect(error.code).toBe('23503'); // Foreign key violation
    });

    it('should enforce data constraints', async () => {
      // Test negative view count
      const { error: negativeViewError } = await supabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: -1, // Should fail constraint
          is_favorite: false,
          is_archived: false,
        });

      expect(negativeViewError).toBeDefined();

      // Test invalid sentiment score range
      const { error: sentimentError } = await supabase
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [],
          categories: [],
          sentiment_score: 2.0, // Should be between -1 and 1
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        });

      expect(sentimentError).toBeDefined();
    });
  });
});