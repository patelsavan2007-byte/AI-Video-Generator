import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../../store/authStore';

export function useAuth() {
  const loginFn = useAuthStore((state) => state.login);
  const logoutFn = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      loginFn(data.access_token, data.user_id, data.email);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/register', credentials);
      return data;
    },
    onSuccess: (data) => {
      loginFn(data.access_token, data.user_id, data.email);
    },
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutFn,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
