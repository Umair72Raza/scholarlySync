import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  is_premium: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;

  /**
   * Called once on app boot (in App.tsx useEffect).
   * Hits GET /api/auth/me — if the accessToken cookie is valid the backend
   * returns the user and we hydrate state. If not, state is cleared.
   * This gives us persistent sessions across page refreshes for free.
   */
  initialize: () => Promise<void>;

  /**
   * Calls POST /api/auth/logout so the backend clears both httpOnly cookies,
   * then clears local Zustand state.
   */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until initialize() resolves

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  initialize: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      // Not authenticated (no valid cookie) — that's fine, just clear state
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Backend may already have cleared the session; ignore errors
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
