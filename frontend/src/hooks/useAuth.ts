import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginCredentials, RegisterData } from '../services/auth';
import { User } from '../types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(authService.getStoredUser());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authService.isAuthenticated() && !user) {
      authService.getCurrentUser().then(setUser).catch((error) => {
        console.error('Failed to get current user:', error);
        authService.logout();
        setUser(null);
      });
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success('Вход выполнен успешно');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка входа');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterData) => authService.register(userData),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success('Регистрация успешна');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка регистрации');
    },
  });

  const logout = () => {
    authService.logout();
    setUser(null);
    queryClient.clear();
    navigate('/login');
    toast.success('Выход выполнен');
  };

  return {
    user,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  };
};

