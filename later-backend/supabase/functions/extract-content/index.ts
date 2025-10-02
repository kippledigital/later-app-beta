// Edge Function for extracting content from URLs
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  getUserIdFromRequest,
  checkRateLimit,
  validateContentSize,
  sanitizeContent,
  extractDomain,
  retryWithBackoff,
  logInfo,
  logError,
  validateEnv
} from '../_shared/utils.ts';
import { ContentExtractionResult } from '../_shared/types.ts';

interface ExtractionRequest {
  url: string;
  user_agent?: string;
  timeout?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCORSPreflight();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Validate environment
    const env = validateEnv(Deno.env.toObject());
    const supabase = createSupabaseClient(env);

    // Get user ID from request
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Check rate limiting
    const { allowed, info } = await checkRateLimit(
      supabase,
      userId,
      'extract-content',
      parseInt(env.RATE_LIMIT_MAX_REQUESTS || '50'),
      parseInt(env.RATE_LIMIT_WINDOW_MS || '900000')
    );

    if (!allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': info.reset.toString(),
          'Retry-After': info.retryAfter?.toString() || '900',
        }
      });
    }

    // Parse request body
    const body: ExtractionRequest = await req.json();

    if (!body.url) {
      return createErrorResponse('URL is required', 400);
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return createErrorResponse('Invalid URL protocol. Only HTTP and HTTPS are allowed.', 400);
      }
    } catch {
      return createErrorResponse('Invalid URL format', 400);
    }

    logInfo('Starting content extraction', { url: body.url, userId });

    // Extract content with retry logic
    const result = await retryWithBackoff(async () => {
      return await extractWebContent(body.url, {
        userAgent: body.user_agent || 'Later-App/1.0 (+https://later-app.com)',
        timeout: body.timeout || parseInt(env.CONTENT_EXTRACTION_TIMEOUT || '30000')
      });
    }, 3, 1000);

    logInfo('Content extraction completed', {
      url: body.url,
      userId,
      contentLength: result.content.length,
      hasTitle: !!result.title,
      hasMetadata: !!result.metadata
    });

    return createSuccessResponse(result);

  } catch (error) {
    logError('Content extraction failed', error, { url: body?.url });

    if (error.message.includes('timeout')) {
      return createErrorResponse('Content extraction timeout', 408, 'EXTRACTION_TIMEOUT');
    }

    if (error.message.includes('network')) {
      return createErrorResponse('Network error while fetching content', 502, 'NETWORK_ERROR');
    }

    return createErrorResponse('Failed to extract content', 500, 'EXTRACTION_ERROR', {
      message: error.message
    });
  }
});

async function extractWebContent(
  url: string,
  options: { userAgent: string; timeout: number }
): Promise<ContentExtractionResult> {

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': options.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('Content is not HTML');
    }

    const html = await response.text();

    if (!validateContentSize(html)) {
      throw new Error('Content too large');
    }

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract title
    let title = doc.querySelector('title')?.textContent?.trim();

    // Try Open Graph title
    if (!title || title.length < 3) {
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
    }

    // Try Twitter title
    if (!title || title.length < 3) {
      title = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')?.trim();
    }

    // Try h1 tag
    if (!title || title.length < 3) {
      title = doc.querySelector('h1')?.textContent?.trim();
    }

    // Extract main content
    let content = '';

    // Try article content first
    const articleSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '#main-content'
    ];

    for (const selector of articleSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        content = extractTextContent(element);
        if (content.length > 100) break;
      }
    }

    // Fallback to body if no main content found
    if (content.length < 100) {
      const body = doc.querySelector('body');
      if (body) {
        // Remove unwanted elements
        const unwantedSelectors = [
          'script', 'style', 'nav', 'header', 'footer',
          '.sidebar', '.navigation', '.menu', '.ads',
          '.comments', '.social-share', '.related-posts'
        ];

        for (const selector of unwantedSelectors) {
          body.querySelectorAll(selector).forEach(el => el.remove());
        }

        content = extractTextContent(body);
      }
    }

    // Sanitize content
    content = sanitizeContent(content);

    // Extract metadata
    const metadata = extractMetadata(doc);

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const result: ContentExtractionResult = {
      title: title || extractDomain(url) || 'Untitled',
      content,
      metadata: {
        ...metadata,
        reading_time: readingTime,
        word_count: wordCount,
        extracted_at: new Date().toISOString()
      }
    };

    return result;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Content extraction timeout');
    }

    throw new Error(`Network error: ${error.message}`);
  }
}

function extractTextContent(element: any): string {
  // Get text content and clean it up
  const text = element.textContent || '';

  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    .trim();
}

function extractMetadata(doc: any): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Description
  const description =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content');

  if (description) {
    metadata.description = description.trim();
  }

  // Author
  const author =
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
    doc.querySelector('[rel="author"]')?.textContent;

  if (author) {
    metadata.author = author.trim();
  }

  // Publish date
  const publishDate =
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="date"]')?.getAttribute('content') ||
    doc.querySelector('time[datetime]')?.getAttribute('datetime');

  if (publishDate) {
    metadata.publish_date = publishDate;
  }

  // Image
  const image =
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

  if (image) {
    metadata.image_url = image;
  }

  // Site name
  const siteName =
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="application-name"]')?.getAttribute('content');

  if (siteName) {
    metadata.site_name = siteName.trim();
  }

  // Language
  const language =
    doc.documentElement?.getAttribute('lang') ||
    doc.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content');

  if (language) {
    metadata.language = language;
  }

  return metadata;
}