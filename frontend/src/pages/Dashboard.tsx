import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { coursesService } from '../services/courses';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Network, Server, Monitor, ArrowRight, Sparkles, TrendingUp, Clock, Award } from 'lucide-react';
import { Course } from '../types';
import { cn } from '../utils/cn';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getAll(),
  });

  const getCategoryIcon = (category: Course['category']) => {
    switch (category) {
      case 'network':
        return Network;
      case 'system-linux':
        return Server;
      case 'system-windows':
        return Monitor;
      default:
        return BookOpen;
    }
  };

  const getCategoryName = (category: Course['category']) => {
    switch (category) {
      case 'network':
        return 'Сетевое администрирование';
      case 'system-linux':
        return 'Системное администрирование (Linux)';
      case 'system-windows':
        return 'Системное администрирование (Windows)';
      default:
        return category;
    }
  };

  const getCategoryGradient = (category: Course['category']) => {
    switch (category) {
      case 'network':
        return 'from-blue-500 to-cyan-500';
      case 'system-linux':
        return 'from-green-500 to-emerald-500';
      case 'system-windows':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-primary-500 to-blue-500';
    }
  };

  const getLevelBadgeColor = (level: Course['level']) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getLevelName = (level: Course['level']) => {
    switch (level) {
      case 'beginner':
        return 'Начальный';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      default:
        return level;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  const totalLessons = courses?.reduce((sum, course) => sum + (Array.isArray(course.lessons) ? course.lessons.length : 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-blue-600 to-purple-600 p-8 md:p-12 text-white shadow-2xl">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        ></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Добро пожаловать, {user?.firstName || user?.username || 'Пользователь'}!
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90 mb-6">
            Начните своё обучение прямо сейчас
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <BookOpen className="h-5 w-5" />
              <span>{courses?.length || 0} курсов</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Clock className="h-5 w-5" />
              <span>{totalLessons} уроков</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Award className="h-5 w-5" />
              <span>Неограниченный доступ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {courses && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-gradient border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Всего курсов</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="card-gradient border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Всего уроков</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalLessons}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="card-gradient border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Категорий</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Set(courses.map(c => c.category)).size}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Доступные курсы</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Выберите курс для начала обучения
            </p>
          </div>
          <Link
            to="/courses"
            className="btn btn-secondary flex items-center gap-2"
          >
            Все курсы
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => {
            const Icon = getCategoryIcon(course.category);
            const gradient = getCategoryGradient(course.category);
            return (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="group card hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-primary-300 dark:hover:border-primary-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('p-4 rounded-2xl bg-gradient-to-br shadow-lg', gradient)}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className={cn('px-3 py-1.5 text-xs font-semibold rounded-xl border-2', getLevelBadgeColor(course.level))}>
                    {getLevelName(course.level)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getCategoryName(course.category)}
                  </span>
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold group-hover:gap-3 transition-all">
                    <span className="text-sm">Начать</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {courses?.length === 0 && (
          <div className="text-center py-16 card border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Нет доступных курсов
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Курсы будут добавлены в ближайшее время
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
