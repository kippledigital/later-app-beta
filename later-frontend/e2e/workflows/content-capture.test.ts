// E2E tests for content capture workflows
import { TestHelpers } from '../setup';

describe('Content Capture Workflows', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await TestHelpers.login();
  });

  describe('Web URL Capture', () => {
    it('should capture web content from URL successfully', async () => {
      // Navigate to capture screen
      await element(by.id('capture-button')).tap();
      await expect(element(by.id('capture-screen'))).toBeVisibleOnScreen();

      // Enter URL
      const testUrl = 'https://example.com/article';
      await element(by.id('url-input')).typeText(testUrl);
      await element(by.id('capture-url-button')).tap();

      // Should show processing indicator
      await expect(element(by.id('content-processing-indicator'))).toBeVisibleOnScreen();

      // Wait for processing to complete
      await TestHelpers.waitForElementToDisappear('content-processing-indicator', 30000);

      // Should navigate to content preview
      await expect(element(by.id('content-preview-screen'))).toBeVisibleOnScreen();
      await expect(element(by.id('captured-title'))).toBeVisibleOnScreen();
      await expect(element(by.id('captured-content'))).toBeVisibleOnScreen();

      // Save the content
      await element(by.id('save-content-button')).tap();

      // Should navigate back to Now tab and show success
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
      await expect(element(by.text('Content saved successfully'))).toBeVisibleOnScreen();
    });

    it('should handle invalid URLs gracefully', async () => {
      await element(by.id('capture-button')).tap();

      // Enter invalid URL
      await element(by.id('url-input')).typeText('not-a-valid-url');
      await element(by.id('capture-url-button')).tap();

      // Should show error message
      await expect(element(by.text('Invalid URL'))).toBeVisibleOnScreen();
    });

    it('should handle network errors during capture', async () => {
      await element(by.id('capture-button')).tap();

      // Simulate network issues
      await TestHelpers.simulateNetworkConditions('offline');

      await element(by.id('url-input')).typeText('https://example.com/article');
      await element(by.id('capture-url-button')).tap();

      // Should show network error
      await expect(element(by.text('Network error'))).toBeVisibleOnScreen();

      // Restore network and retry
      await TestHelpers.resetNetworkConditions();
      await element(by.id('retry-button')).tap();

      // Should now work
      await TestHelpers.waitForElementToAppear('content-preview-screen', 30000);
    });

    it('should validate URL format before capture', async () => {
      await element(by.id('capture-button')).tap();

      const invalidUrls = [
        'ftp://example.com',
        'javascript:alert("test")',
        'file:///etc/passwd',
        'data:text/html,<script>alert("xss")</script>'
      ];

      for (const url of invalidUrls) {
        await element(by.id('url-input')).clearText();
        await element(by.id('url-input')).typeText(url);
        await element(by.id('capture-url-button')).tap();

        await expect(element(by.text('Invalid URL protocol'))).toBeVisibleOnScreen();
      }
    });
  });

  describe('Share Extension Capture', () => {
    it('should handle content shared from external apps', async () => {
      // Simulate opening app from share extension
      await device.openURL({
        url: 'laterapp://capture?url=https://example.com/shared-article'
      });

      // Should open directly to content preview
      await TestHelpers.waitForElementToAppear('content-preview-screen', 30000);
      await expect(element(by.id('captured-title'))).toBeVisibleOnScreen();

      // Save the shared content
      await element(by.id('save-content-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
    });

    it('should handle malformed share URLs', async () => {
      await device.openURL({
        url: 'laterapp://capture?url=invalid-url'
      });

      // Should show error and redirect to capture screen
      await expect(element(by.text('Invalid shared URL'))).toBeVisibleOnScreen();
      await TestHelpers.waitForElementToAppear('capture-screen', 5000);
    });
  });

  describe('Voice Note Capture', () => {
    it('should record and transcribe voice notes', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('voice-capture-tab')).tap();

      // Start recording
      await element(by.id('record-button')).tap();
      await expect(element(by.id('recording-indicator'))).toBeVisibleOnScreen();

      // Simulate recording for a few seconds
      await device.sleep(3000);

      // Stop recording
      await element(by.id('stop-record-button')).tap();
      await TestHelpers.waitForElementToDisappear('recording-indicator', 2000);

      // Should show transcription processing
      await expect(element(by.id('transcription-processing'))).toBeVisibleOnScreen();

      // Wait for transcription to complete
      await TestHelpers.waitForElementToDisappear('transcription-processing', 15000);

      // Should show transcribed text
      await expect(element(by.id('transcribed-text'))).toBeVisibleOnScreen();

      // Save the voice note
      await element(by.id('save-voice-note-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
    });

    it('should handle microphone permission denial', async () => {
      // Deny microphone permission
      await device.setPermissions({
        microphone: 'denied'
      });

      await element(by.id('capture-button')).tap();
      await element(by.id('voice-capture-tab')).tap();
      await element(by.id('record-button')).tap();

      // Should show permission error
      await expect(element(by.text('Microphone permission required'))).toBeVisibleOnScreen();
      await expect(element(by.id('open-settings-button'))).toBeVisibleOnScreen();
    });

    it('should allow re-recording if transcription fails', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('voice-capture-tab')).tap();

      await element(by.id('record-button')).tap();
      await device.sleep(1000); // Very short recording
      await element(by.id('stop-record-button')).tap();

      // Simulate transcription failure
      await TestHelpers.waitForElementToDisappear('transcription-processing', 15000);
      await expect(element(by.text('Transcription failed'))).toBeVisibleOnScreen();

      // Should allow re-recording
      await element(by.id('record-again-button')).tap();
      await expect(element(by.id('record-button'))).toBeVisibleOnScreen();
    });
  });

  describe('Image/Screenshot Capture', () => {
    it('should capture content from camera', async () => {
      await device.setPermissions({
        camera: 'granted'
      });

      await element(by.id('capture-button')).tap();
      await element(by.id('camera-capture-tab')).tap();

      // Take photo
      await element(by.id('camera-button')).tap();

      // Simulate camera interface
      await element(by.id('take-photo-button')).tap();

      // Should show image preview
      await expect(element(by.id('image-preview'))).toBeVisibleOnScreen();

      // Process image for text extraction
      await element(by.id('extract-text-button')).tap();
      await TestHelpers.waitForElementToDisappear('text-extraction-processing', 20000);

      // Should show extracted text if any
      await expect(element(by.id('extracted-text-preview'))).toBeVisibleOnScreen();

      // Save the image capture
      await element(by.id('save-image-capture-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
    });

    it('should capture from photo library', async () => {
      await device.setPermissions({
        photos: 'granted'
      });

      await element(by.id('capture-button')).tap();
      await element(by.id('camera-capture-tab')).tap();
      await element(by.id('photo-library-button')).tap();

      // Simulate selecting photo from library
      await element(by.id('select-photo-button')).tap();

      await expect(element(by.id('image-preview'))).toBeVisibleOnScreen();
      await element(by.id('extract-text-button')).tap();

      await TestHelpers.waitForElementToDisappear('text-extraction-processing', 20000);
      await element(by.id('save-image-capture-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
    });

    it('should handle camera permission denial', async () => {
      await device.setPermissions({
        camera: 'denied'
      });

      await element(by.id('capture-button')).tap();
      await element(by.id('camera-capture-tab')).tap();
      await element(by.id('camera-button')).tap();

      await expect(element(by.text('Camera permission required'))).toBeVisibleOnScreen();
      await expect(element(by.id('open-settings-button'))).toBeVisibleOnScreen();
    });
  });

  describe('Manual Text Entry', () => {
    it('should capture manually entered text', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('text-capture-tab')).tap();

      const testText = 'This is a manually entered note for testing purposes.';
      await element(by.id('text-input')).typeText(testText);

      // Add title
      await element(by.id('title-input')).typeText('Manual Test Note');

      // Add tags
      await element(by.id('tags-input')).typeText('test, manual, note');

      // Save the text
      await element(by.id('save-text-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);

      // Verify content was saved
      await TestHelpers.navigateToTab('library-tab');
      await expect(element(by.text('Manual Test Note'))).toBeVisibleOnScreen();
    });

    it('should validate required fields for manual entry', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('text-capture-tab')).tap();

      // Try to save without content
      await element(by.id('save-text-button')).tap();

      await expect(element(by.text('Content is required'))).toBeVisibleOnScreen();
    });

    it('should support rich text formatting', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('text-capture-tab')).tap();

      await element(by.id('text-input')).typeText('This is bold text.');

      // Select text and apply formatting
      await element(by.id('text-input')).longPress();
      await element(by.text('Select All')).tap();
      await element(by.id('bold-button')).tap();

      // Verify formatting was applied
      await expect(element(by.id('formatted-text-preview'))).toBeVisibleOnScreen();

      await element(by.id('save-text-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
    });
  });

  describe('Capture Metadata and Context', () => {
    it('should capture location data when enabled', async () => {
      await device.setPermissions({
        location: 'granted'
      });

      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com/article');

      // Verify location toggle is available
      await expect(element(by.id('location-toggle'))).toBeVisibleOnScreen();
      await element(by.id('location-toggle')).tap();

      await element(by.id('capture-url-button')).tap();
      await TestHelpers.waitForElementToDisappear('content-processing-indicator', 30000);

      // Should show location context in preview
      await expect(element(by.id('location-context'))).toBeVisibleOnScreen();

      await element(by.id('save-content-button')).tap();
      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);
    });

    it('should capture time and date context', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('text-capture-tab')).tap();

      await element(by.id('text-input')).typeText('Time-sensitive note');
      await element(by.id('save-text-button')).tap();

      await TestHelpers.waitForElementToAppear('now-tab-content', 5000);

      // Check content in library to verify timestamp
      await TestHelpers.navigateToTab('library-tab');
      await element(by.text('Time-sensitive note')).tap();

      // Should show capture time
      await expect(element(by.id('capture-timestamp'))).toBeVisibleOnScreen();
    });

    it('should tag content based on context', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://github.com/example/repo');

      // Enable automatic tagging
      await element(by.id('auto-tag-toggle')).tap();

      await element(by.id('capture-url-button')).tap();
      await TestHelpers.waitForElementToDisappear('content-processing-indicator', 30000);

      // Should suggest relevant tags
      await expect(element(by.id('suggested-tags'))).toBeVisibleOnScreen();
      await expect(element(by.text('development'))).toBeVisibleOnScreen();
      await expect(element(by.text('github'))).toBeVisibleOnScreen();

      // Apply suggested tags
      await element(by.id('apply-suggested-tags-button')).tap();
      await element(by.id('save-content-button')).tap();
    });
  });

  describe('Capture Queue and Offline Support', () => {
    it('should queue captures when offline', async () => {
      // Go offline
      await TestHelpers.simulateNetworkConditions('offline');

      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com/offline-test');
      await element(by.id('capture-url-button')).tap();

      // Should show queued status
      await expect(element(by.text('Capture queued for when online'))).toBeVisibleOnScreen();

      // Go back online
      await TestHelpers.resetNetworkConditions();

      // Should automatically process queued items
      await TestHelpers.waitForElementToAppear('content-processing-indicator', 5000);
      await TestHelpers.waitForElementToDisappear('content-processing-indicator', 30000);

      // Should show success notification
      await expect(element(by.text('Queued capture processed'))).toBeVisibleOnScreen();
    });

    it('should show capture queue status', async () => {
      // Create some offline captures
      await TestHelpers.simulateNetworkConditions('offline');

      for (let i = 0; i < 3; i++) {
        await element(by.id('capture-button')).tap();
        await element(by.id('url-input')).clearText();
        await element(by.id('url-input')).typeText(`https://example.com/test-${i}`);
        await element(by.id('capture-url-button')).tap();
        await TestHelpers.goBack();
      }

      // Check queue status
      await element(by.id('capture-queue-button')).tap();
      await expect(element(by.text('3 items queued'))).toBeVisibleOnScreen();

      // Should be able to view and manage queue
      await expect(element(by.id('queue-list'))).toBeVisibleOnScreen();
      await expect(element(by.text('https://example.com/test-0'))).toBeVisibleOnScreen();
    });

    it('should handle partial network connectivity', async () => {
      await TestHelpers.simulateNetworkConditions('slow');

      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com/slow-test');
      await element(by.id('capture-url-button')).tap();

      // Should show slow network indicator
      await expect(element(by.text('Slow connection detected'))).toBeVisibleOnScreen();

      // Should still process but take longer
      await TestHelpers.waitForElementToDisappear('content-processing-indicator', 60000);
      await expect(element(by.id('content-preview-screen'))).toBeVisibleOnScreen();
    });
  });

  describe('Content Processing Feedback', () => {
    it('should show processing progress', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com/large-article');
      await element(by.id('capture-url-button')).tap();

      // Should show processing steps
      await expect(element(by.text('Fetching content...'))).toBeVisibleOnScreen();

      // Progress should update
      await TestHelpers.waitForElementToAppear('progress-bar', 5000);

      // Eventually show AI processing
      await expect(element(by.text('Processing with AI...'))).toBeVisibleOnScreen();

      await TestHelpers.waitForElementToDisappear('content-processing-indicator', 30000);
    });

    it('should allow canceling long-running captures', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com/very-large-page');
      await element(by.id('capture-url-button')).tap();

      // Should show cancel option during processing
      await expect(element(by.id('cancel-capture-button'))).toBeVisibleOnScreen();

      // Cancel the capture
      await element(by.id('cancel-capture-button')).tap();
      await expect(element(by.text('Capture cancelled'))).toBeVisibleOnScreen();

      // Should return to capture screen
      await expect(element(by.id('capture-screen'))).toBeVisibleOnScreen();
    });

    it('should show estimated processing time', async () => {
      await element(by.id('capture-button')).tap();
      await element(by.id('url-input')).typeText('https://example.com/medium-article');
      await element(by.id('capture-url-button')).tap();

      // Should show time estimate
      await expect(element(by.text('Estimated: 15-30 seconds'))).toBeVisibleOnScreen();
    });
  });
});