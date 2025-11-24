import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, GroupType } from '../types';

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

const Profile = () => {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get<User>('/users/profile');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; avatar?: string; group?: GroupType | null }) =>
      api.put('/users/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Профиль обновлен');
    },
    onError: () => {
      toast.error('Ошибка обновления профиля');
    },
  });

  const formik = useFormik({
    initialValues: {
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      role: user?.role || 'student',
      group: user?.group || ('' as GroupType | ''),
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      firstName: Yup.string().optional(),
      lastName: Yup.string().optional(),
      group: Yup.string().oneOf([...groups.map(g => g.value), ''], 'Выберите квантум').optional(),
    }),
    onSubmit: (values) => {
      updateMutation.mutate({
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        group: values.group || null,
      });
    },
  });

  const getRoleName = (role: string) => {
    switch (role) {
      case 'student':
        return 'Студент';
      case 'teacher':
        return 'Преподаватель';
      case 'admin':
        return 'Администратор';
      default:
        return role;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Мой профиль</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Управление данными профиля</p>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-20 w-20 rounded-full" />
            ) : (
              <UserIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username || 'Пользователь'}
            </h2>
            {user?.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
            <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
              {getRoleName(user?.role || 'student')}
            </span>
            {user?.group && (
              <span className="inline-block mt-1 ml-2 px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {groups.find(g => g.value === user.group)?.label || user.group}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Логин
            </label>
            <input
              id="username"
              name="username"
              type="text"
              disabled
              value={formik.values.username}
              className="mt-1 input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Логин нельзя изменить
            </p>
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Имя (опционально)
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 input"
              placeholder="Имя"
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formik.errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Фамилия (опционально)
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 input"
              placeholder="Фамилия"
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formik.errors.lastName}
              </p>
            )}
          </div>

          {formik.values.email && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                value={formik.values.email}
                className="mt-1 input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Email нельзя изменить
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Роль
            </label>
            <input
              type="text"
              disabled
              value={getRoleName(formik.values.role)}
              className="mt-1 input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Квантум
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label
                className={`relative flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                  formik.values.group === ''
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <input
                  type="radio"
                  name="group"
                  value=""
                  checked={formik.values.group === ''}
                  onChange={formik.handleChange}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Не выбран</span>
                {formik.values.group === '' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
              {groups.map((group) => (
                <label
                  key={group.value}
                  className={`relative flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
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
                    className="sr-only"
                  />
                  <div className="flex-shrink-0">
                    <img
                      src={group.logo}
                      alt={group.label}
                      className="w-10 h-10 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23e5e7eb"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {group.label}
                  </span>
                  {formik.values.group === group.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {formik.touched.group && formik.errors.group && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formik.errors.group}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

