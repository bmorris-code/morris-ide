import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../utils/logger';

// Simple auth store that works with Clerk
// Clerk handles most auth state, this is for additional app state

interface UserProfile {
  id: string;
  email: string;
  name: string;
  imageUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  licenseKey?: string;
  createdAt: string;
}

interface AuthStore {
  profile: UserProfile | null;
  licenseKey: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  setLicenseKey: (key: string) => void;
  validateLicenseKey: (key: string) => Promise<boolean>;
  clearError: () => void;
  logout: () => void;

  // For demo/offline mode
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      profile: null,
      licenseKey: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        // Check for stored license key in Electron
        set({ isInitialized: true });
      },

      setProfile: (profile) => set({ profile }),

      setLicenseKey: (key) => set({ licenseKey: key }),

      validateLicenseKey: async (key: string) => {
        set({ isLoading: true, error: null });
        try {
          // In production, validate against your backend API
          // For now, accept any key that matches pattern for demo
          const isValid = /^MORRIS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
          if (isValid) {
            set({ licenseKey: key });
            logger.info('License key validated successfully', 'Auth', { keyPattern: 'valid' });
            return true;
          }
          throw new Error('Invalid license key format. Expected format: MORRIS-XXXX-XXXX-XXXX');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Validation failed';
          set({ error: message });
          logger.error('License key validation failed', 'Auth', { error: message });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Demo mode login (when Clerk is not configured)
      login: async (email: string, _password: string) => {
        set({ isLoading: true, error: null });
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        set({
          profile: {
            id: 'demo-user',
            email,
            name: email.split('@')[0],
            plan: 'free',
            createdAt: new Date().toISOString(),
          },
          isLoading: false,
        });
      },

      signup: async (email: string, _password: string, name: string) => {
        set({ isLoading: true, error: null });
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
          profile: {
            id: 'demo-user',
            email,
            name,
            plan: 'free',
            createdAt: new Date().toISOString(),
          },
          isLoading: false,
        });
      },

      logout: () => set({ profile: null, licenseKey: null }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'morris-auth-store',
      partialize: (state) => ({
        profile: state.profile,
        licenseKey: state.licenseKey
      }),
    }
  )
);
