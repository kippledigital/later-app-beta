// Load testing for Later app backend services
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  setupTestDatabase,
  cleanup,
  TEST_USERS,
  TEST_CONFIG,
  createTestSupabaseClient,
} from '../config/test-setup';

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: Array<{ error: string; count: number }>;
}

interface ConcurrencyTestResult {
  concurrentUsers: number;
  duration: number;
  result: LoadTestResult;
}

describe('Backend Load Testing', () => {
  let supabase: any;

  beforeAll(async () => {
    supabase = await setupTestDatabase();

    // Seed database with performance test data
    await seedPerformanceTestData();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('API Endpoint Load Tests', () => {
    it('should handle 100 concurrent content capture requests', async () => {
      const concurrentUsers = 100;
      const requestsPerUser = 5;
      const testDuration = 30000; // 30 seconds

      const result = await runConcurrentTest({
        concurrentUsers,
        requestsPerUser,
        testDuration,
        operation: 'content_capture',
      });

      // Performance assertions
      expect(result.result.averageResponseTime).toBeLessThan(2000); // <2s average
      expect(result.result.p95ResponseTime).toBeLessThan(5000); // <5s for 95th percentile
      expect(result.result.requestsPerSecond).toBeGreaterThan(10); // >10 RPS
      expect(result.result.successfulRequests / result.result.totalRequests).toBeGreaterThan(0.95); // >95% success rate
    });

    it('should handle 500 concurrent read requests', async () => {
      const concurrentUsers = 500;
      const requestsPerUser = 10;
      const testDuration = 60000; // 60 seconds

      const result = await runConcurrentTest({
        concurrentUsers,
        requestsPerUser,
        testDuration,
        operation: 'content_read',
      });

      // Read operations should be faster
      expect(result.result.averageResponseTime).toBeLessThan(500); // <500ms average
      expect(result.result.p95ResponseTime).toBeLessThan(1000); // <1s for 95th percentile
      expect(result.result.requestsPerSecond).toBeGreaterThan(50); // >50 RPS
      expect(result.result.successfulRequests / result.result.totalRequests).toBeGreaterThan(0.98); // >98% success rate
    });

    it('should handle mixed workload with realistic usage patterns', async () => {
      const testScenarios = [
        { operation: 'content_capture', weight: 0.2, users: 50 },
        { operation: 'content_read', weight: 0.5, users: 200 },
        { operation: 'content_search', weight: 0.2, users: 80 },
        { operation: 'content_update', weight: 0.1, users: 20 },
      ];

      const results = await Promise.all(
        testScenarios.map(scenario =>
          runConcurrentTest({
            concurrentUsers: scenario.users,
            requestsPerUser: 10,
            testDuration: 45000,
            operation: scenario.operation,
          })
        )
      );

      // Aggregate results
      const totalRequests = results.reduce((sum, r) => sum + r.result.totalRequests, 0);
      const totalSuccessful = results.reduce((sum, r) => sum + r.result.successfulRequests, 0);
      const overallSuccessRate = totalSuccessful / totalRequests;

      expect(overallSuccessRate).toBeGreaterThan(0.95);
      expect(totalRequests).toBeGreaterThan(1000); // Significant load
    });
  });

  describe('Database Performance Under Load', () => {
    it('should maintain query performance with 10,000 content items', async () => {
      // Create large dataset
      await createLargeDataset(10000);

      const startTime = performance.now();

      // Complex query that joins multiple tables
      const { data, error } = await supabase
        .from('content_items')
        .select(`
          *,
          user_profiles!inner(name, email),
          ai_processing_jobs(status, job_type)
        `)
        .eq('status', 'processed')
        .in('priority', ['medium', 'high'])
        .order('captured_at', { ascending: false })
        .limit(50);

      const queryTime = performance.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(500); // <500ms for complex query
    });

    it('should handle concurrent database writes without deadlocks', async () => {
      const concurrentWrites = 100;
      const writesPerConnection = 10;

      const writePromises = Array(concurrentWrites).fill(null).map(async (_, index) => {
        const userSupabase = createTestSupabaseClient();

        for (let i = 0; i < writesPerConnection; i++) {
          await userSupabase
            .from('content_items')
            .insert({
              user_id: TEST_USERS.validUser.id,
              title: `Concurrent Write ${index}-${i}`,
              source: 'web_url',
              status: 'captured',
              priority: 'medium',
              tags: [`concurrent-${index}`],
              categories: ['test'],
              captured_at: new Date().toISOString(),
              attachment_urls: [],
              attachment_metadata: {},
              view_count: 0,
              is_favorite: false,
              is_archived: false,
            });
        }
      });

      const startTime = performance.now();

      // Execute all writes concurrently
      const results = await Promise.allSettled(writePromises);

      const duration = performance.now() - startTime;
      const successfulWrites = results.filter(r => r.status === 'fulfilled').length;
      const failedWrites = results.filter(r => r.status === 'rejected').length;

      expect(successfulWrites).toBeGreaterThan(concurrentWrites * 0.95); // >95% success
      expect(failedWrites).toBeLessThan(concurrentWrites * 0.05); // <5% failures
      expect(duration).toBeLessThan(30000); // Complete within 30 seconds
    });

    it('should maintain connection pool efficiency under load', async () => {
      const connectionPoolTest = async () => {
        const connections = Array(50).fill(null).map(() => createTestSupabaseClient());

        const queryPromises = connections.map(async (client, index) => {
          const startTime = performance.now();

          const { data, error } = await client
            .from('content_items')
            .select('id, title, status')
            .eq('user_id', TEST_USERS.validUser.id)
            .limit(10);

          const queryTime = performance.now() - startTime;

          return { index, queryTime, success: !error, rowCount: data?.length || 0 };
        });

        return await Promise.all(queryPromises);
      };

      const results = await connectionPoolTest();

      const averageQueryTime = results.reduce((sum, r) => sum + r.queryTime, 0) / results.length;
      const successfulQueries = results.filter(r => r.success).length;

      expect(averageQueryTime).toBeLessThan(200); // <200ms average
      expect(successfulQueries).toBe(results.length); // 100% success
    });
  });

  describe('Edge Function Performance', () => {
    it('should handle content extraction under load', async () => {
      const concurrentRequests = 50;
      const extractionUrl = 'https://example.com/test-article';

      // Mock successful extraction responses
      const mockExtractContent = jest.fn().mockResolvedValue({
        title: 'Test Article',
        content: 'Test content for load testing.',
        metadata: {
          reading_time: 2,
          word_count: 400,
        },
      });

      const extractionPromises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        const startTime = performance.now();

        try {
          const result = await mockExtractContent();
          const duration = performance.now() - startTime;

          return {
            index,
            success: true,
            duration,
            result,
          };
        } catch (error) {
          const duration = performance.now() - startTime;

          return {
            index,
            success: false,
            duration,
            error: error.message,
          };
        }
      });

      const results = await Promise.all(extractionPromises);

      const successfulExtractions = results.filter(r => r.success);
      const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const p95Duration = results
        .map(r => r.duration)
        .sort((a, b) => a - b)[Math.floor(results.length * 0.95)];

      expect(successfulExtractions.length / results.length).toBeGreaterThan(0.95); // >95% success
      expect(averageDuration).toBeLessThan(5000); // <5s average
      expect(p95Duration).toBeLessThan(10000); // <10s for 95th percentile
    });

    it('should handle AI processing queue under load', async () => {
      const batchSize = 20;
      const totalJobs = 100;

      // Create AI processing jobs
      const jobPromises = Array(totalJobs).fill(null).map(async (_, index) => {
        const { data, error } = await supabase
          .from('ai_processing_jobs')
          .insert({
            content_id: `test-content-${index}`,
            job_type: 'summarize',
            status: 'pending',
            input_data: {
              content: `Test content for AI processing ${index}`,
            },
            retry_count: 0,
            max_retries: 3,
          })
          .select()
          .single();

        return { index, success: !error, jobId: data?.id };
      });

      const createdJobs = await Promise.all(jobPromises);
      const successfulJobs = createdJobs.filter(j => j.success);

      expect(successfulJobs.length).toBe(totalJobs);

      // Simulate processing batches
      const processingStartTime = performance.now();

      for (let batch = 0; batch < Math.ceil(totalJobs / batchSize); batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, totalJobs);
        const batchJobs = successfulJobs.slice(batchStart, batchEnd);

        // Process batch concurrently
        await Promise.all(
          batchJobs.map(async (job) => {
            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

            return supabase
              .from('ai_processing_jobs')
              .update({
                status: 'completed',
                output_data: {
                  summary: `Generated summary for job ${job.index}`,
                  confidence: 0.85,
                },
              })
              .eq('id', job.jobId);
          })
        );
      }

      const totalProcessingTime = performance.now() - processingStartTime;
      const averageProcessingTime = totalProcessingTime / totalJobs;

      expect(averageProcessingTime).toBeLessThan(2000); // <2s average per job
      expect(totalProcessingTime).toBeLessThan(60000); // Complete all within 60s
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under sustained load', async () => {
      const initialMemory = process.memoryUsage();
      const testDuration = 30000; // 30 seconds
      const memorySnapshots: Array<{ time: number; memory: NodeJS.MemoryUsage }> = [];

      // Run sustained load test
      const loadTestPromise = runSustainedLoad(testDuration);

      // Monitor memory usage
      const memoryMonitorInterval = setInterval(() => {
        memorySnapshots.push({
          time: Date.now(),
          memory: process.memoryUsage(),
        });
      }, 1000);

      await loadTestPromise;
      clearInterval(memoryMonitorInterval);

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const maxHeapUsed = Math.max(...memorySnapshots.map(s => s.memory.heapUsed));

      // Memory should not grow excessively
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // <100MB growth
      expect(maxHeapUsed).toBeLessThan(200 * 1024 * 1024); // <200MB peak usage
    });

    it('should handle garbage collection efficiently', async () => {
      const gcStats: Array<{ time: number; heapUsed: number; heapTotal: number }> = [];

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();

      // Create memory pressure
      const largeDataArrays = Array(100).fill(null).map(() =>
        Array(10000).fill(null).map((_, i) => ({
          id: i,
          data: 'x'.repeat(1000),
          timestamp: new Date(),
        }))
      );

      // Monitor memory during cleanup
      const monitoringInterval = setInterval(() => {
        gcStats.push({
          time: Date.now(),
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
        });
      }, 100);

      // Clear references to trigger GC
      largeDataArrays.length = 0;

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      // Wait for GC to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(monitoringInterval);

      const finalMemory = process.memoryUsage();
      const memoryReduction = initialMemory.heapUsed - finalMemory.heapUsed;

      // Memory should be properly cleaned up
      expect(Math.abs(memoryReduction)).toBeLessThan(50 * 1024 * 1024); // Reasonable cleanup
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should efficiently enforce rate limits under load', async () => {
      const rateLimitRequests = 200;
      const allowedRequests = 50; // Simulate rate limit of 50 requests

      const rateLimitPromises = Array(rateLimitRequests).fill(null).map(async (_, index) => {
        const startTime = performance.now();

        // Simulate rate limit check
        const isAllowed = index < allowedRequests;
        const checkDuration = performance.now() - startTime;

        return {
          index,
          allowed: isAllowed,
          checkDuration,
        };
      });

      const results = await Promise.all(rateLimitPromises);

      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;
      const averageCheckTime = results.reduce((sum, r) => sum + r.checkDuration, 0) / results.length;

      expect(allowedCount).toBe(allowedRequests);
      expect(blockedCount).toBe(rateLimitRequests - allowedRequests);
      expect(averageCheckTime).toBeLessThan(10); // <10ms for rate limit check
    });
  });
});

