// Jest setup file for backend tests
import { setupTestDatabase, cleanup } from './test-setup';

// Global test setup
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';

  // Increase timeout for setup
  jest.setTimeout(60000);

  // Set up test database
  await setupTestDatabase();
});

// Global test teardown
afterAll(async () => {
  // Clean up test environment
  await cleanup();
});

// Custom matchers for testing
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidISODate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received.includes('T') && received.includes('Z');

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      };
    }
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidUUID(): R;
      toBeValidISODate(): R;
    }
  }
}

// Console suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  // Only show errors in test output if they're test-related
  if (process.env.JEST_VERBOSE === 'true') {
    originalConsoleError.apply(console, args);
  }
};

console.warn = (...args: any[]) => {
  // Only show warnings in test output if they're test-related
  if (process.env.JEST_VERBOSE === 'true') {
    originalConsoleWarn.apply(console, args);
  }
};