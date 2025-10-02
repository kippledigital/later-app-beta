// k6 load testing script for Later app
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const authSuccessRate = new Rate('auth_success_rate');
const contentCaptureSuccessRate = new Rate('content_capture_success_rate');
const contentProcessingTime = new Trend('content_processing_time');
const searchResponseTime = new Trend('search_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp-up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Peak load
    { duration: '5m', target: 100 }, // Sustain peak
    { duration: '2m', target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    auth_success_rate: ['rate>0.95'], // Auth success rate over 95%
    content_capture_success_rate: ['rate>0.90'], // Capture success rate over 90%
    content_processing_time: ['p(95)<30000'], // 95% of AI processing under 30s
    search_response_time: ['p(95)<1000'], // 95% of searches under 1s
  },
  ext: {
    loadimpact: {
      projectID: 3596718,
      name: 'Later App Load Test'
    }
  }
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'test-anon-key';

const testUsers = [
  { email: 'user1@example.com', password: 'password123', name: 'Test User 1' },
  { email: 'user2@example.com', password: 'password123', name: 'Test User 2' },
  { email: 'user3@example.com', password: 'password123', name: 'Test User 3' },
  { email: 'user4@example.com', password: 'password123', name: 'Test User 4' },
  { email: 'user5@example.com', password: 'password123', name: 'Test User 5' },
];

const testUrls = [
  'https://example.com/tech-article-1',
  'https://example.com/productivity-tips-2',
  'https://example.com/health-guide-3',
  'https://example.com/cooking-recipe-4',
  'https://example.com/travel-blog-5',
];

// Helper function to authenticate user
function authenticateUser(user) {
  const authResponse = http.post(`${BASE_URL}/auth/v1/token?grant_type=password`, {
    email: user.email,
    password: user.password,
  }, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });

  const authSuccess = check(authResponse, {
    'authentication successful': (r) => r.status === 200,
    'access token received': (r) => r.json('access_token') !== undefined,
  });

  authSuccessRate.add(authSuccess);

  if (authSuccess) {
    return authResponse.json('access_token');
  }
  return null;
}

// Helper function to get auth headers
function getAuthHeaders(accessToken) {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

// Main test scenario
export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  group('Authentication Flow', () => {
    const accessToken = authenticateUser(user);

    if (!accessToken) {
      console.error('Authentication failed, skipping test');
      return;
    }

    // Verify user profile access
    const profileResponse = http.get(`${BASE_URL}/auth/v1/user`, {
      headers: getAuthHeaders(accessToken),
    });

    check(profileResponse, {
      'profile accessible': (r) => r.status === 200,
    });

    sleep(1);

    group('Content Capture', () => {
      const testUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
      const captureStart = Date.now();

      const captureResponse = http.post(`${BASE_URL}/functions/v1/capture-content`,
        JSON.stringify({
          url: testUrl,
          source: 'web_url',
          metadata: {
            capture_method: 'load_test',
            device_context: 'k6_test',
          },
        }), {
          headers: getAuthHeaders(accessToken),
        }
      );

      const captureSuccess = check(captureResponse, {
        'content capture initiated': (r) => r.status === 200,
        'content ID returned': (r) => r.json('id') !== undefined,
      });

      contentCaptureSuccessRate.add(captureSuccess);

      if (captureSuccess) {
        const contentId = captureResponse.json('id');

        // Wait for content processing
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        while (!processingComplete && attempts < maxAttempts) {
          sleep(1);
          attempts++;

          const statusResponse = http.get(
            `${BASE_URL}/rest/v1/content_items?id=eq.${contentId}&select=status`, {
              headers: getAuthHeaders(accessToken),
            }
          );

          if (statusResponse.status === 200) {
            const content = statusResponse.json();
            if (content.length > 0 && content[0].status === 'processed') {
              processingComplete = true;
              contentProcessingTime.add(Date.now() - captureStart);
            }
          }
        }

        check(null, {
          'content processing completed': () => processingComplete,
        });
      }

      sleep(2);
    });

    group('Content Browsing', () => {
      // Get user's content list
      const listResponse = http.get(
        `${BASE_URL}/rest/v1/content_items?select=*&limit=20&order=captured_at.desc`, {
          headers: getAuthHeaders(accessToken),
        }
      );

      check(listResponse, {
        'content list loaded': (r) => r.status === 200,
        'content list not empty': (r) => r.json().length > 0,
      });

      sleep(1);

      // Get specific content item
      if (listResponse.status === 200) {
        const contentList = listResponse.json();
        if (contentList.length > 0) {
          const firstContentId = contentList[0].id;

          const detailResponse = http.get(
            `${BASE_URL}/rest/v1/content_items?id=eq.${firstContentId}&select=*`, {
              headers: getAuthHeaders(accessToken),
            }
          );

          check(detailResponse, {
            'content detail loaded': (r) => r.status === 200,
          });
        }
      }

      sleep(2);
    });

    group('Search Functionality', () => {
      const searchStart = Date.now();

      const searchResponse = http.get(
        `${BASE_URL}/rest/v1/content_items?or=(title.ilike.*tech*,original_content.ilike.*tech*)&limit=10`, {
          headers: getAuthHeaders(accessToken),
        }
      );

      const searchSuccess = check(searchResponse, {
        'search completed': (r) => r.status === 200,
        'search results returned': (r) => r.json() !== undefined,
      });

      if (searchSuccess) {
        searchResponseTime.add(Date.now() - searchStart);
      }

      sleep(1);

      // Advanced search with filters
      const advancedSearchResponse = http.get(
        `${BASE_URL}/rest/v1/content_items?status=eq.processed&priority=in.(medium,high)&limit=5`, {
          headers: getAuthHeaders(accessToken),
        }
      );

      check(advancedSearchResponse, {
        'advanced search completed': (r) => r.status === 200,
      });

      sleep(2);
    });

    group('AI Processing', () => {
      // Trigger AI processing job
      const aiResponse = http.post(`${BASE_URL}/functions/v1/process-content-ai`,
        JSON.stringify({
          content_id: 'test-content-' + Math.random().toString(36).substr(2, 9),
          job_type: 'summarize',
          input_data: {
            content: 'This is sample content for AI processing load testing. '.repeat(50),
          },
        }), {
          headers: getAuthHeaders(accessToken),
        }
      );

      check(aiResponse, {
        'AI processing initiated': (r) => r.status === 200,
        'job ID returned': (r) => r.json('job_id') !== undefined,
      });

      sleep(3);
    });

    group('Context Suggestions', () => {
      // Get context-based suggestions
      const contextResponse = http.post(`${BASE_URL}/functions/v1/context-suggestions`,
        JSON.stringify({
          user_context: {
            location: {
              lat: 37.7749,
              lng: -122.4194,
            },
            time_of_day: 'morning',
            day_of_week: 'weekday',
          },
        }), {
          headers: getAuthHeaders(accessToken),
        }
      );

      check(contextResponse, {
        'context suggestions retrieved': (r) => r.status === 200,
        'suggestions returned': (r) => r.json('suggestions') !== undefined,
      });

      sleep(2);
    });
  });

  // Random sleep between iterations
  sleep(Math.random() * 3 + 1);
}

