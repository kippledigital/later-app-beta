import { create } from 'zustand';

export interface UserContext {
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  availableTime?: number; // minutes
  currentActivity?: 'commuting' | 'working' | 'relaxing' | 'exercising';
  deviceContext: {
    battery: number;
    isCharging: boolean;
    networkType: 'wifi' | 'cellular' | 'offline';
    deviceType: 'phone' | 'tablet';
  };
  preferences: {
    contentTypes: Array<'article' | 'video' | 'podcast' | 'short'>;
    topics: string[];
    readingSpeed: number; // words per minute
    notificationFrequency: 'high' | 'medium' | 'low' | 'off';
  };
}

export interface ContextState {
  userContext: UserContext;
  isUpdating: boolean;
  lastUpdated: string | null;
  recommendations: any[]; // Will be typed based on recommendation structure
  isLoadingRecommendations: boolean;
}

export interface ContextActions {
  updateContext: (context: Partial<UserContext>) => Promise<void>;
  updateDeviceContext: (deviceContext: Partial<UserContext['deviceContext']>) => void;
  updatePreferences: (preferences: Partial<UserContext['preferences']>) => void;
  updateLocation: (location: UserContext['location']) => void;
  updateTimeOfDay: () => void;
  fetchRecommendations: () => Promise<void>;
  setAvailableTime: (minutes: number) => void;
  setCurrentActivity: (activity: UserContext['currentActivity']) => void;
}

export type ContextStore = ContextState & ContextActions;

const getTimeOfDay = (): UserContext['timeOfDay'] => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const initialState: ContextState = {
  userContext: {
    timeOfDay: getTimeOfDay(),
    deviceContext: {
      battery: 100,
      isCharging: false,
      networkType: 'wifi',
      deviceType: 'phone',
    },
    preferences: {
      contentTypes: ['article', 'video', 'podcast'],
      topics: [],
      readingSpeed: 250, // average reading speed
      notificationFrequency: 'medium',
    },
  },
  isUpdating: false,
  lastUpdated: null,
  recommendations: [],
  isLoadingRecommendations: false,
};

export const useContextStore = create<ContextStore>((set, get) => ({
  ...initialState,

  updateContext: async (contextUpdates: Partial<UserContext>) => {
    set({ isUpdating: true });
    try {
      const updatedContext = {
        ...get().userContext,
        ...contextUpdates,
      };

      // TODO: Replace with actual API call
      const response = await fetch('/api/context/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* get auth token */}`,
        },
        body: JSON.stringify(updatedContext),
      });

      if (!response.ok) {
        throw new Error('Failed to update context');
      }

      set({
        userContext: updatedContext,
        lastUpdated: new Date().toISOString(),
        isUpdating: false,
      });

      // Fetch new recommendations based on updated context
      get().fetchRecommendations();
    } catch (error) {
      set({ isUpdating: false });
      throw error;
    }
  },

  updateDeviceContext: (deviceContext: Partial<UserContext['deviceContext']>) => {
    set(state => ({
      userContext: {
        ...state.userContext,
        deviceContext: {
          ...state.userContext.deviceContext,
          ...deviceContext,
        },
      },
    }));
  },

  updatePreferences: (preferences: Partial<UserContext['preferences']>) => {
    const updatedPreferences = {
      ...get().userContext.preferences,
      ...preferences,
    };

    set(state => ({
      userContext: {
        ...state.userContext,
        preferences: updatedPreferences,
      },
    }));

    // Update context with new preferences
    get().updateContext({ preferences: updatedPreferences });
  },

  updateLocation: (location: UserContext['location']) => {
    set(state => ({
      userContext: {
        ...state.userContext,
        location,
      },
    }));
  },

  updateTimeOfDay: () => {
    const timeOfDay = getTimeOfDay();
    set(state => ({
      userContext: {
        ...state.userContext,
        timeOfDay,
      },
    }));
  },

  fetchRecommendations: async () => {
    set({ isLoadingRecommendations: true });
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/recommendations/now', {
        headers: {
          'Authorization': `Bearer ${/* get auth token */}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      set({
        recommendations: data.recommendations,
        isLoadingRecommendations: false,
      });
    } catch (error) {
      set({ isLoadingRecommendations: false });
      throw error;
    }
  },

  setAvailableTime: (minutes: number) => {
    set(state => ({
      userContext: {
        ...state.userContext,
        availableTime: minutes,
      },
    }));
  },

  setCurrentActivity: (activity: UserContext['currentActivity']) => {
    set(state => ({
      userContext: {
        ...state.userContext,
        currentActivity: activity,
      },
    }));
  },
}));