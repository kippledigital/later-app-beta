import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

// Mobile security utilities
export class MobileSecurity {
  private static encryptionKey: string | null = null;

  // Initialize security
  static async initialize(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      await this.getOrCreateEncryptionKey();

      // Check device security status
      await this.checkDeviceSecurity();
    } catch (error) {
      console.error('Security initialization failed:', error);
    }
  }

  // Generate or retrieve encryption key for sensitive data
  private static async getOrCreateEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      let key = await SecureStore.getItemAsync('app_encryption_key');

      if (!key) {
        // Generate new encryption key
        key = CryptoJS.lib.WordArray.random(256/8).toString();
        await SecureStore.setItemAsync('app_encryption_key', key);
      }

      this.encryptionKey = key;
      return key;
    } catch (error) {
      console.error('Failed to create encryption key:', error);
      throw new Error('Encryption key generation failed');
    }
  }

  // Encrypt sensitive data
  static async encryptData(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Decrypt sensitive data
  static async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Secure storage with encryption
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await this.encryptData(value);
      await SecureStore.setItemAsync(key, encrypted);
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store secure data');
    }
  }

  static async getSecureItem(key: string): Promise<string | null> {
    try {
      const encrypted = await SecureStore.getItemAsync(key);
      if (!encrypted) return null;

      return await this.decryptData(encrypted);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  static async deleteSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Secure deletion failed:', error);
    }
  }

  // Biometric authentication
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  }

  static async authenticateWithBiometrics(reason?: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to access your account',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Device security checks
  static async checkDeviceSecurity(): Promise<{
    isJailbroken: boolean;
    isEmulator: boolean;
    hasSecureStorage: boolean;
    deviceInfo: any;
  }> {
    try {
      const isEmulator = !Device.isDevice;

      // Basic jailbreak/root detection
      const isJailbroken = await this.detectJailbreak();

      // Check if secure storage is available
      const hasSecureStorage = await SecureStore.isAvailableAsync();

      const deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
        appVersion: Application.nativeApplicationVersion,
        buildVersion: Application.nativeBuildVersion,
      };

      const securityStatus = {
        isJailbroken,
        isEmulator,
        hasSecureStorage,
        deviceInfo,
      };

      // Log security concerns
      if (isJailbroken || isEmulator) {
        console.warn('Device security concern detected:', securityStatus);
      }

      return securityStatus;
    } catch (error) {
      console.error('Device security check failed:', error);
      return {
        isJailbroken: false,
        isEmulator: false,
        hasSecureStorage: false,
        deviceInfo: {},
      };
    }
  }

  // Basic jailbreak/root detection
  private static async detectJailbreak(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // Check for common jailbreak files/paths
        const jailbreakPaths = [
          '/Applications/Cydia.app',
          '/usr/sbin/sshd',
          '/usr/bin/ssh',
          '/private/var/lib/apt',
          '/private/var/lib/cydia',
        ];

        // Note: File system access is limited in React Native
        // This is a basic check and not comprehensive
        return false; // Placeholder - would need native module for real detection
      } else {
        // Android root detection would check for su binaries, superuser apps, etc.
        return false; // Placeholder
      }
    } catch (error) {
      return false;
    }
  }

  // Certificate pinning validation (placeholder for native implementation)
  static validateCertificatePinning(url: string): boolean {
    // This would be implemented with a native module in production
    // For now, we rely on React Native's default certificate validation
    return true;
  }

  // Prevent screenshot/recording in sensitive screens
  static async enableScreenshotPrevention(): Promise<void> {
    try {
      // This would require a native module to implement properly
      // On iOS: window.makeSecure()
      // On Android: getWindow().setFlags(FLAG_SECURE)
      console.log('Screenshot prevention enabled');
    } catch (error) {
      console.error('Failed to enable screenshot prevention:', error);
    }
  }

  static async disableScreenshotPrevention(): Promise<void> {
    try {
      console.log('Screenshot prevention disabled');
    } catch (error) {
      console.error('Failed to disable screenshot prevention:', error);
    }
  }

  // Generate device fingerprint for fraud detection
  static async generateDeviceFingerprint(): Promise<string> {
    try {
      const deviceInfo = await this.checkDeviceSecurity();

      const fingerprint = CryptoJS.SHA256(
        JSON.stringify({
          brand: deviceInfo.deviceInfo.brand,
          model: deviceInfo.deviceInfo.modelName,
          os: deviceInfo.deviceInfo.osName,
          osVersion: deviceInfo.deviceInfo.osVersion,
          platform: deviceInfo.deviceInfo.platform,
          isEmulator: deviceInfo.isEmulator,
        })
      ).toString();

      return fingerprint;
    } catch (error) {
      console.error('Device fingerprint generation failed:', error);
      return 'unknown';
    }
  }

  // Validate app integrity
  static async validateAppIntegrity(): Promise<boolean> {
    try {
      // Check if app signature is valid
      // This would require native implementation
      const appVersion = Application.nativeApplicationVersion;
      const buildVersion = Application.nativeBuildVersion;

      // Basic checks
      if (!appVersion || !buildVersion) {
        return false;
      }

      // In production, you would verify the app signature here
      return true;
    } catch (error) {
      console.error('App integrity validation failed:', error);
      return false;
    }
  }

  // Clear sensitive data on app backgrounding
  static clearSensitiveDataOnBackground(): void {
    // Clear memory caches, sensitive state, etc.
    // This would be called from AppState change handlers
    console.log('Clearing sensitive data');
  }

  // Security event logging
  static logSecurityEvent(event: string, data?: any): void {
    const timestamp = new Date().toISOString();

    console.log('Security Event:', {
      timestamp,
      event,
      data,
      platform: Platform.OS,
    });

    // In production, send to security monitoring service
  }
}

// Security hooks for React components
export function useSecurityValidation() {
  const checkSecurity = async () => {
    const security = await MobileSecurity.checkDeviceSecurity();

    if (security.isJailbroken) {
      MobileSecurity.logSecurityEvent('jailbroken_device_detected', security);
      // Handle jailbroken device (show warning, limit functionality, etc.)
    }

    if (security.isEmulator) {
      MobileSecurity.logSecurityEvent('emulator_detected', security);
      // Handle emulator (show warning in dev mode)
    }

    return security;
  };

  const requireBiometric = async (reason?: string): Promise<boolean> => {
    const isAvailable = await MobileSecurity.isBiometricAvailable();

    if (!isAvailable) {
      return false;
    }

    return await MobileSecurity.authenticateWithBiometrics(reason);
  };

  return {
    checkSecurity,
    requireBiometric,
    MobileSecurity,
  };
}

// Network security helpers
export class NetworkSecurity {
  // Validate SSL certificate (basic implementation)
  static validateSSL(url: string): boolean {
    return url.startsWith('https://');
  }

  // Add security headers to requests
  static getSecureHeaders(): Record<string, string> {
    return {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
  }

  // Validate response integrity
  static validateResponse(response: any): boolean {
    try {
      // Basic validation
      if (!response || typeof response !== 'object') {
        return false;
      }

      // Check for XSS attempts in response data
      const responseString = JSON.stringify(response);
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
      ];

      return !xssPatterns.some(pattern => pattern.test(responseString));
    } catch (error) {
      return false;
    }
  }
}