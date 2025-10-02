import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, type Database } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Database['public']['Tables']['profiles']['Update']>) => Promise<void>;
  initialize: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: async () => {
        try {
          set({ isLoading: true });

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
            set({ isLoading: false, isInitialized: true });
            return;
          }

          if (session) {
            await get()._setSession(session);
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session) {
                await get()._setSession(session);
              }
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
              });
            }
          });

          set({ isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },

      _setSession: async (session: Session) => {
        try {
          // Fetch user profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
          }

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.full_name || session.user.user_metadata?.full_name || '',
            avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at,
            updatedAt: profile?.updated_at || session.user.updated_at || session.user.created_at,
          };

          set({
            user,
            profile,
            session,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error setting session:', error);
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data.session) {
            await get()._setSession(data.session);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                full_name: name,
              },
            },
          });

          if (error) {
            throw new Error(error.message);
          }

          // If email confirmation is required, session will be null
          if (data.session) {
            await get()._setSession(data.session);
          } else if (data.user) {
            // Email confirmation required
            set({ isLoading: false });
            throw new Error('Please check your email and click the confirmation link to complete registration.');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithOAuth: async (provider: 'google' | 'apple') => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: 'exp://localhost:19000', // Expo development URL
            },
          });

          if (error) {
            throw new Error(error.message);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();

          if (error) {
            throw new Error(error.message);
          }

          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Force logout even if there's an error
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      resetPassword: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim().toLowerCase(),
            {
              redirectTo: 'exp://localhost:19000/reset-password', // Expo development URL
            }
          );

          if (error) {
            throw new Error(error.message);
          }
        } catch (error) {
          throw error;
        }
      },

      updateProfile: async (updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
        const { session } = get();
        if (!session) {
          throw new Error('No authenticated user');
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id)
            .select()
            .single();

          if (error) {
            throw new Error(error.message);
          }

          // Update local state
          const { user } = get();
          if (user && data) {
            const updatedUser: User = {
              ...user,
              name: data.full_name || user.name,
              avatar: data.avatar_url || user.avatar,
              updatedAt: data.updated_at,
            };

            set({
              user: updatedUser,
              profile: data,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isInitialized: state.isInitialized,
      }),
    }
  )
);