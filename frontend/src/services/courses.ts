import api from './api';
import { Course, Lesson, Progress } from '../types';

export const coursesService = {
  getAll: async (category?: string, level?: string): Promise<Course[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (level) params.append('level', level);
    const { data } = await api.get<Course[]>(`/courses?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<Course> => {
    const { data } = await api.get<Course>(`/courses/${id}`);
    return data;
  },

  getProgress: async (courseId: string): Promise<Progress> => {
    const { data } = await api.get<Progress>(`/courses/${courseId}/progress`);
    return data;
  },
};

export const lessonsService = {
  getAll: async (courseId?: string): Promise<Lesson[]> => {
    const params = courseId ? `?course=${courseId}` : '';
    const { data } = await api.get<Lesson[]>(`/lessons${params}`);
    return data;
  },

  getById: async (id: string): Promise<Lesson> => {
    const { data } = await api.get<Lesson>(`/lessons/${id}`);
    return data;
  },

  complete: async (lessonId: string, timeSpent?: number): Promise<Progress> => {
    const { data } = await api.post<Progress>(`/lessons/${lessonId}/complete`, { timeSpent });
    return data;
  },

  getProgress: async (lessonId: string): Promise<Progress> => {
    const { data } = await api.get<Progress>(`/lessons/${lessonId}/progress`);
    return data;
  },
};

