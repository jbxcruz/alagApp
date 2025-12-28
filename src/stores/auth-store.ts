import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),

      initialize: async () => {
        const supabase = createClient();
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', user.id)
              .single();
            
            set({ user, profile, isLoading: false, isInitialized: true });
          } else {
            set({ user: null, profile: null, isLoading: false, isInitialized: true });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, profile: null, isLoading: false, isInitialized: true });
        }
      },

      signOut: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, profile: null });
      },

      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          set({ profile });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
);