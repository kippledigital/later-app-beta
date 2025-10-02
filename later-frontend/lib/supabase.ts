import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter that uses Expo SecureStore for tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use secure storage for authentication tokens
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Type definitions for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
          privacy_level: 'strict' | 'balanced' | 'open';
          data_retention_days: number;
          enable_ai_processing: boolean;
          enable_context_detection: boolean;
          enable_location_services: boolean;
          enable_calendar_integration: boolean;
          notification_preferences: any;
          interface_preferences: any;
          subscription_tier: 'free' | 'premium' | 'enterprise';
          monthly_content_limit: number;
          storage_used_bytes: number;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          privacy_level?: 'strict' | 'balanced' | 'open';
          data_retention_days?: number;
          enable_ai_processing?: boolean;
          enable_context_detection?: boolean;
          enable_location_services?: boolean;
          enable_calendar_integration?: boolean;
          notification_preferences?: any;
          interface_preferences?: any;
          subscription_tier?: 'free' | 'premium' | 'enterprise';
          monthly_content_limit?: number;
          storage_used_bytes?: number;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          privacy_level?: 'strict' | 'balanced' | 'open';
          data_retention_days?: number;
          enable_ai_processing?: boolean;
          enable_context_detection?: boolean;
          enable_location_services?: boolean;
          enable_calendar_integration?: boolean;
          notification_preferences?: any;
          interface_preferences?: any;
          subscription_tier?: 'free' | 'premium' | 'enterprise';
          monthly_content_limit?: number;
          storage_used_bytes?: number;
        };
      };
      content_items: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          original_content: string | null;
          processed_content: string | null;
          summary: string | null;
          url: string | null;
          source: string;
          status: string;
          priority: string;
          tags: string[];
          categories: string[];
          key_entities: any | null;
          sentiment_score: number | null;
          reading_time_minutes: number | null;
          word_count: number | null;
          language: string;
          context: any | null;
          metadata: any | null;
          scheduled_for: string | null;
          consumed_at: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title?: string | null;
          original_content?: string | null;
          processed_content?: string | null;
          summary?: string | null;
          url?: string | null;
          source: string;
          status?: string;
          priority?: string;
          tags?: string[];
          categories?: string[];
          key_entities?: any | null;
          sentiment_score?: number | null;
          reading_time_minutes?: number | null;
          word_count?: number | null;
          language?: string;
          context?: any | null;
          metadata?: any | null;
          scheduled_for?: string | null;
        };
        Update: {
          title?: string | null;
          original_content?: string | null;
          processed_content?: string | null;
          summary?: string | null;
          url?: string | null;
          source?: string;
          status?: string;
          priority?: string;
          tags?: string[];
          categories?: string[];
          key_entities?: any | null;
          sentiment_score?: number | null;
          reading_time_minutes?: number | null;
          word_count?: number | null;
          language?: string;
          context?: any | null;
          metadata?: any | null;
          scheduled_for?: string | null;
          consumed_at?: string | null;
          archived_at?: string | null;
        };
      };
    };
  };
};