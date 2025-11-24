import api from './api';
import { Notification } from '../types';

export const notificationsService = {
  getAll: async (limit?: number, unreadOnly?: boolean): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    const { data } = await api.get(`/notifications?${params.toString()}`);
    return data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