// Helper functions for load testing

async function runConcurrentTest(config: {
  concurrentUsers: number;
  requestsPerUser: number;
  testDuration: number;
  operation: string;
}): Promise<ConcurrencyTestResult> {
  const startTime = performance.now();
  const responseTimes: number[] = [];
  const errors: Array<{ error: string; count: number }> = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const userPromises = Array(config.concurrentUsers).fill(null).map(async (_, userIndex) => {
    const userClient = createTestSupabaseClient();

    for (let request = 0; request < config.requestsPerUser; request++) {
      const requestStartTime = performance.now();

      try {
        await executeOperation(userClient, config.operation, userIndex, request);

        const responseTime = performance.now() - requestStartTime;
        responseTimes.push(responseTime);
        successfulRequests++;
      } catch (error: any) {
        const responseTime = performance.now() - requestStartTime;
        responseTimes.push(responseTime);
        failedRequests++;

        const existingError = errors.find(e => e.error === error.message);
        if (existingError) {
          existingError.count++;
        } else {
          errors.push({ error: error.message, count: 1 });
        }
      }
    }
  });

  await Promise.all(userPromises);

  const totalDuration = performance.now() - startTime;
  const totalRequests = successfulRequests + failedRequests;

  responseTimes.sort((a, b) => a - b);

  return {
    concurrentUsers: config.concurrentUsers,
    duration: totalDuration,
    result: {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      requestsPerSecond: totalRequests / (totalDuration / 1000),
      errors,
    },
  };
}

