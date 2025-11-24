import api from './api';
import { User } from '../types';

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'student' | 'teacher' | 'admin';
  group?: string;
}

export interface BulkCreateUsersData {
  users: Array<{
    username?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: 'student' | 'teacher' | 'admin';
  }>;
  role?: 'student' | 'teacher' | 'admin';
  defaultPassword?: string;
}

export interface BulkCreateByCountData {
  count: number;
  role?: 'student' | 'teacher' | 'admin';
  defaultPassword?: string;
  prefix?: string;
  group?: string;
  startFrom?: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: 'student' | 'teacher' | 'admin';
  isActive?: boolean;
  group?: string | null;
}

export const usersService = {
  getAll: async (role?: string, group?: string, search?: string): Promise<User[]> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (group) params.append('group', group);
    if (search) params.append('search', search);
    const queryString = params.toString();
    const { data } = await api.get<User[]>(`/admin/users${queryString ? `?${queryString}` : ''}`);
    return data;
  },

  create: async (userData: CreateUserData): Promise<User> => {
    const { data } = await api.post<User>('/admin/users', userData);
    return data;
  },

  bulkCreate: async (bulkData: BulkCreateUsersData): Promise<{
    created: number;
    failed: number;
    users: User[];
    errors: Array<{ index: number; email: string; error: string }>;
  }> => {
    const { data } = await api.post('/admin/users/bulk', bulkData);
    return data;
  },

  bulkCreateByCount: async (bulkData: BulkCreateByCountData): Promise<{
    created: number;
    failed: number;
    users: Array<User & { password?: string }>;
    errors: Array<{ index: number; username: string; error: string }>;
  }> => {
    const { data } = await api.post('/admin/users/bulk-count', bulkData);
    return data;
  },

  update: async (userId: string, userData: UpdateUserData): Promise<User> => {
    const { data } = await api.put<User>(`/admin/users/${userId}`, userData);
    return data;
  },

  delete: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
  },
};

