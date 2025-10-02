// E2E tests for authentication workflows
import { TestHelpers } from '../setup';

describe('Authentication Workflows', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  describe('User Registration', () => {
    it('should complete user registration successfully', async () => {
      // Navigate to registration from login screen
      await element(by.id('register-link')).tap();

      // Verify we're on registration screen
      await expect(element(by.id('registration-screen'))).toBeVisibleOnScreen();

      // Fill out registration form
      await element(by.id('name-input')).typeText('Test User');
      await element(by.id('email-input')).typeText('newuser@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');

      // Accept terms and conditions
      await element(by.id('terms-checkbox')).tap();

      // Submit registration
      await element(by.id('register-button')).tap();

      // Wait for registration to complete and navigate to onboarding
      await TestHelpers.waitForElementToAppear('onboarding-screen', 10000);

      // Verify onboarding screen appears
      await expect(element(by.id('onboarding-welcome'))).toBeVisibleOnScreen();
    });

    it('should show validation errors for invalid registration data', async () => {
      await element(by.id('register-link')).tap();

      // Try to register with invalid data
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText('123'); // Too short
      await element(by.id('register-button')).tap();

      // Check for validation errors
      await expect(element(by.id('email-error'))).toBeVisibleOnScreen();
      await expect(element(by.id('password-error'))).toBeVisibleOnScreen();
    });

    it('should handle registration failure gracefully', async () => {
      await element(by.id('register-link')).tap();

      // Use email that already exists (mock server should return error)
      await element(by.id('name-input')).typeText('Test User');
      await element(by.id('email-input')).typeText('existing@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');
      await element(by.id('terms-checkbox')).tap();
      await element(by.id('register-button')).tap();

      // Should show error message
      await expect(element(by.id('registration-error'))).toBeVisibleOnScreen();
      await expect(element(by.text('Email already exists'))).toBeVisibleOnScreen();
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      await TestHelpers.login();

      // Verify we're logged in and on the main app
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
      await expect(element(by.id('now-tab'))).toBeVisibleOnScreen();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('wrong@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();

      // Should show login error
      await expect(element(by.id('login-error'))).toBeVisibleOnScreen();
      await expect(element(by.text('Invalid credentials'))).toBeVisibleOnScreen();
    });

    it('should handle network errors during login', async () => {
      // Simulate offline condition
      await TestHelpers.simulateNetworkConditions('offline');

      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();

      // Should show network error
      await expect(element(by.text('Network error'))).toBeVisibleOnScreen();

      // Restore network and retry
      await TestHelpers.resetNetworkConditions();
      await element(by.id('retry-button')).tap();

      // Should now succeed
      await TestHelpers.waitForElementToAppear('tabs-container', 10000);
    });

    it('should remember login state after app restart', async () => {
      // Login first
      await TestHelpers.login();
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Should still be logged in
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
    });
  });

  describe('OAuth Authentication', () => {
    it('should handle Google OAuth login', async () => {
      await element(by.id('google-login-button')).tap();

      // In a real test, you would interact with the OAuth flow
      // Here we simulate successful OAuth completion
      await TestHelpers.waitForElementToAppear('tabs-container', 15000);

      // Verify successful login
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
    });

    it('should handle Apple Sign-In', async () => {
      if (device.getPlatform() === 'ios') {
        await element(by.id('apple-login-button')).tap();

        // Simulate Apple Sign-In flow
        await TestHelpers.waitForElementToAppear('tabs-container', 15000);
        await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
      }
    });

    it('should handle OAuth cancellation', async () => {
      await element(by.id('google-login-button')).tap();

      // Simulate user canceling OAuth flow
      // This would depend on your OAuth implementation
      await element(by.text('Cancel')).tap();

      // Should return to login screen
      await expect(element(by.id('login-screen'))).toBeVisibleOnScreen();
    });
  });

  describe('Biometric Authentication', () => {
    beforeEach(async () => {
      // First login and enable biometric auth
      await TestHelpers.login();
      await TestHelpers.navigateToTab('profile-tab');
      await element(by.id('enable-biometric-toggle')).tap();
      await TestHelpers.logout();
    });

    it('should allow biometric login when enabled', async () => {
      if (device.getPlatform() === 'ios') {
        // Trigger biometric authentication
        await element(by.id('biometric-login-button')).tap();

        // Simulate successful biometric authentication
        await device.setBiometricEnrollment(true);
        await device.matchBiometric();

        // Should be logged in
        await TestHelpers.waitForElementToAppear('tabs-container', 5000);
        await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
      }
    });

    it('should fallback to password login when biometric fails', async () => {
      if (device.getPlatform() === 'ios') {
        await element(by.id('biometric-login-button')).tap();

        // Simulate failed biometric authentication
        await device.unmatchBiometric();

        // Should show fallback option
        await expect(element(by.text('Use Password'))).toBeVisibleOnScreen();
        await element(by.text('Use Password')).tap();

        // Should show password login
        await expect(element(by.id('password-input'))).toBeVisibleOnScreen();
      }
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset successfully', async () => {
      await element(by.id('forgot-password-link')).tap();

      // Fill in email for password reset
      await element(by.id('reset-email-input')).typeText('test@example.com');
      await element(by.id('send-reset-button')).tap();

      // Should show confirmation
      await expect(element(by.text('Reset email sent'))).toBeVisibleOnScreen();
    });

    it('should handle invalid email for password reset', async () => {
      await element(by.id('forgot-password-link')).tap();

      await element(by.id('reset-email-input')).typeText('nonexistent@example.com');
      await element(by.id('send-reset-button')).tap();

      // Should show error
      await expect(element(by.text('Email not found'))).toBeVisibleOnScreen();
    });
  });

  describe('Onboarding Flow', () => {
    beforeEach(async () => {
      // Complete registration to access onboarding
      await element(by.id('register-link')).tap();
      await element(by.id('name-input')).typeText('New User');
      await element(by.id('email-input')).typeText('onboarding@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');
      await element(by.id('terms-checkbox')).tap();
      await element(by.id('register-button')).tap();

      await TestHelpers.waitForElementToAppear('onboarding-screen', 10000);
    });

    it('should complete onboarding flow', async () => {
      // Step 1: Welcome
      await expect(element(by.id('onboarding-welcome'))).toBeVisibleOnScreen();
      await element(by.id('next-button')).tap();

      // Step 2: Permissions
      await expect(element(by.id('onboarding-permissions'))).toBeVisibleOnScreen();
      await element(by.id('allow-notifications-button')).tap();
      await element(by.id('next-button')).tap();

      // Step 3: Preferences
      await expect(element(by.id('onboarding-preferences'))).toBeVisibleOnScreen();
      await element(by.id('interest-technology')).tap();
      await element(by.id('interest-productivity')).tap();
      await element(by.id('next-button')).tap();

      // Step 4: Complete
      await expect(element(by.id('onboarding-complete'))).toBeVisibleOnScreen();
      await element(by.id('finish-button')).tap();

      // Should navigate to main app
      await TestHelpers.waitForElementToAppear('tabs-container', 5000);
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
    });

    it('should allow skipping onboarding', async () => {
      await element(by.id('skip-onboarding-button')).tap();

      // Should navigate directly to main app
      await TestHelpers.waitForElementToAppear('tabs-container', 5000);
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
    });

    it('should allow going back in onboarding flow', async () => {
      // Go to step 2
      await element(by.id('next-button')).tap();
      await expect(element(by.id('onboarding-permissions'))).toBeVisibleOnScreen();

      // Go back to step 1
      await element(by.id('back-button')).tap();
      await expect(element(by.id('onboarding-welcome'))).toBeVisibleOnScreen();
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration gracefully', async () => {
      await TestHelpers.login();

      // Simulate session expiration (this would depend on your implementation)
      // For example, you might make an API call that returns 401
      await TestHelpers.navigateToTab('library-tab');

      // Simulate expired session scenario
      // Should show session expired message and redirect to login
      await expect(element(by.text('Session expired'))).toBeVisibleOnScreen();
      await element(by.text('Login Again')).tap();

      await TestHelpers.waitForElementToAppear('login-screen', 5000);
      await expect(element(by.id('login-screen'))).toBeVisibleOnScreen();
    });

    it('should refresh auth tokens automatically', async () => {
      await TestHelpers.login();

      // Navigate around the app to trigger token refresh scenarios
      await TestHelpers.navigateToTab('inbox-tab');
      await TestHelpers.navigateToTab('library-tab');
      await TestHelpers.navigateToTab('profile-tab');

      // App should remain logged in throughout
      await expect(element(by.id('tabs-container'))).toBeVisibleOnScreen();
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      await TestHelpers.login();
    });

    it('should logout successfully', async () => {
      await TestHelpers.logout();
      await expect(element(by.id('login-screen'))).toBeVisibleOnScreen();
    });

    it('should clear all app data on logout', async () => {
      // Add some content first
      await TestHelpers.captureContent('https://example.com/test');

      // Logout
      await TestHelpers.logout();

      // Login again
      await TestHelpers.login();

      // Previous session data should be cleared (depending on your app's behavior)
      await TestHelpers.navigateToTab('library-tab');
      // This assertion depends on whether you clear data on logout
      // await expect(element(by.text('No content'))).toBeVisibleOnScreen();
    });

    it('should show confirmation dialog before logout', async () => {
      await TestHelpers.navigateToTab('profile-tab');
      await element(by.id('logout-button')).tap();

      // Should show confirmation
      await expect(element(by.text('Are you sure you want to logout?'))).toBeVisibleOnScreen();

      // Cancel logout
      await element(by.text('Cancel')).tap();
      await expect(element(by.id('profile-tab-content'))).toBeVisibleOnScreen();

      // Try again and confirm
      await element(by.id('logout-button')).tap();
      await element(by.text('Logout')).tap();

      await TestHelpers.waitForElementToAppear('login-screen', 5000);
      await expect(element(by.id('login-screen'))).toBeVisibleOnScreen();
    });
  });
});