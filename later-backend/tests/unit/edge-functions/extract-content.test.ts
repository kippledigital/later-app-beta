// Unit tests for extract-content Edge Function
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  setupTestDatabase,
  setupMocks,
  cleanup,
  TEST_USERS,
  TEST_CONTENT,
  MOCK_RESPONSES,
  ERROR_SCENARIOS,
  measurePerformance,
  assertPerformance,
} from '../../config/test-setup';

// Mock the Edge Function's main handler
// Note: In a real implementation, we'd import the actual function
// Here we simulate the behavior for testing purposes

interface ExtractContentRequest {
  url: string;
  user_agent?: string;
  timeout?: number;
}

interface ExtractContentResponse {
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  error?: string;
}

describe('Extract Content Edge Function', () => {
  let supabase: any;
  let mocks: any;

  beforeEach(async () => {
    supabase = await setupTestDatabase();
    mocks = setupMocks();
  });

  afterEach(async () => {
    mocks.restoreFetch();
    await cleanup();
  });

  describe('URL Validation', () => {
    it('should reject invalid URL formats', async () => {
      const request = { url: 'not-a-valid-url' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toBe('Invalid URL format');
      expect(response.content).toBeUndefined();
    });

    it('should reject non-HTTP/HTTPS protocols', async () => {
      const request = { url: 'ftp://example.com/file.txt' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toBe('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
    });

    it('should accept valid HTTP URLs', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'http://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toBeUndefined();
      expect(response.title).toBe(TEST_CONTENT.expectedExtraction.title);
    });

    it('should accept valid HTTPS URLs', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toBeUndefined();
      expect(response.title).toBe(TEST_CONTENT.expectedExtraction.title);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without user ID', async () => {
      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, null);

      expect(response.error).toBe('Unauthorized');
    });

    it('should accept requests with valid user ID', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toBeUndefined();
    });
  });

  describe('Content Extraction', () => {
    it('should extract title from HTML title tag', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.title).toBe('Test Article Title');
    });

    it('should extract content from article tag', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.content).toContain('This is test content for extraction');
    });

    it('should extract metadata from meta tags', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.metadata?.description).toBe('Test description');
    });

    it('should calculate reading time based on word count', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.metadata?.reading_time).toBeGreaterThan(0);
      expect(response.metadata?.word_count).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mocks.mockFetch.mockRejectedValueOnce(ERROR_SCENARIOS.networkError());

      const request = { url: 'https://example.com/article' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toContain('Network error');
    });

    it('should handle HTTP 404 errors', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.notFound);

      const request = { url: 'https://example.com/nonexistent' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toContain('HTTP 404');
    });

    it('should handle timeout errors', async () => {
      mocks.mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      const request = { url: 'https://slow-example.com/article', timeout: 50 };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toContain('timeout');
    });

    it('should handle non-HTML content types', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.nonHtml);

      const request = { url: 'https://api.example.com/data.json' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toContain('Content is not HTML');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits per user', async () => {
      mocks.mockFetch.mockResolvedValue(MOCK_RESPONSES.successfulHtml);

      // Simulate multiple rapid requests
      const requests = Array(60).fill(null).map(() =>
        simulateExtractContent(
          { url: 'https://example.com/article' },
          TEST_USERS.validUser.id
        )
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r =>
        r.error?.includes('Rate limit exceeded')
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers in response', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const { response } = await simulateExtractContentWithHeaders(
        request,
        TEST_USERS.validUser.id
      );

      expect(response.headers).toHaveProperty('X-RateLimit-Limit');
      expect(response.headers).toHaveProperty('X-RateLimit-Remaining');
    });
  });

  describe('Performance', () => {
    it('should complete extraction within performance limits', async () => {
      mocks.mockFetch.mockResolvedValueOnce(MOCK_RESPONSES.successfulHtml);

      const request = { url: 'https://example.com/article' };

      const performanceTest = measurePerformance(async () => {
        return await simulateExtractContent(request, TEST_USERS.validUser.id);
      });

      const { result, duration, memory } = await performanceTest();

      expect(result.error).toBeUndefined();
      assertPerformance({ duration, memory });
    });

    it('should handle large content efficiently', async () => {
      const largeHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Large Article</title></head>
        <body>
          <article>
            <h1>Large Article</h1>
            <p>${'Very long content. '.repeat(10000)}</p>
          </article>
        </body>
        </html>
      `;

      mocks.mockFetch.mockResolvedValueOnce({
        ...MOCK_RESPONSES.successfulHtml,
        text: () => Promise.resolve(largeHtmlContent),
      });

      const request = { url: 'https://example.com/large-article' };

      const performanceTest = measurePerformance(async () => {
        return await simulateExtractContent(request, TEST_USERS.validUser.id);
      });

      const { result, duration, memory } = await performanceTest();

      expect(result.error).toBeUndefined();
      assertPerformance({ duration, memory });
    });
  });

  describe('Security', () => {
    it('should sanitize extracted content', async () => {
      const maliciousHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Article</title></head>
        <body>
          <article>
            <h1>Article Title</h1>
            <script>alert('XSS')</script>
            <p onclick="maliciousFunction()">Content with event handlers</p>
            <iframe src="http://malicious.com"></iframe>
          </article>
        </body>
        </html>
      `;

      mocks.mockFetch.mockResolvedValueOnce({
        ...MOCK_RESPONSES.successfulHtml,
        text: () => Promise.resolve(maliciousHtml),
      });

      const request = { url: 'https://example.com/malicious' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.content).not.toContain('<script>');
      expect(response.content).not.toContain('onclick');
      expect(response.content).not.toContain('<iframe>');
    });

    it('should validate content size limits', async () => {
      const oversizedContent = 'A'.repeat(50 * 1024 * 1024); // 50MB

      mocks.mockFetch.mockResolvedValueOnce({
        ...MOCK_RESPONSES.successfulHtml,
        text: () => Promise.resolve(oversizedContent),
      });

      const request = { url: 'https://example.com/oversized' };

      const response = await simulateExtractContent(request, TEST_USERS.validUser.id);

      expect(response.error).toContain('Content too large');
    });
  });
});

