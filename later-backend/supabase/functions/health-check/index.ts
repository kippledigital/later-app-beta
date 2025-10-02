// Health check endpoint for monitoring system status
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import {
  createSupabaseClient,
  createSuccessResponse,
  createErrorResponse,
  validateEnv
} from '../_shared/utils.ts';
import {
  checkServiceHealth,
  HealthCheck,
  logInfo,
  logError
} from '../_shared/monitoring.ts';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: HealthCheck[];
  overall_response_time_ms: number;
  environment: string;
}

serve(async (req) => {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const env = validateEnv(Deno.env.toObject());
    const healthChecks: HealthCheck[] = [];

    logInfo('Starting health check', undefined, 'health-check');

    // Check Supabase connection
    const supabaseHealth = await checkServiceHealth('supabase', async () => {
      const supabase = createSupabaseClient(env);
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      return {
        healthy: !error,
        details: error ? { error: error.message } : { connection: 'ok' }
      };
    });
    healthChecks.push(supabaseHealth);

    // Check OpenAI API connection
    const openAIHealth = await checkServiceHealth('openai', async () => {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        return {
          healthy: response.ok,
          details: { status: response.status }
        };
      } catch (error) {
        return {
          healthy: false,
          details: { error: error.message }
        };
      }
    });
    healthChecks.push(openAIHealth);

    // Check database functions
    const dbFunctionsHealth = await checkServiceHealth('database_functions', async () => {
      const supabase = createSupabaseClient(env);

      try {
        // Test a simple database function
        const { data, error } = await supabase
          .rpc('check_content_limit', { user_uuid: '00000000-0000-0000-0000-000000000000' });

        return {
          healthy: !error,
          details: error ? { error: error.message } : { functions: 'available' }
        };
      } catch (error) {
        return {
          healthy: false,
          details: { error: error.message }
        };
      }
    });
    healthChecks.push(dbFunctionsHealth);

    // Check Edge Function runtime
    const runtimeHealth = await checkServiceHealth('edge_runtime', async () => {
      const memoryUsage = 'Deno' in globalThis && (globalThis as any).Deno.memoryUsage?.();

      return {
        healthy: true,
        details: {
          runtime: 'deno',
          memory_mb: memoryUsage ? Math.round(memoryUsage.heapUsed / 1024 / 1024) : 'unknown',
          uptime_ms: Date.now() - startTime
        }
      };
    });
    healthChecks.push(runtimeHealth);

    // Determine overall health status
    const unhealthyServices = healthChecks.filter(check => check.status === 'unhealthy');
    const degradedServices = healthChecks.filter(check => check.status === 'degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const responseTime = Date.now() - startTime;

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: healthChecks,
      overall_response_time_ms: responseTime,
      environment: env.NODE_ENV || 'development'
    };

    logInfo('Health check completed', {
      status: overallStatus,
      response_time_ms: responseTime,
      services_checked: healthChecks.length,
      unhealthy_count: unhealthyServices.length
    }, 'health-check');

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return createSuccessResponse(healthResponse, statusCode);

  } catch (error) {
    logError('health-check', error, 'critical');

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: [],
      overall_response_time_ms: Date.now() - startTime,
      environment: 'unknown'
    };

    return createSuccessResponse(errorResponse, 503);
  }
});