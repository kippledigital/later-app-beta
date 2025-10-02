// Test configuration and setup for backend tests
import { createClient } from '@supabase/supabase-js';

// Test environment configuration
export const TEST_CONFIG = {
  supabase: {
    url: process.env.SUPABASE_TEST_URL || 'http://localhost:54321',
    serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || 'test-service-role-key',
    anonKey: process.env.SUPABASE_TEST_ANON_KEY || 'test-anon-key',
  },
  database: {
    resetBetweenTests: true,
    seedData: true,
  },
  external: {
    openai: {
      apiKey: 'test-openai-key',
      mockResponses: true,
    },
  },
  performance: {
    maxResponseTime: 2000, // 2 seconds
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  },
  rateLimiting: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
};

// Create test Supabase client
export function createTestSupabaseClient() {
  return createClient(
    TEST_CONFIG.supabase.url,
    TEST_CONFIG.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Test user setup
export const TEST_USERS = {
  validUser: {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
  },
  premiumUser: {
    id: 'test-user-premium',
    email: 'premium@example.com',
    name: 'Premium User',
  },
  unauthorizedUser: {
    id: 'test-user-unauthorized',
    email: 'unauthorized@example.com',
    name: 'Unauthorized User',
  },
};

// Test data fixtures
export const TEST_CONTENT = {
  validUrl: 'https://example.com/article',
  invalidUrl: 'not-a-url',
  longContent: 'A'.repeat(10000),
  htmlContent: `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Article</title>
      <meta property="og:description" content="Test description">
    </head>
    <body>
      <article>
        <h1>Test Article Title</h1>
        <p>This is test content for extraction.</p>
      </article>
    </body>
    </html>
  `,
  expectedExtraction: {
    title: 'Test Article Title',
    content: 'Test Article Title This is test content for extraction.',
    metadata: {
      description: 'Test description',
    },
  },
};

// Mock fetch responses
export const MOCK_RESPONSES = {
  successfulHtml: {
    status: 200,
    headers: { 'content-type': 'text/html' },
    text: () => Promise.resolve(TEST_CONTENT.htmlContent),
  },
  notFound: {
    status: 404,
    statusText: 'Not Found',
  },
  timeout: {
    // Simulate timeout by never resolving
    promise: new Promise(() => {}),
  },
  nonHtml: {
    status: 200,
    headers: { 'content-type': 'application/json' },
    text: () => Promise.resolve('{}'),
  },
};

// Database setup helpers
export async function setupTestDatabase() {
  const supabase = createTestSupabaseClient();

  // Reset database to clean state
  if (TEST_CONFIG.database.resetBetweenTests) {
    await resetDatabase(supabase);
  }

  // Seed with test data
  if (TEST_CONFIG.database.seedData) {
    await seedTestData(supabase);
  }

  return supabase;
}

export async function resetDatabase(supabase: any) {
  // Clear test data (preserve schema)
  const tables = [
    'content_items',
    'ai_processing_jobs',
    'context_patterns',
    'user_profiles',
    'rate_limits',
  ];

  for (const table of tables) {
    await supabase
      .from(table)
      .delete()
      .match({}); // Delete all rows
  }
}

export async function seedTestData(supabase: any) {
  // Create test users
  for (const [key, user] of Object.entries(TEST_USERS)) {
    await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: new Date().toISOString(),
        settings: {},
      });
  }

  // Create test content items
  await supabase
    .from('content_items')
    .upsert([
      {
        id: 'test-content-1',
        user_id: TEST_USERS.validUser.id,
        title: 'Test Article',
        original_content: 'Test content',
        source: 'web_url',
        status: 'processed',
        priority: 'medium',
        tags: ['test'],
        categories: ['articles'],
        captured_at: new Date().toISOString(),
        attachment_urls: [],
        attachment_metadata: {},
        view_count: 0,
        is_favorite: false,
        is_archived: false,
      },
    ]);
}

// Mock external services
export function setupMocks() {
  // Mock fetch for web content extraction
  const originalFetch = global.fetch;

  global.fetch = jest.fn();

  return {
    mockFetch: global.fetch as jest.MockedFunction<typeof fetch>,
    restoreFetch: () => {
      global.fetch = originalFetch;
    },
  };
}

// Performance monitoring helpers
export function measurePerformance<T>(fn: () => Promise<T>) {
  return async (): Promise<{ result: T; duration: number; memory: number }> => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const result = await fn();

    const duration = performance.now() - startTime;
    const memory = process.memoryUsage().heapUsed - startMemory;

    return { result, duration, memory };
  };
}

// Assertion helpers
export function assertPerformance(metrics: { duration: number; memory: number }) {
  expect(metrics.duration).toBeLessThan(TEST_CONFIG.performance.maxResponseTime);
  expect(metrics.memory).toBeLessThan(TEST_CONFIG.performance.maxMemoryUsage);
}

// Error simulation helpers
export const ERROR_SCENARIOS = {
  networkError: () => {
    throw new Error('Network error');
  },
  timeoutError: () => {
    throw new Error('Request timeout');
  },
  authError: () => {
    throw new Error('Unauthorized');
  },
  rateLimitError: () => {
    throw new Error('Rate limit exceeded');
  },
  validationError: () => {
    throw new Error('Invalid input');
  },
};

// Cleanup helper
export async function cleanup() {
  const supabase = createTestSupabaseClient();
  await resetDatabase(supabase);
}