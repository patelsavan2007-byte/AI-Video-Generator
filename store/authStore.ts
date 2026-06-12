import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string, email: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  email: null,
  isAuthenticated: false,
  
  login: (token, userId, email) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_token', token);
      localStorage.setItem('vf_user_id', userId);
      localStorage.setItem('vf_email', email);
    }
    set({ token, userId, email, isAuthenticated: true });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_token');
      localStorage.removeItem('vf_user_id');
      localStorage.removeItem('vf_email');
    }
    set({ token: null, userId: null, email: null, isAuthenticated: false });
  },

  init: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vf_token');
      const userId = localStorage.getItem('vf_user_id');
      const email = localStorage.getItem('vf_email');
      
      if (token && userId && email) {
        set({ token, userId, email, isAuthenticated: true });
      }
    }
  }
}));
