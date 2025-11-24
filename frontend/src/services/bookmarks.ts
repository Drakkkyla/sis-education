import api from './api';
import { Bookmark } from '../types';

export const bookmarksService = {
  getAll: async (): Promise<Bookmark[]> => {
    const { data } = await api.get<Bookmark[]>('/bookmarks');
    return data;
  },

  create: async (data: {
    courseId?: string;
    lessonId?: string;
    quizId?: string;
    note?: string;
  }): Promise<Bookmark> => {
    const response = await api.post<Bookmark>('/bookmarks', data);
    return response.data;
  },

  update: async (id: string, note: string): Promise<Bookmark> => {
    const { data } = await api.put<Bookmark>(`/bookmarks/${id}`, { note });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bookmarks/${id}`);
  },
};