// Spike test scenario
export function spikeTest() {
  const user = testUsers[0];
  const accessToken = authenticateUser(user);

  if (accessToken) {
    // Rapid-fire requests to test system stability
    for (let i = 0; i < 10; i++) {
      http.get(`${BASE_URL}/rest/v1/content_items?limit=5`, {
        headers: getAuthHeaders(accessToken),
      });
    }
  }
}

// Stress test scenario for Edge Functions
export function edgeFunctionStress() {
  const user = testUsers[0];
  const accessToken = authenticateUser(user);

  if (accessToken) {
    // Concurrent AI processing requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push([
        'POST',
        `${BASE_URL}/functions/v1/process-content-ai`,
        JSON.stringify({
          content_id: `stress-test-${i}`,
          job_type: 'summarize',
          input_data: {
            content: 'Stress test content. '.repeat(100),
          },
        }),
        { headers: getAuthHeaders(accessToken) }
      ]);
    }

    const responses = http.batch(requests);

    check(responses, {
      'all AI requests completed': (responses) =>
        responses.every(r => r.status === 200 || r.status === 202),
    });
  }
}

// Database connection test
export function databaseConnectionTest() {
  const user = testUsers[0];
  const accessToken = authenticateUser(user);

  if (accessToken) {
    // Test multiple concurrent database connections
    const dbRequests = [];
    for (let i = 0; i < 20; i++) {
      dbRequests.push([
        'GET',
        `${BASE_URL}/rest/v1/content_items?limit=1&offset=${i}`,
        null,
        { headers: getAuthHeaders(accessToken) }
      ]);
    }

    const responses = http.batch(dbRequests);

    check(responses, {
      'all database queries successful': (responses) =>
        responses.every(r => r.status === 200),
    });
  }
}

// Setup function for test data
export function setup() {
  console.log('Setting up load test environment...');

  // Create test users if they don't exist
  testUsers.forEach(user => {
    http.post(`${BASE_URL}/auth/v1/signup`, {
      email: user.email,
      password: user.password,
      data: {
        name: user.name,
      },
    }, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
  });

  console.log('Load test setup completed');
  return { setupComplete: true };
}

// Teardown function
export function teardown(data) {
  console.log('Tearing down load test environment...');
  // Cleanup test data if needed
  console.log('Load test teardown completed');
}