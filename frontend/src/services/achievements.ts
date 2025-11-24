import api from './api';
import { Achievement, UserAchievement } from '../types';

export const achievementsService = {
  getAll: async (): Promise<Achievement[]> => {
    const { data } = await api.get<Achievement[]>('/achievements');
    return data;
  },

  getMy: async (): Promise<{
    unlocked: UserAchievement[];
    inProgress: UserAchievement[];
    totalPoints: number;
    totalUnlocked: number;
  }> => {
    const { data } = await api.get('/achievements/my');
    return data;
  },

  check: async (): Promise<{ newlyUnlocked: Achievement[]; count: number }> => {
    const { data } = await api.post('/achievements/check');
    return data;
  },
};

