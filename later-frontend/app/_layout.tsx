import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error && 'status' in error && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Initialize app on mount
  useEffect(() => {
    // Platform-specific initialization
    if (Platform.OS === 'web') {
      // Web-specific setup
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="content/[id]"
                options={{
                  headerShown: true,
                  title: 'Content',
                  presentation: 'card'
                }}
              />
              <Stack.Screen
                name="capture"
                options={{
                  presentation: 'modal',
                  title: 'Capture Content'
                }}
              />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
