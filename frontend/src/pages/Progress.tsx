import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';

const Progress = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['progress-stats'],
    queryFn: async () => {
      const { data } = await api.get('/progress/stats');
      return data;
    },
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const { data } = await api.get('/progress');
      return data;
    },
  });

  if (statsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Мой прогресс</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Статистика вашего обучения
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Курсы начато</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.coursesStarted || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Уроков завершено</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalLessonsCompleted || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Время обучения</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalTimeSpent || 0} мин
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего курсов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalCourses || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Lessons */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Завершенные уроки
        </h2>
        {progress && progress.length > 0 ? (
          <div className="space-y-2">
            {progress
              .filter((p: any) => p.completed)
              .map((item: any) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {typeof item.lesson === 'object' ? item.lesson.title : 'Урок'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {typeof item.course === 'object' ? item.course.title : 'Курс'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleDateString('ru-RU')
                      : ''}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Вы еще не завершили ни одного урока
          </p>
        )}
      </div>
    </div>
  );
};

export default Progress;

