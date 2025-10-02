// Test suite for Auth store (Zustand)
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/auth';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock successful API responses
const mockLoginResponse = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  token: 'access-token-123',
  refreshToken: 'refresh-token-123',
};

const mockRefreshResponse = {
  token: 'new-access-token-456',
  refreshToken: 'new-refresh-token-456',
};

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset AsyncStorage
    AsyncStorage.clear();

    // Reset fetch mock
    mockFetch.mockClear();

    // Reset store state
    useAuthStore.getState().logout();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useAuthStore.getState();

      expect(store.user).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.token).toBeNull();
      expect(store.refreshToken).toBeNull();
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully with valid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const state = result.current;
      expect(state.user).toEqual(mockLoginResponse.user);
      expect(state.token).toBe(mockLoginResponse.token);
      expect(state.refreshToken).toBe(mockLoginResponse.refreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Login failed');
      });

      const state = result.current;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as any);

      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({
          ok: true,
          json: async () => mockLoginResponse,
        });
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('should make correct API call for login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });
  });

  describe('Registration Functionality', () => {
    it('should register successfully with valid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'Test User');
      });

      const state = result.current;
      expect(state.user).toEqual(mockLoginResponse.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle registration failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.register('invalid-email', 'weak', 'User')
        ).rejects.toThrow('Registration failed');
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should make correct API call for registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('test@example.com', 'password123', 'Test User');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should clear all auth state on logout', async () => {
      // First login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Verify login state
      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      const state = result.current;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Token Refresh Functionality', () => {
    it('should refresh tokens successfully', async () => {
      // Setup initial logged in state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Mock refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      } as Response);

      await act(async () => {
        await result.current.refreshAuth();
      });

      const state = result.current;
      expect(state.token).toBe(mockRefreshResponse.token);
      expect(state.refreshToken).toBe(mockRefreshResponse.refreshToken);
    });

    it('should handle refresh failure and logout user', async () => {
      // Setup initial logged in state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Mock failed refresh
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await act(async () => {
        await expect(result.current.refreshAuth()).rejects.toThrow('Token refresh failed');
      });

      // Should be logged out
      const state = result.current;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should throw error when no refresh token available', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(result.current.refreshAuth()).rejects.toThrow('No refresh token available');
      });
    });

    it('should make correct API call for token refresh', async () => {
      // Setup initial logged in state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Mock refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      } as Response);

      await act(async () => {
        await result.current.refreshAuth();
      });

      expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: mockLoginResponse.refreshToken,
        }),
      });
    });
  });

  describe('User Update Functionality', () => {
    it('should update user information', async () => {
      // First login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Update user
      const updates = {
        name: 'Updated Name',
        avatar: 'https://example.com/new-avatar.jpg',
      };

      act(() => {
        result.current.updateUser(updates);
      });

      const state = result.current;
      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.avatar).toBe('https://example.com/new-avatar.jpg');
      expect(state.user?.email).toBe('test@example.com'); // Should preserve other fields
    });

    it('should handle update when no user is logged in', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: 'Should Not Update' });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Loading State Management', () => {
    it('should manually set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist auth state to AsyncStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Check if data was stored in AsyncStorage
      const storedData = await AsyncStorage.getItem('auth-storage');
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData.state.user).toEqual(mockLoginResponse.user);
      expect(parsedData.state.token).toBe(mockLoginResponse.token);
      expect(parsedData.state.isAuthenticated).toBe(true);
    });

    it('should restore auth state from AsyncStorage', async () => {
      // Pre-populate AsyncStorage
      const persistedState = {
        state: {
          user: mockLoginResponse.user,
          token: mockLoginResponse.token,
          refreshToken: mockLoginResponse.refreshToken,
          isAuthenticated: true,
        },
        version: 0,
      };

      await AsyncStorage.setItem('auth-storage', JSON.stringify(persistedState));

      // Create new store instance (simulates app restart)
      const { result } = renderHook(() => useAuthStore());

      // Note: In a real test, you might need to wait for rehydration
      // This depends on how zustand persistence is configured
      expect(result.current.user).toEqual(mockLoginResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear persisted data on logout', async () => {
      // First login and verify persistence
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      let storedData = await AsyncStorage.getItem('auth-storage');
      expect(storedData).toBeTruthy();

      // Logout
      act(() => {
        result.current.logout();
      });

      // Check if auth data was cleared from storage
      storedData = await AsyncStorage.getItem('auth-storage');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.state.user).toBeNull();
        expect(parsedData.state.isAuthenticated).toBe(false);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent login attempts', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockFetch
        .mockReturnValueOnce(firstPromise as any)
        .mockReturnValueOnce(secondPromise as any);

      const { result } = renderHook(() => useAuthStore());

      // Start two concurrent login attempts
      const login1Promise = result.current.login('test1@example.com', 'password1');
      const login2Promise = result.current.login('test2@example.com', 'password2');

      // Resolve first login
      act(() => {
        resolveFirst({
          ok: true,
          json: async () => ({
            ...mockLoginResponse,
            user: { ...mockLoginResponse.user, email: 'test1@example.com' },
          }),
        });
      });

      await act(async () => {
        await login1Promise;
      });

      // Resolve second login
      act(() => {
        resolveSecond({
          ok: true,
          json: async () => ({
            ...mockLoginResponse,
            user: { ...mockLoginResponse.user, email: 'test2@example.com' },
          }),
        });
      });

      await act(async () => {
        await login2Promise;
      });

      // Last login should win
      expect(result.current.user?.email).toBe('test2@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'password123')
        ).rejects.toThrow('Network error');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'password123')
        ).rejects.toThrow('Invalid JSON');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });
});