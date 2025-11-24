import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, BookOpen, FileText, BarChart3, CheckCircle, Clock, UserCog, Plus, Edit, Trash2, X, UserPlus } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import CourseForm from '../components/CourseForm';
import LessonForm from '../components/LessonForm';
import { adminService } from '../services/admin';
import { usersService } from '../services/users';
import { Course, Lesson, User } from '../types';

const AdminPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'submissions' | 'courses' | 'lessons'>('stats');
  const [reviewingSubmission, setReviewingSubmission] = useState<string | null>(null);
  const [reviewGrade, setReviewGrade] = useState<number | ''>('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();
  const [managingStudentsCourse, setManagingStudentsCourse] = useState<Course | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data } = await api.get('/admin/students');
      return data;
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: async () => {
      const { data } = await api.get('/admin/submissions');
      return data;
    },
  });

  const { data: adminCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminService.getAllCourses(),
    enabled: activeTab === 'courses',
  });

  const { data: allStudents } = useQuery({
    queryKey: ['all-students'],
    queryFn: () => usersService.getAll('student'),
    enabled: !!managingStudentsCourse,
  });

  const { data: courseStudents, refetch: refetchCourseStudents } = useQuery({
    queryKey: ['course-students', managingStudentsCourse?._id],
    queryFn: () => adminService.getCourseStudents(managingStudentsCourse!._id),
    enabled: !!managingStudentsCourse,
  });

  const { data: adminLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: () => adminService.getAllLessons(),
    enabled: activeTab === 'lessons',
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, grade, feedback, status }: { id: string; grade?: number; feedback?: string; status: string }) => {
      const { data } = await api.put(`/admin/submissions/${id}/review`, {
        grade,
        feedback,
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      toast.success('Работа проверена');
      setReviewingSubmission(null);
      setReviewGrade('');
      setReviewFeedback('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка проверки работы');
    },
  });

  const handleReview = (submissionId: string) => {
    reviewMutation.mutate({
      id: submissionId,
      grade: reviewGrade === '' ? undefined : Number(reviewGrade),
      feedback: reviewFeedback || undefined,
      status: reviewStatus,
    });
  };

  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Курс удален');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления курса');
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Урок удален');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления урока');
    },
  });

  const handleCreateCourse = () => {
    setEditingCourse(undefined);
    setShowCourseForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleCreateLesson = (courseId?: string) => {
    setEditingLesson(undefined);
    setSelectedCourseId(courseId);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedCourseId(undefined);
    setShowLessonForm(true);
  };

  const handleManageStudents = (course: Course) => {
    setManagingStudentsCourse(course);
    setSelectedStudentIds([]);
  };

  const addStudentsMutation = useMutation({
    mutationFn: (studentIds: string[]) => adminService.addCourseStudents(managingStudentsCourse!._id, studentIds),
    onSuccess: () => {
      refetchCourseStudents();
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Студенты добавлены');
      setSelectedStudentIds([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка добавления студентов');
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => adminService.removeCourseStudent(managingStudentsCourse!._id, studentId),
    onSuccess: () => {
      refetchCourseStudents();
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Студент удален из курса');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления студента');
    },
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Админ-панель</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Управление платформой</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/admin/users" className="btn btn-secondary">
            <UserCog className="h-5 w-5 mr-2" />
            Управление пользователями
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'stats'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Статистика
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'students'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Студенты
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'submissions'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Работы ({submissions?.filter((s: any) => s.status === 'pending').length || 0})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'courses'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Курсы
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'lessons'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            Уроки
          </button>
        </nav>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.users?.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Курсов</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.courses?.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Работ на проверку</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.submissions?.pending || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Завершено уроков</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.progress?.completedLessons || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Студенты</h2>
          {studentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : students && students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Имя
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Логин
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Завершено уроков
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Работ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student: any) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {student.firstName && student.lastName
                          ? `${student.firstName} ${student.lastName}`
                          : student.username || 'Пользователь'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        @{student.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.completedLessons || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.totalSubmissions || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Нет студентов</p>
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Работы на проверку
          </h2>
          {submissionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission: any) => (
                <div
                  key={submission._id}
                  className="p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {typeof submission.user === 'object' && submission.user !== null
                          ? `${submission.user.firstName || ''} ${submission.user.lastName || ''}`.trim() || submission.user.username
                          : 'Студент'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {typeof submission.course === 'object' && submission.course !== null ? submission.course.title : 'Курс'} -{' '}
                        {typeof submission.lesson === 'object' && submission.lesson !== null ? submission.lesson.title : 'Урок'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Файл: {submission.fileName} ({(submission.fileSize / 1024).toFixed(2)} KB)
                      </p>
                      {submission.grade !== undefined && (
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                          Оценка: {submission.grade}/5
                        </p>
                      )}
                      {submission.feedback && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Комментарий: {submission.feedback}
                        </p>
                      )}
                      {reviewingSubmission === submission._id && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Оценка (0-5)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={reviewGrade}
                              onChange={(e) => setReviewGrade(e.target.value === '' ? '' : Number(e.target.value))}
                              className="input"
                              placeholder="Оценка"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Комментарий
                            </label>
                            <textarea
                              value={reviewFeedback}
                              onChange={(e) => setReviewFeedback(e.target.value)}
                              className="input"
                              rows={3}
                              placeholder="Комментарий к работе"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Статус
                            </label>
                            <select
                              value={reviewStatus}
                              onChange={(e) => setReviewStatus(e.target.value as 'approved' | 'rejected')}
                              className="input"
                            >
                              <option value="approved">Одобрено</option>
                              <option value="rejected">Отклонено</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(submission._id)}
                              className="btn btn-primary"
                              disabled={reviewMutation.isPending}
                            >
                              {reviewMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                              onClick={() => {
                                setReviewingSubmission(null);
                                setReviewGrade('');
                                setReviewFeedback('');
                              }}
                              className="btn btn-secondary"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-semibold rounded',
                          submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : submission.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        )}
                      >
                        {submission.status === 'pending'
                          ? 'На проверке'
                          : submission.status === 'approved'
                          ? 'Одобрено'
                          : 'Отклонено'}
                      </span>
                      <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${submission.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary text-sm"
                      >
                        Скачать
                      </a>
                      {submission.status === 'pending' && (
                        <button
                          onClick={() => setReviewingSubmission(submission._id)}
                          className="btn btn-primary text-sm"
                        >
                          Проверить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Нет работ на проверку
            </p>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Управление курсами</h2>
            <button onClick={handleCreateCourse} className="btn btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Создать курс
            </button>
          </div>
          {coursesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : adminCourses && adminCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminCourses.map((course) => (
                <div key={course._id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-semibold rounded',
                        course.isPublished
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      )}
                    >
                      {course.isPublished ? 'Опубликован' : 'Черновик'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="flex-1 btn btn-secondary text-sm"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
                          deleteCourseMutation.mutate(course._id);
                        }
                      }}
                      className="btn btn-secondary text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => handleManageStudents(course)}
                      className="w-full btn btn-secondary text-sm"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Управление студентами
                      {Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs">
                          {course.enrolledStudents.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleCreateLesson(course._id)}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Добавить урок
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Нет курсов</p>
            </div>
          )}
        </div>
      )}

      {/* Lessons Tab */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Управление уроками</h2>
            <button onClick={() => handleCreateLesson()} className="btn btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Создать урок
            </button>
          </div>
          {lessonsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : adminLessons && adminLessons.length > 0 ? (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Название
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Курс
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {adminLessons.map((lesson) => (
                      <tr key={lesson._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {lesson.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {typeof lesson.course === 'object' ? lesson.course.title : 'Неизвестно'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-semibold rounded',
                              lesson.isPublished
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            )}
                          >
                            {lesson.isPublished ? 'Опубликован' : 'Черновик'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditLesson(lesson)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Вы уверены, что хотите удалить этот урок?')) {
                                  deleteLessonMutation.mutate(lesson._id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Нет уроков</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCourseForm && (
        <CourseForm
          course={editingCourse}
          onClose={() => {
            setShowCourseForm(false);
            setEditingCourse(undefined);
          }}
          onSuccess={() => {
            setShowCourseForm(false);
            setEditingCourse(undefined);
          }}
        />
      )}

      {showLessonForm && (
        <LessonForm
          lesson={editingLesson}
          courseId={selectedCourseId}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(undefined);
            setSelectedCourseId(undefined);
          }}
          onSuccess={() => {
            setShowLessonForm(false);
            setEditingLesson(undefined);
            setSelectedCourseId(undefined);
            queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
            queryClient.invalidateQueries({ queryKey: ['lessons'] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
          }}
        />
      )}

      {/* Manage Students Modal */}
      {managingStudentsCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Управление студентами: {managingStudentsCourse.title}
              </h2>
              <button
                onClick={() => setManagingStudentsCourse(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Enrolled Students */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Зачисленные студенты ({courseStudents?.length || 0})
                </h3>
                {courseStudents && courseStudents.length > 0 ? (
                  <div className="space-y-2">
                    {courseStudents.map((student) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{student.username} {student.email && `• ${student.email}`}
                            {student.group && ` • ${student.group}`}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Удалить студента из курса?')) {
                              removeStudentMutation.mutate(student._id);
                            }
                          }}
                          className="btn btn-secondary text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Нет зачисленных студентов
                  </p>
                )}
              </div>

              {/* Add Students */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Добавить студентов
                </h3>
                {allStudents && allStudents.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allStudents
                      .filter((student) => {
                        const enrolledIds = courseStudents?.map((s) => s._id) || [];
                        return !enrolledIds.includes(student._id);
                      })
                      .map((student) => (
                        <label
                          key={student._id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, student._id]);
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student._id));
                              }
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {student.firstName && student.lastName
                                ? `${student.firstName} ${student.lastName}`
                                : student.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{student.username} {student.email && `• ${student.email}`}
                              {student.group && ` • ${student.group}`}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Нет доступных студентов
                  </p>
                )}
                {selectedStudentIds.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => addStudentsMutation.mutate(selectedStudentIds)}
                      disabled={addStudentsMutation.isPending}
                      className="btn btn-primary"
                    >
                      {addStudentsMutation.isPending ? 'Добавление...' : `Добавить ${selectedStudentIds.length} студент(ов)`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

