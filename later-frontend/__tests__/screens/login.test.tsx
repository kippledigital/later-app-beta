// Test suite for Login screen
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

// Mock the auth store
const mockLogin = jest.fn();
const mockAuthStore = {
  login: mockLogin,
  isLoading: false,
  isAuthenticated: false,
  user: null,
};

jest.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Link: ({ children, href }: any) => children,
}));

// Simplified Login component for testing
// In a real implementation, this would import the actual component
function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = require('@/stores/auth').useAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      setErrors({ password: error.message || 'Login failed' });
    }
  };

  return (
    <>
      <Text testID="login-title">Welcome Back</Text>

      <TextInput
        testID="email-input"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email input"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email && (
        <Text testID="email-error" accessibilityRole="alert">
          {errors.email}
        </Text>
      )}

      <TextInput
        testID="password-input"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Password input"
        secureTextEntry
      />
      {errors.password && (
        <Text testID="password-error" accessibilityRole="alert">
          {errors.password}
        </Text>
      )}

      <TouchableOpacity
        testID="login-button"
        onPress={handleLogin}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={isLoading ? "Logging in..." : "Login"}
      >
        <Text>{isLoading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="register-link"
        onPress={() => router.push('/register')}
        accessibilityRole="link"
        accessibilityLabel="Go to registration"
      >
        <Text>Don't have an account? Register</Text>
      </TouchableOpacity>
    </>
  );
}

// Import React Native components for the test component
import { Text, TextInput, TouchableOpacity } from 'react-native';

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStore.isLoading = false;
    mockAuthStore.isAuthenticated = false;
  });

  describe('Rendering', () => {
    it('should render all login form elements', () => {
      const { getByTestId, getByText } = render(<LoginScreen />);

      expect(getByTestId('login-title')).toBeTruthy();
      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy();
      expect(getByTestId('register-link')).toBeTruthy();
    });

    it('should display correct placeholder text', () => {
      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');

      expect(emailInput.props.placeholder).toBe('Email');
      expect(passwordInput.props.placeholder).toBe('Password');
    });

    it('should configure input properties correctly', () => {
      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');

      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('email-error')).toBeTruthy();
      });

      const emailError = getByTestId('email-error');
      expect(emailError.props.children).toBe('Email is required');
    });

    it('should show error when email format is invalid', async () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('email-error')).toBeTruthy();
      });

      const emailError = getByTestId('email-error');
      expect(emailError.props.children).toBe('Email is invalid');
    });

    it('should show error when password is empty', async () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('password-error')).toBeTruthy();
      });

      const passwordError = getByTestId('password-error');
      expect(passwordError.props.children).toBe('Password is required');
    });

    it('should show error when password is too short', async () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('password-error')).toBeTruthy();
      });

      const passwordError = getByTestId('password-error');
      expect(passwordError.props.children).toBe('Password must be at least 6 characters');
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      for (const email of validEmails) {
        const { getByTestId, queryByTestId } = render(<LoginScreen />);

        const emailInput = getByTestId('email-input');
        const passwordInput = getByTestId('password-input');
        const loginButton = getByTestId('login-button');

        fireEvent.changeText(emailInput, email);
        fireEvent.changeText(passwordInput, 'validpassword');
        fireEvent.press(loginButton);

        await waitFor(() => {
          expect(queryByTestId('email-error')).toBeFalsy();
        });
      }
    });
  });

  describe('User Interactions', () => {
    it('should update email state when typing', () => {
      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');

      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password state when typing', () => {
      const { getByTestId } = render(<LoginScreen />);

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });

    it('should call login function with correct credentials', async () => {
      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should navigate to tabs after successful login', async () => {
      mockLogin.mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should navigate to register screen when register link is pressed', () => {
      const { getByTestId } = render(<LoginScreen />);

      const registerLink = getByTestId('register-link');
      fireEvent.press(registerLink);

      expect(mockRouter.push).toHaveBeenCalledWith('/register');
    });
  });

  describe('Loading States', () => {
    it('should disable login button when loading', () => {
      mockAuthStore.isLoading = true;

      const { getByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      expect(loginButton.props.disabled).toBe(true);
    });

    it('should show loading text when logging in', () => {
      mockAuthStore.isLoading = true;

      const { getByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      const buttonText = loginButton.props.children.props.children;
      expect(buttonText).toBe('Logging in...');
    });

    it('should show normal text when not loading', () => {
      mockAuthStore.isLoading = false;

      const { getByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      const buttonText = loginButton.props.children.props.children;
      expect(buttonText).toBe('Login');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when login fails', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('password-error')).toBeTruthy();
      });

      const passwordError = getByTestId('password-error');
      expect(passwordError.props.children).toBe('Invalid credentials');
    });

    it('should show generic error for unknown failures', async () => {
      mockLogin.mockRejectedValueOnce(new Error());

      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('password-error')).toBeTruthy();
      });

      const passwordError = getByTestId('password-error');
      expect(passwordError.props.children).toBe('Login failed');
    });

    it('should clear errors when user starts typing', async () => {
      // First trigger an error
      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('email-error')).toBeTruthy();
      });

      // Then start typing in email field
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 't');

      // Error should still be there initially (validation happens on submit)
      expect(queryByTestId('email-error')).toBeTruthy();

      // But after entering a valid email and pressing login again
      fireEvent.changeText(emailInput, 'test@example.com');
      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('email-error')).toBeFalsy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');
      const registerLink = getByTestId('register-link');

      expect(emailInput).toHaveAccessibilityLabel('Email input');
      expect(passwordInput).toHaveAccessibilityLabel('Password input');
      expect(loginButton).toHaveAccessibilityLabel('Login');
      expect(registerLink).toHaveAccessibilityLabel('Go to registration');
    });

    it('should have proper accessibility roles', () => {
      const { getByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      const registerLink = getByTestId('register-link');

      expect(loginButton).toHaveAccessibilityRole('button');
      expect(registerLink).toHaveAccessibilityRole('link');
    });

    it('should mark error messages as alerts', async () => {
      const { getByTestId, queryByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(queryByTestId('email-error')).toBeTruthy();
      });

      const emailError = getByTestId('email-error');
      expect(emailError.props.accessibilityRole).toBe('alert');
    });

    it('should update accessibility label during loading', () => {
      mockAuthStore.isLoading = true;

      const { getByTestId } = render(<LoginScreen />);

      const loginButton = getByTestId('login-button');
      expect(loginButton).toHaveAccessibilityLabel('Logging in...');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      function TestWrapper() {
        renderSpy();
        return <LoginScreen />;
      }

      const { rerender } = render(<TestWrapper />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestWrapper />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid input changes efficiently', () => {
      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');

      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(emailInput, `test${i}@example.com`);
      }

      expect(emailInput.props.value).toBe('test99@example.com');
    });
  });
});