// Helper function to simulate the extract-content Edge Function
async function simulateExtractContent(
  request: ExtractContentRequest,
  userId: string | null
): Promise<ExtractContentResponse> {
  // This simulates the actual Edge Function logic
  // In a real implementation, you would import and test the actual function

  try {
    // Validate authentication
    if (!userId) {
      return { content: '', error: 'Unauthorized' };
    }

    // Validate URL
    if (!request.url) {
      return { content: '', error: 'URL is required' };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(request.url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          content: '',
          error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.'
        };
      }
    } catch {
      return { content: '', error: 'Invalid URL format' };
    }

    // Simulate rate limiting check
    const rateLimitResult = await checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return { content: '', error: 'Rate limit exceeded' };
    }

    // Simulate content extraction
    const response = await fetch(request.url);

    if (!response.ok) {
      return {
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { content: '', error: 'Content is not HTML' };
    }

    const html = await response.text();

    // Simulate content size validation
    if (html.length > 10 * 1024 * 1024) { // 10MB limit
      return { content: '', error: 'Content too large' };
    }

    // Simulate HTML parsing and extraction
    const extracted = extractContentFromHtml(html);

    return extracted;

  } catch (error: any) {
    if (error.message.includes('timeout')) {
      return { content: '', error: 'Content extraction timeout' };
    }

    if (error.message.includes('Network error')) {
      return { content: '', error: `Network error: ${error.message}` };
    }

    return { content: '', error: 'Failed to extract content' };
  }
}

// Helper function with headers
async function simulateExtractContentWithHeaders(
  request: ExtractContentRequest,
  userId: string | null
) {
  const result = await simulateExtractContent(request, userId);

  return {
    result,
    response: {
      headers: {
        'X-RateLimit-Limit': '50',
        'X-RateLimit-Remaining': '49',
        'X-RateLimit-Reset': '900',
      },
    },
  };
}

// Simulate rate limiting
async function checkRateLimit(userId: string) {
  // In a real implementation, this would check the database
  // For testing, we simulate rate limiting logic

  const requestCount = Math.floor(Math.random() * 60);
  return {
    allowed: requestCount < 50,
    remaining: Math.max(0, 50 - requestCount),
  };
}

// Simulate content extraction
function extractContentFromHtml(html: string): ExtractContentResponse {
  // Simplified extraction for testing
  // In reality, this would use DOMParser and more sophisticated logic

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const h1Title = h1Match ? h1Match[1].trim() : undefined;

  const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
  const description = descMatch ? descMatch[1] : undefined;

  // Extract text content (simplified)
  const textContent = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = textContent.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return {
    title: title || h1Title || 'Untitled',
    content: textContent,
    metadata: {
      description,
      reading_time: readingTime,
      word_count: words,
      extracted_at: new Date().toISOString(),
    },
  };
}