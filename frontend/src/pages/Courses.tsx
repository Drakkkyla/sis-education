import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { coursesService } from '../services/courses';
import { Course } from '../types';
import { Network, Server, Monitor, Filter, Search, Plus, TrendingUp, Users, BookOpen, ArrowRight, Sparkles, Grid3x3, List } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import CourseForm from '../components/CourseForm';

const Courses = () => {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'lessons'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isAdmin = user?.role === 'admin' || user?.role === 'teacher';

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', categoryFilter, levelFilter],
    queryFn: () => coursesService.getAll(categoryFilter || undefined, levelFilter || undefined),
  });

  const filteredCourses = courses?.filter((course) => {
    if (searchQuery) {
      return (
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  })?.sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'lessons':
        const aLessons = Array.isArray(a.lessons) ? a.lessons.length : 0;
        const bLessons = Array.isArray(b.lessons) ? b.lessons.length : 0;
        return bLessons - aLessons;
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
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
        return Network;
    }
  };

  const getCategoryName = (category: Course['category']) => {
    switch (category) {
      case 'network':
        return 'Сетевое администрирование';
      case 'system-linux':
        return 'Linux';
      case 'system-windows':
        return 'Windows';
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

  const getLevelColor = (level: Course['level']) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  const totalLessons = courses?.reduce((sum, course) => sum + (Array.isArray(course.lessons) ? course.lessons.length : 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Курсы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите курс для изучения
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCourseForm(true)}
            className="btn btn-primary flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Создать курс
          </button>
        )}
      </div>

      {/* Statistics */}
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
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск курсов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Все категории</option>
              <option value="network">Сетевое администрирование</option>
              <option value="system-linux">Linux</option>
              <option value="system-windows">Windows</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Все уровни</option>
              <option value="beginner">Начальный</option>
              <option value="intermediate">Средний</option>
              <option value="advanced">Продвинутый</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'date' | 'lessons')}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="date">По дате</option>
              <option value="title">По названию</option>
              <option value="lessons">По количеству уроков</option>
            </select>
            <div className="flex gap-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses?.map((course) => {
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
                  <span className={cn('px-3 py-1.5 text-xs font-semibold rounded-xl border-2', getLevelColor(course.level))}>
                    {getLevelName(course.level)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {course.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Array.isArray(course.lessons) ? course.lessons.length : 0} уроков
                  </span>
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold group-hover:gap-3 transition-all">
                    <span className="text-sm">Открыть</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses?.map((course) => {
            const Icon = getCategoryIcon(course.category);
            const gradient = getCategoryGradient(course.category);
            return (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="group card hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-300 dark:hover:border-primary-700"
              >
                <div className="flex items-center gap-6">
                  <div className={cn('p-6 rounded-2xl bg-gradient-to-br shadow-lg flex-shrink-0', gradient)}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {course.title}
                      </h3>
                      <span className={cn('px-3 py-1.5 text-xs font-semibold rounded-xl border-2 flex-shrink-0 ml-4', getLevelColor(course.level))}>
                        {getLevelName(course.level)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {getCategoryName(course.category)}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {Array.isArray(course.lessons) ? course.lessons.length : 0} уроков
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary-600 dark:text-primary-400 group-hover:translate-x-2 transition-transform flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filteredCourses?.length === 0 && (
        <div className="text-center py-16 card border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <Filter className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Курсы не найдены
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Попробуйте изменить фильтры поиска
          </p>
        </div>
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <CourseForm
          onClose={() => setShowCourseForm(false)}
          onSuccess={() => setShowCourseForm(false)}
        />
      )}
    </div>
  );
};

export default Courses;
