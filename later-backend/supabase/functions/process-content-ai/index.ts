// Edge Function for AI-powered content processing
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts';
import {
  createSupabaseClient,
  createErrorResponse,
  createSuccessResponse,
  handleCORSPreflight,
  getUserIdFromRequest,
  checkRateLimit,
  validateContentSize,
  retryWithBackoff,
  logInfo,
  logError,
  validateEnv
} from '../_shared/utils.ts';
import { AIResponse, ProcessingResult } from '../_shared/types.ts';

interface ProcessingRequest {
  content_id: string;
  content: string;
  title?: string;
  url?: string;
  source?: string;
  processing_types: Array<'summarize' | 'categorize' | 'extract_entities' | 'sentiment_analysis' | 'generate_tags'>;
  user_preferences?: {
    max_summary_length?: number;
    preferred_categories?: string[];
    language?: string;
  };
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
      'process-content-ai',
      parseInt(env.RATE_LIMIT_MAX_REQUESTS || '30'),
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
    const body: ProcessingRequest = await req.json();

    if (!body.content_id || !body.content || !body.processing_types?.length) {
      return createErrorResponse('content_id, content, and processing_types are required', 400);
    }

    if (!validateContentSize(body.content, 50000)) { // 50KB limit for AI processing
      return createErrorResponse('Content too large for AI processing', 413);
    }

    // Verify user owns the content
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .select('id, user_id, status')
      .eq('id', body.content_id)
      .eq('user_id', userId)
      .single();

    if (contentError || !contentItem) {
      return createErrorResponse('Content not found or access denied', 404);
    }

    logInfo('Starting AI content processing', {
      contentId: body.content_id,
      userId,
      processingTypes: body.processing_types,
      contentLength: body.content.length
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    // Process content with AI
    const processingResults: Record<string, ProcessingResult> = {};
    let totalTokensUsed = 0;
    let totalCostCents = 0;

    for (const processType of body.processing_types) {
      try {
        const result = await retryWithBackoff(async () => {
          return await processWithOpenAI(openai, processType, body, env);
        }, 2, 1000);

        processingResults[processType] = result;
        totalTokensUsed += result.tokens_used || 0;
        totalCostCents += calculateCost(result.tokens_used || 0, env.OPENAI_MODEL || 'gpt-4-turbo-preview');

      } catch (error) {
        logError(`AI processing failed for ${processType}`, error, { contentId: body.content_id });
        processingResults[processType] = {
          success: false,
          error: error.message
        };
      }
    }

    // Combine results
    const combinedResult: AIResponse = {};
    let overallConfidence = 0;
    let successfulProcesses = 0;

    for (const [type, result] of Object.entries(processingResults)) {
      if (result.success && result.data) {
        successfulProcesses++;

        switch (type) {
          case 'summarize':
            combinedResult.summary = result.data.summary;
            break;
          case 'generate_tags':
            combinedResult.tags = result.data.tags;
            break;
          case 'categorize':
            combinedResult.categories = result.data.categories;
            break;
          case 'sentiment_analysis':
            combinedResult.sentiment_score = result.data.sentiment_score;
            break;
          case 'extract_entities':
            combinedResult.key_entities = result.data.entities;
            break;
        }

        if (result.data.confidence) {
          overallConfidence += result.data.confidence;
        }
      }
    }

    combinedResult.confidence_score = successfulProcesses > 0 ? overallConfidence / successfulProcesses : 0;

    // Calculate reading time
    const wordCount = body.content.split(/\s+/).length;
    combinedResult.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200));

    // Update content item in database
    const { error: updateError } = await supabase
      .from('content_items')
      .update({
        processed_content: body.content,
        summary: combinedResult.summary,
        tags: combinedResult.tags || [],
        categories: combinedResult.categories || [],
        sentiment_score: combinedResult.sentiment_score,
        confidence_score: combinedResult.confidence_score,
        reading_time_minutes: combinedResult.reading_time_minutes,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', body.content_id)
      .eq('user_id', userId);

    if (updateError) {
      logError('Failed to update content item', updateError, { contentId: body.content_id });
    }

    // Record AI processing job
    await supabase
      .from('ai_processing_jobs')
      .insert({
        content_id: body.content_id,
        job_type: 'combined_processing',
        status: successfulProcesses > 0 ? 'completed' : 'failed',
        input_data: {
          processing_types: body.processing_types,
          content_length: body.content.length
        },
        output_data: combinedResult,
        completed_at: new Date().toISOString(),
        model_used: env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        tokens_consumed: totalTokensUsed,
        cost_cents: totalCostCents
      });

    logInfo('AI content processing completed', {
      contentId: body.content_id,
      userId,
      successfulProcesses,
      totalProcesses: body.processing_types.length,
      tokensUsed: totalTokensUsed,
      costCents: totalCostCents
    });

    return createSuccessResponse({
      ...combinedResult,
      processing_metadata: {
        tokens_used: totalTokensUsed,
        cost_cents: totalCostCents,
        successful_processes: successfulProcesses,
        total_processes: body.processing_types.length,
        processing_results: processingResults
      }
    });

  } catch (error) {
    logError('AI processing failed', error, { contentId: body?.content_id });
    return createErrorResponse('AI processing failed', 500, 'AI_PROCESSING_ERROR', {
      message: error.message
    });
  }
});

