import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  User, 
  LogOut, 
  Menu, 
  X,
  Settings,
  Moon,
  Sun,
  Users,
  Bot,
  Sparkles,
  Home,
  ChevronRight,
  Trophy,
  Award
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import Notifications from './Notifications';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
  };

  const navigation = [
    { name: 'Главная', href: '/dashboard', icon: Home },
    { name: 'Курсы', href: '/courses', icon: BookOpen },
    { name: 'AI Помощник', href: '/ai-assistant', icon: Bot },
    { name: 'AI Инструменты', href: '/ai-tools', icon: Sparkles },
    { name: 'Достижения', href: '/achievements', icon: Trophy },
    // { name: 'Сертификаты', href: '/certificates', icon: Award }, // Временно отключено
    { name: 'Прогресс', href: '/progress', icon: BarChart3 },
    ...(user?.role === 'teacher' || user?.role === 'admin'
      ? [{ name: 'Админ-панель', href: '/admin', icon: Settings }]
      : []),
    ...(user?.role === 'admin'
      ? [{ name: 'Управление пользователями', href: '/admin/users', icon: Users }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/admin/users') {
      return location.pathname === '/admin/users';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-blue-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">
                Кванториум
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group',
                    active
                      ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg shadow-primary-500/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  )}
                >
                  <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
                  <span>{item.name}</span>
                  {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === 'admin' ? 'Администратор' : user?.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex items-center h-20 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-blue-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">
                Кванториум
              </h1>
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                    active
                      ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg shadow-primary-500/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  )}
                >
                  <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} />
                  <span>{item.name}</span>
                  {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                  {!active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary-600 rounded-r-full transition-all duration-200 group-hover:h-6" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === 'admin' ? 'Администратор' : user?.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-6 text-gray-500 lg:hidden hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between items-center px-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-3">
              <Notifications />
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || 'Пользователь'}
                </span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Выход</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
