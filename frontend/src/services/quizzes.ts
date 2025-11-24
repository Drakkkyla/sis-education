import api from './api';
import { Quiz, QuizResult } from '../types';

export interface QuizSubmission {
  answers: (string | string[])[];
  timeSpent?: number;
}

export const quizzesService = {
  getAll: async (courseId?: string, lessonId?: string): Promise<Quiz[]> => {
    const params = new URLSearchParams();
    if (courseId) params.append('course', courseId);
    if (lessonId) params.append('lesson', lessonId);
    const { data } = await api.get<Quiz[]>(`/quizzes?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<Quiz> => {
    const { data } = await api.get<Quiz>(`/quizzes/${id}`);
    return data;
  },

  submit: async (quizId: string, submission: QuizSubmission): Promise<{ result: QuizResult; quiz: Quiz }> => {
    const { data } = await api.post(`/quizzes/${quizId}/submit`, submission);
    return data;
  },

  getResults: async (quizId: string): Promise<QuizResult[]> => {
    const { data } = await api.get<QuizResult[]>(`/quizzes/${quizId}/results`);
    return data;
  },
};

