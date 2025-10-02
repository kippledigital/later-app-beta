// E2E performance tests for Later app
import { TestHelpers } from '../setup';

describe('App Performance Tests', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  describe('App Launch Performance', () => {
    it('should launch within acceptable time limits', async () => {
      const launchTime = await TestHelpers.measureAppLaunchTime();

      // App should launch within 3 seconds
      expect(launchTime).toBeLessThan(3000);

      // Should show main interface quickly
      await TestHelpers.waitForElementToAppear('app-root', 3000);
    });

    it('should handle cold start efficiently', async () => {
      // Terminate app completely
      await device.terminateApp();
      await device.sleep(2000); // Wait to ensure cold start

      const startTime = Date.now();
      await device.launchApp();

      // Wait for app to be interactive
      await TestHelpers.waitForElementToAppear('login-screen', 5000);
      const coldStartTime = Date.now() - startTime;

      // Cold start should be under 5 seconds
      expect(coldStartTime).toBeLessThan(5000);
    });

    it('should warm start quickly', async () => {
      // First launch
      await TestHelpers.login();

      // Send app to background
      await device.sendToHome();
      await device.sleep(1000);

      const startTime = Date.now();

      // Bring app back to foreground
      await device.launchApp();
      await TestHelpers.waitForElementToAppear('tabs-container', 2000);

      const warmStartTime = Date.now() - startTime;

      // Warm start should be under 1 second
      expect(warmStartTime).toBeLessThan(1000);
    });
  });

  describe('Navigation Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should navigate between tabs quickly', async () => {
      const tabs = ['now-tab', 'inbox-tab', 'library-tab', 'explore-tab'];

      for (const tab of tabs) {
        const startTime = Date.now();
        await element(by.id(tab)).tap();
        await TestHelpers.waitForElementToAppear(`${tab}-content`, 2000);
        const navigationTime = Date.now() - startTime;

        // Tab navigation should be under 500ms
        expect(navigationTime).toBeLessThan(500);
      }
    });

    it('should handle deep navigation efficiently', async () => {
      await TestHelpers.navigateToTab('library-tab');

      const startTime = Date.now();

      // Navigate through multiple levels
      await element(by.text('Technology Trends 2024')).tap();
      await TestHelpers.waitForElementToAppear('content-detail-screen', 2000);

      await element(by.id('edit-content-button')).tap();
      await TestHelpers.waitForElementToAppear('edit-content-screen', 2000);

      await element(by.id('advanced-settings-button')).tap();
      await TestHelpers.waitForElementToAppear('advanced-settings-screen', 2000);

      const deepNavigationTime = Date.now() - startTime;

      // Deep navigation should complete within 3 seconds
      expect(deepNavigationTime).toBeLessThan(3000);
    });
  });

  describe('Content Loading Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should load content lists efficiently', async () => {
      await TestHelpers.navigateToTab('library-tab');

      const startTime = Date.now();

      // Wait for content list to load
      await TestHelpers.waitForElementToAppear('content-list', 3000);

      // Check that list is scrollable (content loaded)
      const contentList = element(by.id('content-list'));
      await expect(contentList).toBeAbleToScroll();

      const loadTime = Date.now() - startTime;

      // Content list should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    it('should implement efficient infinite scrolling', async () => {
      await TestHelpers.navigateToTab('library-tab');
      await TestHelpers.waitForElementToAppear('content-list', 3000);

      const contentList = element(by.id('content-list'));

      // Measure scroll performance
      const startTime = Date.now();

      // Scroll to trigger loading more content
      for (let i = 0; i < 5; i++) {
        await contentList.scroll(300, 'down');
        await device.sleep(100); // Small delay between scrolls
      }

      // Wait for new content to load
      await TestHelpers.waitForElementToAppear('load-more-content-indicator', 2000);
      await TestHelpers.waitForElementToDisappear('load-more-content-indicator', 5000);

      const scrollLoadTime = Date.now() - startTime;

      // Infinite scroll should be responsive
      expect(scrollLoadTime).toBeLessThan(5000);
    });

    it('should handle large content efficiently', async () => {
      // Navigate to a piece of long-form content
      await TestHelpers.navigateToTab('library-tab');
      await element(by.text('Very Long Article')).tap();

      const startTime = Date.now();

      // Wait for content to render
      await TestHelpers.waitForElementToAppear('content-text', 5000);

      // Check that content is scrollable
      const contentView = element(by.id('content-scroll-view'));
      await expect(contentView).toBeAbleToScroll();

      const renderTime = Date.now() - startTime;

      // Large content should render within 3 seconds
      expect(renderTime).toBeLessThan(3000);
    });
  });

  describe('Search Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
      await TestHelpers.navigateToTab('library-tab');
    });

    it('should perform search queries quickly', async () => {
      await element(by.id('search-button')).tap();

      const startTime = Date.now();

      await element(by.id('search-input')).typeText('technology');
      await element(by.id('search-submit-button')).tap();

      // Wait for search results
      await TestHelpers.waitForElementToAppear('search-results-list', 3000);

      const searchTime = Date.now() - startTime;

      // Search should complete within 2 seconds
      expect(searchTime).toBeLessThan(2000);
    });

    it('should handle live search efficiently', async () => {
      await element(by.id('search-button')).tap();

      // Enable live search
      await element(by.id('live-search-toggle')).tap();

      const searchInput = element(by.id('search-input'));

      // Type gradually and measure response times
      const characters = 'tech';
      const responseTimes: number[] = [];

      for (let i = 0; i < characters.length; i++) {
        const startTime = Date.now();
        await searchInput.typeText(characters[i]);

        // Wait for search suggestions to appear
        await TestHelpers.waitForElementToAppear('search-suggestions', 1000);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      // All live search responses should be under 500ms
      responseTimes.forEach(time => {
        expect(time).toBeLessThan(500);
      });
    });
  });

  describe('Offline Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should handle offline mode gracefully', async () => {
      // Go offline
      await TestHelpers.simulateNetworkConditions('offline');

      const startTime = Date.now();

      // Navigate to cached content
      await TestHelpers.navigateToTab('library-tab');
      await TestHelpers.waitForElementToAppear('offline-indicator', 2000);

      // Should still load cached content quickly
      await expect(element(by.id('content-list'))).toBeVisibleOnScreen();

      const offlineLoadTime = Date.now() - startTime;

      // Offline content should load within 1 second
      expect(offlineLoadTime).toBeLessThan(1000);
    });

    it('should sync efficiently when coming back online', async () => {
      // Start offline and create some content
      await TestHelpers.simulateNetworkConditions('offline');

      // Add content while offline
      await element(by.id('capture-button')).tap();
      await element(by.id('text-capture-tab')).tap();
      await element(by.id('text-input')).typeText('Offline test content');
      await element(by.id('save-text-button')).tap();

      // Go back online
      const startTime = Date.now();
      await TestHelpers.resetNetworkConditions();

      // Wait for sync to complete
      await TestHelpers.waitForElementToAppear('sync-indicator', 2000);
      await TestHelpers.waitForElementToDisappear('sync-indicator', 10000);

      const syncTime = Date.now() - startTime;

      // Sync should complete within 8 seconds
      expect(syncTime).toBeLessThan(8000);
    });
  });

  describe('Memory and Resource Usage', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should handle memory efficiently during heavy usage', async () => {
      // Simulate heavy usage scenario
      const operations = [
        () => TestHelpers.navigateToTab('library-tab'),
        () => TestHelpers.navigateToTab('inbox-tab'),
        () => element(by.id('search-button')).tap(),
        () => element(by.id('search-input')).typeText('test'),
        () => element(by.id('search-submit-button')).tap(),
        () => TestHelpers.goBack(),
        () => TestHelpers.navigateToTab('explore-tab'),
        () => element(by.id('refresh-button')).tap(),
      ];

      // Perform operations repeatedly
      for (let cycle = 0; cycle < 5; cycle++) {
        for (const operation of operations) {
          await operation();
          await device.sleep(200); // Small delay between operations
        }
      }

      // App should remain responsive
      await TestHelpers.navigateToTab('now-tab');
      await expect(element(by.id('now-tab-content'))).toBeVisibleOnScreen();
    });

    it('should handle large datasets without performance degradation', async () => {
      // Seed a large amount of content
      for (let i = 0; i < 50; i++) {
        await TestHelpers.captureContent(`https://example.com/article-${i}`);
      }

      await TestHelpers.navigateToTab('library-tab');

      const startTime = Date.now();

      // Load library with large dataset
      await TestHelpers.waitForElementToAppear('content-list', 5000);

      // Test scrolling performance
      const contentList = element(by.id('content-list'));
      for (let i = 0; i < 10; i++) {
        await contentList.scroll(200, 'down');
      }

      const scrollTime = Date.now() - startTime;

      // Should handle large datasets within reasonable time
      expect(scrollTime).toBeLessThan(10000);
    });
  });

  describe('Animation and UI Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should render animations smoothly', async () => {
      // Test swipe animations
      await TestHelpers.navigateToTab('inbox-tab');

      const startTime = Date.now();

      // Perform multiple swipe gestures
      for (let i = 0; i < 5; i++) {
        await element(by.text('Technology Trends 2024')).swipe('left', 'fast');
        await device.sleep(100);
        await element(by.text('Technology Trends 2024')).swipe('right', 'fast');
        await device.sleep(100);
      }

      const animationTime = Date.now() - startTime;

      // Animations should complete smoothly within expected time
      expect(animationTime).toBeLessThan(3000);
    });

    it('should handle rapid user interactions', async () => {
      await TestHelpers.navigateToTab('library-tab');

      // Perform rapid taps and navigation
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await element(by.id('search-button')).tap();
        await element(by.id('back-button')).tap();
      }

      const interactionTime = Date.now() - startTime;

      // Should handle rapid interactions without freezing
      expect(interactionTime).toBeLessThan(5000);

      // UI should remain responsive
      await expect(element(by.id('library-tab-content'))).toBeVisibleOnScreen();
    });
  });

  describe('Network Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should handle slow network conditions', async () => {
      await TestHelpers.simulateNetworkConditions('slow');

      const startTime = Date.now();

      // Capture content with slow network
      await TestHelpers.captureContent('https://example.com/slow-load-test');

      const captureTime = Date.now() - startTime;

      // Should complete capture even with slow network (within timeout)
      expect(captureTime).toBeLessThan(60000); // 60 second timeout

      // Should show appropriate loading indicators
      await expect(element(by.text('Slow connection detected'))).toBeVisibleOnScreen();
    });

    it('should batch network requests efficiently', async () => {
      // Trigger multiple operations that require network requests
      const startTime = Date.now();

      await Promise.all([
        TestHelpers.navigateToTab('explore-tab'),
        element(by.id('refresh-library-button')).tap(),
        element(by.id('sync-button')).tap(),
      ]);

      // Wait for all operations to complete
      await TestHelpers.waitForElementToDisappear('loading-indicator', 10000);

      const batchTime = Date.now() - startTime;

      // Batched operations should complete efficiently
      expect(batchTime).toBeLessThan(8000);
    });
  });

  describe('Background Performance', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should handle background processing efficiently', async () => {
      // Start content capture that will process in background
      await TestHelpers.captureContent('https://example.com/background-test');

      // Send app to background during processing
      await device.sendToHome();
      await device.sleep(5000); // Let background processing continue

      // Bring app back to foreground
      const startTime = Date.now();
      await device.launchApp();

      // Should resume quickly and show updated state
      await TestHelpers.waitForElementToAppear('tabs-container', 3000);

      const resumeTime = Date.now() - startTime;

      // Background resume should be quick
      expect(resumeTime).toBeLessThan(2000);

      // Background processing should have completed
      await TestHelpers.navigateToTab('library-tab');
      await expect(element(by.text('Background Test'))).toBeVisibleOnScreen();
    });

    it('should manage background sync performance', async () => {
      // Create content for sync
      await TestHelpers.captureContent('https://example.com/sync-test-1');
      await TestHelpers.captureContent('https://example.com/sync-test-2');

      // Send to background to trigger background sync
      await device.sendToHome();
      await device.sleep(10000); // Allow background sync time

      const startTime = Date.now();
      await device.launchApp();

      // Should show updated content quickly
      await TestHelpers.waitForElementToAppear('tabs-container', 3000);

      const syncResumeTime = Date.now() - startTime;

      // Background sync resume should be efficient
      expect(syncResumeTime).toBeLessThan(2000);
    });
  });
});