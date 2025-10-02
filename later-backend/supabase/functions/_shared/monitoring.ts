// Monitoring and observability utilities for Edge Functions

export interface PerformanceMetrics {
  function_name: string;
  execution_time_ms: number;
  memory_used_mb?: number;
  tokens_consumed?: number;
  api_calls_made?: number;
  errors_count?: number;
  user_id?: string;
  timestamp: string;
}

export interface ErrorMetrics {
  function_name: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  user_id?: string;
  request_data?: any;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms?: number;
  last_check: string;
  details?: Record<string, any>;
}

export class FunctionMonitor {
  private functionName: string;
  private startTime: number;
  private metrics: Partial<PerformanceMetrics>;

  constructor(functionName: string, userId?: string) {
    this.functionName = functionName;
    this.startTime = Date.now();
    this.metrics = {
      function_name: functionName,
      user_id: userId,
      timestamp: new Date().toISOString(),
      tokens_consumed: 0,
      api_calls_made: 0,
      errors_count: 0
    };
  }

  addTokenUsage(tokens: number) {
    this.metrics.tokens_consumed = (this.metrics.tokens_consumed || 0) + tokens;
  }

  addApiCall() {
    this.metrics.api_calls_made = (this.metrics.api_calls_made || 0) + 1;
  }

  addError() {
    this.metrics.errors_count = (this.metrics.errors_count || 0) + 1;
  }

  async finish(): Promise<PerformanceMetrics> {
    this.metrics.execution_time_ms = Date.now() - this.startTime;

    // Get memory usage if available
    if ('Deno' in globalThis && (globalThis as any).Deno.memoryUsage) {
      const memUsage = (globalThis as any).Deno.memoryUsage();
      this.metrics.memory_used_mb = Math.round(memUsage.heapUsed / 1024 / 1024);
    }

    // Log metrics
    this.logMetrics();

    return this.metrics as PerformanceMetrics;
  }

  private logMetrics() {
    console.log(JSON.stringify({
      type: 'performance_metrics',
      ...this.metrics
    }));
  }
}

export function logError(
  functionName: string,
  error: Error | any,
  severity: ErrorMetrics['severity'] = 'medium',
  userId?: string,
  requestData?: any
) {
  const errorMetrics: ErrorMetrics = {
    function_name: functionName,
    error_type: error?.name || 'UnknownError',
    error_message: error?.message || String(error),
    error_stack: error?.stack,
    user_id: userId,
    request_data: requestData,
    timestamp: new Date().toISOString(),
    severity
  };

  console.error(JSON.stringify({
    type: 'error_metrics',
    ...errorMetrics
  }));

  // For critical errors, you might want to send to external monitoring
  if (severity === 'critical') {
    // sendToExternalMonitoring(errorMetrics);
  }
}

export function logInfo(message: string, data?: any, functionName?: string) {
  console.log(JSON.stringify({
    type: 'info',
    level: 'info',
    message,
    function_name: functionName,
    data,
    timestamp: new Date().toISOString()
  }));
}

export function logWarning(message: string, data?: any, functionName?: string) {
  console.warn(JSON.stringify({
    type: 'warning',
    level: 'warning',
    message,
    function_name: functionName,
    data,
    timestamp: new Date().toISOString()
  }));
}

export async function checkServiceHealth(
  serviceName: string,
  healthCheckFn: () => Promise<{ healthy: boolean; details?: any }>
): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const result = await healthCheckFn();
    const responseTime = Date.now() - startTime;

    return {
      service: serviceName,
      status: result.healthy ? 'healthy' : 'degraded',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      details: result.details
    };
  } catch (error) {
    return {
      service: serviceName,
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: {
        error: error.message
      }
    };
  }
}

export function createRateLimitMetrics(
  endpoint: string,
  userId: string,
  allowed: boolean,
  remaining: number
) {
  console.log(JSON.stringify({
    type: 'rate_limit_metrics',
    endpoint,
    user_id: userId,
    allowed,
    remaining,
    timestamp: new Date().toISOString()
  }));
}

export function createSecurityAlert(
  alertType: string,
  message: string,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  console.warn(JSON.stringify({
    type: 'security_alert',
    alert_type: alertType,
    message,
    details,
    severity,
    timestamp: new Date().toISOString()
  }));
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}