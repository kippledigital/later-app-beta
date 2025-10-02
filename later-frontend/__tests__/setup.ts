// Test setup for React Native/Expo frontend tests
import 'react-native-gesture-handler/jestSetup';

// Mock Expo modules
jest.mock('expo-constants', () => ({
  Constants: {
    expoConfig: {
      name: 'later-app',
      slug: 'later-app',
    },
    platform: {
      ios: {
        platform: 'ios',
      },
    },
  },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Stack: {
    Screen: ({ children }: any) => children,
  },
  Tabs: {
    Screen: ({ children }: any) => children,
  },
  Link: ({ children }: any) => children,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: ({ children }: any) => children,
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: any) => children,
}));

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn((fn) => {
    const store = fn(jest.fn(), jest.fn());
    return () => store;
  }),
}));

// Mock network requests
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: React.createElement'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Custom matchers for React Native testing
expect.extend({
  toHaveAccessibilityLabel(received, expected) {
    const pass = received.props.accessibilityLabel === expected;
    return {
      message: () =>
        pass
          ? `expected element not to have accessibility label "${expected}"`
          : `expected element to have accessibility label "${expected}", but got "${received.props.accessibilityLabel}"`,
      pass,
    };
  },

  toHaveAccessibilityRole(received, expected) {
    const pass = received.props.accessibilityRole === expected;
    return {
      message: () =>
        pass
          ? `expected element not to have accessibility role "${expected}"`
          : `expected element to have accessibility role "${expected}", but got "${received.props.accessibilityRole}"`,
      pass,
    };
  },

  toHaveTestID(received, expected) {
    const pass = received.props.testID === expected;
    return {
      message: () =>
        pass
          ? `expected element not to have testID "${expected}"`
          : `expected element to have testID "${expected}", but got "${received.props.testID}"`,
      pass,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibilityLabel(label: string): R;
      toHaveAccessibilityRole(role: string): R;
      toHaveTestID(testID: string): R;
    }
  }
}