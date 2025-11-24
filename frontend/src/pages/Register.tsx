import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, Lock, User, Mail, UserCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { GroupType } from '../types';

const groups: { value: GroupType; label: string; logo: string }[] = [
  { value: 'haitech', label: 'Хайтек', logo: '/photo/haitech.jpg' },
  { value: 'promdesign', label: 'Промдизайнквантум', logo: '/photo/promdizain.jpg' },
  { value: 'promrobo', label: 'Промробоквантум', logo: '/photo/promrobo.jpg' },
  { value: 'energy', label: 'Энерджиквантум', logo: '/photo/energy.jpg' },
  { value: 'bio', label: 'Биоквантум', logo: '/photo/bio.jpg' },
  { value: 'aero', label: 'Аэроквантум', logo: '/photo/aero.jpg' },
  { value: 'media', label: 'Медиаквантум', logo: '/photo/media.jpg' },
  { value: 'vrar', label: 'VR/AR – квантум', logo: '/photo/vrar.jpg' },
];

const Register = () => {
  const { register, isLoading } = useAuth();

  const formik = useFormik({
    initialValues: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      group: '' as GroupType | '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Минимум 3 символа')
        .max(30, 'Максимум 30 символов')
        .matches(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и подчеркивание')
        .required('Обязательное поле'),
      firstName: Yup.string().optional(),
      lastName: Yup.string().optional(),
      email: Yup.string().email('Некорректный email').optional(),
      password: Yup.string().min(6, 'Минимум 6 символов').required('Обязательное поле'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Пароли не совпадают')
        .required('Обязательное поле'),
      group: Yup.string().oneOf(groups.map(g => g.value), 'Выберите квантум').required('Выберите квантум'),
    }),
    onSubmit: (values) => {
      const { confirmPassword, ...userData } = values;
      // Удаляем пустые строки из данных
      if (userData.email === '') {
        delete userData.email;
      }
      if (userData.firstName === '') {
        delete userData.firstName;
      }
      if (userData.lastName === '') {
        delete userData.lastName;
      }
      if (userData.group === '') {
        delete userData.group;
      }
      register(userData as any);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl shadow-xl mb-4">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Регистрация
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Создайте аккаунт для начала обучения
          </p>
        </div>

        {/* Register Card */}
        <div className="card shadow-2xl border-2 border-gray-100 dark:border-gray-700">
          <form className="space-y-5" onSubmit={formik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Имя (опционально)
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="Имя"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.firstName && formik.errors.firstName && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Фамилия (опционально)
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="Фамилия"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.lastName && formik.errors.lastName && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Логин <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                  placeholder="Логин (3-30 символов)"
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
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email (опционально)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                  placeholder="email@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span>•</span>
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="Минимум 6 символов"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Подтвердите пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="Повторите пароль"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <span>•</span>
                    {formik.errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="group" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Квантум <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {groups.map((group) => (
                  <label
                    key={group.value}
                    className={`relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formik.values.group === group.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="group"
                      value={group.value}
                      checked={formik.values.group === group.value}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="sr-only"
                    />
                    <div className="flex-shrink-0">
                      <img
                        src={group.logo}
                        alt={group.label}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23e5e7eb"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {group.label}
                    </span>
                    {formik.values.group === group.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {formik.touched.group && formik.errors.group && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span>•</span>
                  {formik.errors.group}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary flex items-center justify-center gap-2 shadow-lg mt-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Регистрация...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Зарегистрироваться</span>
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
