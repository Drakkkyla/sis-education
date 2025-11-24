import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, Lock, User, Sparkles } from 'lucide-react';

const Login = () => {
  const { login, isLoading } = useAuth();

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Минимум 3 символа')
        .max(30, 'Максимум 30 символов')
        .matches(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и подчеркивание')
        .required('Обязательное поле'),
      password: Yup.string().required('Обязательное поле'),
    }),
    onSubmit: (values) => {
      login(values);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl shadow-xl mb-4">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Добро пожаловать!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Войдите в систему обучения
          </p>
        </div>

        {/* Login Card */}
        <div className="card shadow-2xl border-2 border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={formik.handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Логин
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="Введите логин"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.username && formik.errors.username && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span>•</span>
                    {formik.errors.username}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="Введите пароль"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span>•</span>
                    {formik.errors.password}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Вход...</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>Войти</span>
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Нет аккаунта?
              </p>
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="text-2xl mb-1">📚</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Курсы</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">AI Помощник</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Прогресс</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