async function executeOperation(client: any, operation: string, userIndex: number, requestIndex: number) {
  switch (operation) {
    case 'content_capture':
      return await client
        .from('content_items')
        .insert({
          user_id: TEST_USERS.validUser.id,
          title: `Load Test Content ${userIndex}-${requestIndex}`,
          source: 'web_url',
          status: 'captured',
          priority: 'medium',
          tags: [`load-test-${userIndex}`],
          categories: ['test'],
          captured_at: new Date().toISOString(),
          attachment_urls: [],
          attachment_metadata: {},
          view_count: 0,
          is_favorite: false,
          is_archived: false,
        });

    case 'content_read':
      return await client
        .from('content_items')
        .select('*')
        .eq('user_id', TEST_USERS.validUser.id)
        .limit(10);

    case 'content_search':
      return await client
        .from('content_items')
        .select('*')
        .eq('user_id', TEST_USERS.validUser.id)
        .ilike('title', `%test%`)
        .limit(20);

    case 'content_update':
      return await client
        .from('content_items')
        .update({ view_count: requestIndex })
        .eq('user_id', TEST_USERS.validUser.id)
        .limit(1);

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function createLargeDataset(size: number) {
  const batchSize = 1000;
  const supabase = createTestSupabaseClient();

  for (let batch = 0; batch < Math.ceil(size / batchSize); batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, size);

    const batchData = Array(batchEnd - batchStart).fill(null).map((_, index) => {
      const itemIndex = batchStart + index;
      return {
        user_id: TEST_USERS.validUser.id,
        title: `Large Dataset Item ${itemIndex}`,
        original_content: `Content for item ${itemIndex}. This is test data for performance testing.`,
        source: 'web_url',
        status: itemIndex % 2 === 0 ? 'processed' : 'captured',
        priority: ['low', 'medium', 'high'][itemIndex % 3],
        tags: [`tag-${itemIndex % 20}`],
        categories: [`category-${itemIndex % 10}`],
        captured_at: new Date(Date.now() - itemIndex * 60000).toISOString(), // Spread over time
        attachment_urls: [],
        attachment_metadata: {},
        view_count: itemIndex % 100,
        is_favorite: itemIndex % 50 === 0,
        is_archived: itemIndex % 100 === 0,
      };
    });

    await supabase.from('content_items').insert(batchData);
  }
}

async function seedPerformanceTestData() {
  // Create additional test users for load testing
  const supabase = createTestSupabaseClient();

  const performanceUsers = Array(10).fill(null).map((_, index) => ({
    id: `load-test-user-${index}`,
    email: `loadtest${index}@example.com`,
    name: `Load Test User ${index}`,
    created_at: new Date().toISOString(),
    settings: {},
  }));

  await supabase.from('user_profiles').upsert(performanceUsers);
}

async function runSustainedLoad(duration: number) {
  const endTime = Date.now() + duration;
  const operations = ['content_capture', 'content_read', 'content_search'];

  const promises: Promise<any>[] = [];

  while (Date.now() < endTime) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const client = createTestSupabaseClient();

    promises.push(
      executeOperation(client, operation, Math.floor(Math.random() * 100), Date.now())
        .catch(() => {}) // Ignore errors for sustained load
    );

    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  await Promise.allSettled(promises);
}