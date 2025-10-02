// E2E test setup for Detox
import { cleanup, init } from 'detox';

const config = require('../package.json').detox;

// Setup before all tests
beforeAll(async () => {
  await init(config, { initGlobals: false });
});

// Cleanup after all tests
afterAll(async () => {
  await cleanup();
});

// Setup before each test
beforeEach(async () => {
  await device.reloadReactNative();
});

// Custom matchers for Later app specific elements
expect.extend({
  async toBeVisibleOnScreen(received) {
    try {
      await received.toBeVisible();
      return {
        message: () => `Expected element not to be visible on screen`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected element to be visible on screen: ${error.message}`,
        pass: false,
      };
    }
  },

  async toHaveTextContent(received, expectedText: string) {
    try {
      await received.toHaveText(expectedText);
      return {
        message: () => `Expected element not to have text "${expectedText}"`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected element to have text "${expectedText}": ${error.message}`,
        pass: false,
      };
    }
  },

  async toBeAbleToScroll(received) {
    try {
      await received.scroll(100, 'down');
      await received.scroll(100, 'up');
      return {
        message: () => `Expected element not to be scrollable`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected element to be scrollable: ${error.message}`,
        pass: false,
      };
    }
  },
});

// Helper functions for common E2E test operations
export const TestHelpers = {
  // Authentication helpers
  async login(email: string = 'test@example.com', password: string = 'password123') {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('login-button')).tap();

    // Wait for navigation to complete
    await waitFor(element(by.id('tabs-container')))
      .toBeVisible()
      .withTimeout(10000);
  },

  async logout() {
    // Navigate to profile/settings
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();

    // Confirm logout if there's a confirmation dialog
    try {
      await element(by.text('Logout')).tap();
    } catch (e) {
      // No confirmation dialog
    }

    // Wait for login screen
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Content helpers
  async captureContent(url: string) {
    await element(by.id('capture-button')).tap();
    await element(by.id('url-input')).typeText(url);
    await element(by.id('save-content-button')).tap();

    // Wait for content to be processed
    await waitFor(element(by.id('content-processing-indicator')))
      .not.toBeVisible()
      .withTimeout(30000);
  },

  async searchContent(query: string) {
    await element(by.id('search-input')).typeText(query);
    await element(by.id('search-button')).tap();

    // Wait for search results
    await waitFor(element(by.id('search-results')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Navigation helpers
  async navigateToTab(tabId: string) {
    await element(by.id(tabId)).tap();
    await waitFor(element(by.id(`${tabId}-content`)))
      .toBeVisible()
      .withTimeout(3000);
  },

  async goBack() {
    await element(by.id('back-button')).tap();
  },

  // Assertion helpers
  async waitForElementToAppear(elementId: string, timeout: number = 5000) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  async waitForElementToDisappear(elementId: string, timeout: number = 5000) {
    await waitFor(element(by.id(elementId)))
      .not.toBeVisible()
      .withTimeout(timeout);
  },

  // Device interaction helpers
  async takeScreenshot(name: string) {
    await device.takeScreenshot(name);
  },

  async scrollToElement(scrollViewId: string, elementId: string) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .whileElement(by.id(scrollViewId))
      .scroll(200, 'down');
  },

  // Performance helpers
  async measureAppLaunchTime() {
    const startTime = Date.now();
    await device.launchApp();

    // Wait for app to be fully loaded
    await waitFor(element(by.id('app-root')))
      .toBeVisible()
      .withTimeout(10000);

    const endTime = Date.now();
    return endTime - startTime;
  },

  // Accessibility helpers
  async checkAccessibility() {
    // This is a placeholder for accessibility testing
    // In a real implementation, you would integrate with accessibility testing tools
    const elements = await element(by.type('RCTView')).getAttributes();

    // Check for accessibility labels, roles, etc.
    const accessibilityIssues = [];

    // Return issues found
    return accessibilityIssues;
  },

  // Network helpers
  async simulateNetworkConditions(condition: 'offline' | 'slow' | 'fast') {
    switch (condition) {
      case 'offline':
        await device.setNetworkConditions({
          offline: true
        });
        break;
      case 'slow':
        await device.setNetworkConditions({
          speed: 'GPRS',
          latency: 500
        });
        break;
      case 'fast':
        await device.setNetworkConditions({
          speed: 'LTE',
          latency: 50
        });
        break;
    }
  },

  async resetNetworkConditions() {
    await device.setNetworkConditions({});
  },
};

// Global error handler for E2E tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVisibleOnScreen(): Promise<R>;
      toHaveTextContent(text: string): Promise<R>;
      toBeAbleToScroll(): Promise<R>;
    }
  }
}