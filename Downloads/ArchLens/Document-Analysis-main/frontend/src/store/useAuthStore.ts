import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/api/client';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('autoarch_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('autoarch_token'),
  isLoading: false,
  error: null,

  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem('autoarch_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('autoarch_token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  setUser: (user: User | null) => set({ user }),

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const auth = await api.login(username, password);
      get().setToken(auth.access_token);
      await get().fetchCurrentUser();
      set({ isLoading: false });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    get().setToken(null);
    localStorage.removeItem('autoarch_active_project');
    localStorage.removeItem('autoarch_active_document');
    set({ user: null, isAuthenticated: false, error: null });
  },

  fetchCurrentUser: async () => {
    if (!localStorage.getItem('autoarch_token')) return;
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      // If token is invalid or expired, log out
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));
