import api from './api';
import { Course, Lesson, Quiz, User } from '../types';

export const adminService = {
  // Courses
  createCourse: async (courseData: Partial<Course>): Promise<Course> => {
    const { data } = await api.post<Course>('/admin/courses', courseData);
    return data;
  },

  updateCourse: async (id: string, courseData: Partial<Course>): Promise<Course> => {
    const { data } = await api.put<Course>(`/admin/courses/${id}`, courseData);
    return data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/admin/courses/${id}`);
  },

  // Lessons
  createLesson: async (lessonData: Partial<Lesson>): Promise<Lesson> => {
    const { data } = await api.post<Lesson>('/admin/lessons', lessonData);
    return data;
  },

  updateLesson: async (id: string, lessonData: Partial<Lesson>): Promise<Lesson> => {
    const { data } = await api.put<Lesson>(`/admin/lessons/${id}`, lessonData);
    return data;
  },

  deleteLesson: async (id: string): Promise<void> => {
    await api.delete(`/admin/lessons/${id}`);
  },

  // Quizzes
  createQuiz: async (quizData: Partial<Quiz>): Promise<Quiz> => {
    const { data } = await api.post<Quiz>('/admin/quizzes', quizData);
    return data;
  },

  updateQuiz: async (id: string, quizData: Partial<Quiz>): Promise<Quiz> => {
    const { data } = await api.put<Quiz>(`/admin/quizzes/${id}`, quizData);
    return data;
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await api.delete(`/admin/quizzes/${id}`);
  },

  // Get all courses (including unpublished)
  getAllCourses: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>('/admin/courses');
    return data;
  },

  // Get my courses (for teachers)
  getMyCourses: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>('/admin/courses/my');
    return data;
  },

  // Get course students
  getCourseStudents: async (courseId: string): Promise<User[]> => {
    const { data } = await api.get<User[]>(`/admin/courses/${courseId}/students`);
    return data;
  },

  // Add students to course
  addCourseStudents: async (courseId: string, studentIds: string[]): Promise<User[]> => {
    const { data } = await api.post<User[]>(`/admin/courses/${courseId}/students`, { studentIds });
    return data;
  },

  // Remove student from course
  removeCourseStudent: async (courseId: string, studentId: string): Promise<User[]> => {
    const { data } = await api.delete<User[]>(`/admin/courses/${courseId}/students/${studentId}`);
    return data;
  },

  // Get all lessons (including unpublished)
  getAllLessons: async (courseId?: string): Promise<Lesson[]> => {
    const params = courseId ? `?course=${courseId}` : '';
    const { data } = await api.get<Lesson[]>(`/admin/lessons${params}`);
    return data;
  },

  // Lesson photos
  uploadLessonPhotos: async (lessonId: string, photos: File[]): Promise<{ photos: string[] }> => {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });
    const { data } = await api.post<{ photos: string[] }>(`/admin/lessons/${lessonId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteLessonPhoto: async (lessonId: string, photoIndex: number): Promise<{ photos: string[] }> => {
    const { data } = await api.delete<{ photos: string[] }>(`/admin/lessons/${lessonId}/photos/${photoIndex}`);
    return data;
  },
};

