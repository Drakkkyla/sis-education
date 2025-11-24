import api from './api';
import { Submission } from '../types';

export const submissionsService = {
  upload: async (file: File, courseId: string, lessonId: string, exerciseIndex?: number): Promise<Submission> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('lessonId', lessonId);
    if (exerciseIndex !== undefined) {
      formData.append('exerciseIndex', exerciseIndex.toString());
    }

    const { data } = await api.post<Submission>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getAll: async (courseId?: string, lessonId?: string): Promise<Submission[]> => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (lessonId) params.append('lessonId', lessonId);
    const { data } = await api.get<Submission[]>(`/uploads?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<Submission> => {
    const { data } = await api.get<Submission>(`/uploads/${id}`);
    return data;
  },
};

