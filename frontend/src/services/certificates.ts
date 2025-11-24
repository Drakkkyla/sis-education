import api from './api';
import { Certificate } from '../types';

export const certificatesService = {
  getAll: async (): Promise<Certificate[]> => {
    const { data } = await api.get<Certificate[]>('/certificates');
    return data;
  },

  getById: async (id: string): Promise<Certificate> => {
    const { data } = await api.get<Certificate>(`/certificates/${id}`);
    return data;
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    const { data } = await api.get(`/certificates/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  checkAndIssue: async (courseId: string): Promise<{ message: string; certificate: Certificate }> => {
    const { data } = await api.post(`/certificates/check/${courseId}`);
    return data;
  },
};