async function processWithOpenAI(
  openai: OpenAI,
  processType: string,
  request: ProcessingRequest,
  env: any
): Promise<ProcessingResult> {

  const startTime = Date.now();
  let prompt = '';
  let systemPrompt = '';

  switch (processType) {
    case 'summarize':
      systemPrompt = `You are an expert content summarizer. Create concise, informative summaries that capture the key points and main ideas. Keep summaries under ${request.user_preferences?.max_summary_length || 200} words.`;
      prompt = `Please summarize the following content:\n\nTitle: ${request.title || 'No title'}\nURL: ${request.url || 'No URL'}\n\nContent:\n${request.content}`;
      break;

    case 'generate_tags':
      systemPrompt = 'You are an expert content tagger. Generate 3-8 relevant tags that accurately describe the content. Return only a JSON array of strings. Focus on topics, themes, and actionable categories.';
      prompt = `Generate tags for this content:\n\nTitle: ${request.title || 'No title'}\nContent: ${request.content.substring(0, 2000)}...`;
      break;

    case 'categorize':
      const preferredCategories = request.user_preferences?.preferred_categories || [
        'Work', 'Personal', 'Shopping', 'Travel', 'Health', 'Finance', 'Learning', 'Entertainment'
      ];
      systemPrompt = `You are an expert content categorizer. Assign this content to 1-3 of these categories: ${preferredCategories.join(', ')}. Return only a JSON array of category names.`;
      prompt = `Categorize this content:\n\nTitle: ${request.title || 'No title'}\nContent: ${request.content.substring(0, 1500)}...`;
      break;

    case 'sentiment_analysis':
      systemPrompt = 'You are an expert sentiment analyzer. Analyze the emotional tone and return a sentiment score between -1 (very negative) and 1 (very positive), with 0 being neutral. Return only a JSON object with "sentiment_score" and "confidence".';
      prompt = `Analyze the sentiment of this content:\n\nTitle: ${request.title || 'No title'}\nContent: ${request.content.substring(0, 1500)}...`;
      break;

    case 'extract_entities':
      systemPrompt = 'You are an expert entity extractor. Extract key entities (people, places, organizations, dates, etc.) and return a JSON array of objects with "text", "type", and "confidence" fields.';
      prompt = `Extract key entities from this content:\n\nTitle: ${request.title || 'No title'}\nContent: ${request.content.substring(0, 2000)}...`;
      break;

    default:
      throw new Error(`Unknown processing type: ${processType}`);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: processType === 'summarize' ? 300 : 150,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parse response based on processing type
    let data: any;
    let confidence = 0.8; // Default confidence

    try {
      if (processType === 'summarize') {
        data = { summary: response.trim(), confidence };
      } else if (['generate_tags', 'categorize', 'sentiment_analysis', 'extract_entities'].includes(processType)) {
        // Try to parse as JSON first
        const jsonMatch = response.match(/\[.*\]|\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (processType === 'sentiment_analysis') {
            data = { sentiment_score: parsed.sentiment_score, confidence: parsed.confidence || 0.8 };
          } else {
            data = { [processType === 'generate_tags' ? 'tags' : processType === 'categorize' ? 'categories' : 'entities']: parsed, confidence };
          }
        } else {
          throw new Error('Could not parse JSON response');
        }
      }
    } catch (parseError) {
      // Fallback parsing for non-JSON responses
      if (processType === 'generate_tags') {
        const tags = response.split(/[,\n]/).map(tag => tag.trim().replace(/^[•\-\*]\s*/, '')).filter(tag => tag.length > 0);
        data = { tags: tags.slice(0, 8), confidence: 0.6 };
      } else if (processType === 'categorize') {
        const categories = response.split(/[,\n]/).map(cat => cat.trim()).filter(cat => cat.length > 0);
        data = { categories: categories.slice(0, 3), confidence: 0.6 };
      } else {
        throw parseError;
      }
    }

    return {
      success: true,
      data,
      tokens_used: tokensUsed,
      processing_time_ms: processingTime
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    };
  }
}

function calculateCost(tokens: number, model: string): number {
  // Rough cost calculation (in cents) based on OpenAI pricing
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4-turbo-preview': { input: 0.001, output: 0.003 }, // per 1K tokens
    'gpt-4': { input: 0.003, output: 0.006 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
  };

  const rate = rates[model] || rates['gpt-4-turbo-preview'];
  // Assume 70% input, 30% output tokens
  const inputTokens = Math.floor(tokens * 0.7);
  const outputTokens = tokens - inputTokens;

  return Math.ceil(
    (inputTokens / 1000) * rate.input * 100 +
    (outputTokens / 1000) * rate.output * 100
  );
}