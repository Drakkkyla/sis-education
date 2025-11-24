import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, CreateUserData, BulkCreateUsersData, BulkCreateByCountData } from '../services/users';
import { User, GroupType } from '../types';
import { UserPlus, Users, Trash2, Edit2, Save, X, Upload, Download, FileText, Search, Filter, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showBulkCountForm, setShowBulkCountForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createdUsers, setCreatedUsers] = useState<Array<User & { password?: string }>>([]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, groupFilter, searchQuery],
    queryFn: () => usersService.getAll(
      roleFilter || undefined,
      groupFilter || undefined,
      searchQuery || undefined
    ),
  });

  const createMutation = useMutation({
    mutationFn: (userData: CreateUserData) => usersService.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Пользователь создан');
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания пользователя');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (bulkData: BulkCreateUsersData) => usersService.bulkCreate(bulkData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Создано пользователей: ${data.created}, ошибок: ${data.failed}`);
      setShowBulkForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка массового создания');
    },
  });

  const bulkCreateByCountMutation = useMutation({
    mutationFn: (bulkData: BulkCreateByCountData) => usersService.bulkCreateByCount(bulkData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Создано пользователей: ${data.created}, ошибок: ${data.failed}`);
      setCreatedUsers(data.users);
      setShowBulkCountForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка массового создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      usersService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Пользователь обновлен');
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersService.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Пользователь удален');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      usersService.resetPassword(userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Пароль успешно изменен');
      setResettingPasswordUser(null);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка сброса пароля');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: CreateUserData = {
      username: formData.get('username') as string,
      email: (formData.get('email') as string) || undefined,
      password: formData.get('password') as string,
      firstName: (formData.get('firstName') as string) || undefined,
      lastName: (formData.get('lastName') as string) || undefined,
      role: (formData.get('role') as 'student' | 'teacher' | 'admin') || 'student',
      group: (formData.get('group') as string) || undefined,
    };
    createMutation.mutate(userData);
  };

  const handleBulkCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailsText = formData.get('emails') as string;
    const defaultPassword = formData.get('defaultPassword') as string;
    const role = (formData.get('role') as 'student' | 'teacher' | 'admin') || 'student';

    const lines = emailsText.split(/\r?\n/);
    const entries: string[] = [];
    for (const line of lines) {
      const parts = line.split(/[,;]/).map((part) => part.trim()).filter((part) => part.length > 0);
      entries.push(...parts);
    }
    const uniqueEntries = Array.from(new Set(entries));

    if (uniqueEntries.length === 0) {
      toast.error('Введите хотя бы один email или логин');
      return;
    }

    const bulkData: BulkCreateUsersData = {
      users: uniqueEntries.map((entry) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(entry)) {
          return { email: entry };
        } else {
          return { username: entry };
        }
      }),
      role,
      defaultPassword: defaultPassword || undefined,
    };

    bulkCreateMutation.mutate(bulkData);
  };

  const [bulkCountForm, setBulkCountForm] = useState({
    count: 10,
    prefix: 'user',
    role: 'student' as 'student' | 'teacher' | 'admin',
    group: '' as GroupType | '',
    defaultPassword: 'student123',
    startFrom: 1,
  });

  const handleBulkCreateByCount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { count, defaultPassword, role, prefix, group, startFrom } = bulkCountForm;

    if (count < 1 || count > 200) {
      toast.error('Количество должно быть от 1 до 200');
      return;
    }

    if (!defaultPassword || defaultPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    const bulkData: BulkCreateByCountData = {
      count,
      role,
      defaultPassword: defaultPassword || undefined,
      prefix: prefix || undefined,
      group: group || undefined,
      startFrom: startFrom || undefined,
    };

    bulkCreateByCountMutation.mutate(bulkData);
  };

  const exportToPDF = () => {
    if (createdUsers.length === 0) {
      toast.error('Нет созданных пользователей для экспорта');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table fit
    
    // Header with better spacing
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 35, 'F'); // Full width for landscape
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Created Users List', 148.5, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const creationDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    doc.text(`Creation Date: ${creationDate}`, 148.5, 23, { align: 'center' });
    doc.text(`Total Users: ${createdUsers.length}`, 148.5, 29, { align: 'center' });

    // Table data - use shorter role names to save space
    const tableData = createdUsers.map((user, index) => [
      String(index + 1),
      user.username || '',
      user.password || 'N/A',
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      user.role === 'student' ? 'Student' : user.role === 'teacher' ? 'Teacher' : 'Admin',
    ]);

    // Table with improved formatting
    // Calculate available width: 297mm (landscape A4) - 20mm margins = 277mm
    autoTable(doc, {
      startY: 40,
      head: [['#', 'Login', 'Password', 'Name', 'Role']],
      body: tableData,
      theme: 'striped',
      margin: { top: 40, left: 10, right: 10 },
      tableWidth: 'auto',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 9,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      styles: {
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
        fontSize: 9,
        overflow: 'linebreak',
        cellWidth: 'auto',
      },
      columnStyles: {
        0: { 
          cellWidth: 15,
          halign: 'center',
        },
        1: { 
          cellWidth: 55,
          halign: 'left',
        },
        2: { 
          cellWidth: 45,
          halign: 'left',
        },
        3: { 
          cellWidth: 70,
          halign: 'left',
        },
        4: { 
          cellWidth: 45,
          halign: 'center',
        },
      },
      didDrawPage: (data: any) => {
        // Add header on each page
        if (data.pageNumber > 1) {
          doc.setFillColor(37, 99, 235);
          doc.rect(0, 0, 297, 35, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Created Users List', 148.5, 15, { align: 'center' });
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const creationDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
          doc.text(`Creation Date: ${creationDate}`, 148.5, 23, { align: 'center' });
          doc.text(`Total Users: ${createdUsers.length}`, 148.5, 29, { align: 'center' });
        }
      },
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        148.5,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`users_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF файл успешно создан');
  };

  const handleUpdateRole = (userId: string, newRole: 'student' | 'teacher' | 'admin') => {
    updateMutation.mutate({ userId, data: { role: newRole } });
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'teacher':
        return 'Преподаватель';
      case 'student':
        return 'Студент';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Управление пользователями</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Создание и управление пользователями системы
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setShowBulkForm(false);
              setShowBulkCountForm(false);
            }}
            className="btn btn-primary"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Создать пользователя
          </button>
          <button
            onClick={() => {
              setShowBulkForm(true);
              setShowCreateForm(false);
              setShowBulkCountForm(false);
            }}
            className="btn btn-secondary"
          >
            <Users className="h-5 w-5 mr-2" />
            Массовое создание
          </button>
          <button
            onClick={() => {
              setShowBulkCountForm(true);
              setShowCreateForm(false);
              setShowBulkForm(false);
            }}
            className="btn btn-secondary"
          >
            <Upload className="h-5 w-5 mr-2" />
            Создать по количеству
          </button>
        </div>
      </div>

      {/* Success Message with PDF Export */}
      {createdUsers.length > 0 && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Создание новых пользователей
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Дата создания: {new Date().toLocaleDateString('ru-RU')}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Всего пользователей: {createdUsers.length}
                </p>
              </div>
              <button
                onClick={exportToPDF}
                className="btn btn-primary flex items-center gap-2 shadow-lg"
              >
                <FileText className="h-5 w-5" />
                Скачать PDF
              </button>
            </div>
          </div>
          
          {/* Created Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    №
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Логин
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Пароль
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Имя
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Роль
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {createdUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                      {user.password || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пользователь'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {user.role === 'student' ? 'Студент' : user.role === 'teacher' ? 'Преподаватель' : 'Администратор'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, логину или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">Все роли</option>
              <option value="student">Студенты</option>
              <option value="teacher">Преподаватели</option>
              <option value="admin">Администраторы</option>
            </select>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="input"
            >
              <option value="">Все квантумы</option>
              {groups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Создать пользователя
            </h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Логин *
              </label>
              <input
                type="text"
                name="username"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                className="input"
                placeholder="Логин (3-30 символов, только буквы, цифры и _)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email (опционально)
              </label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Пароль *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="input"
                placeholder="Минимум 6 символов"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Имя (опционально)
                </label>
                <input type="text" name="firstName" className="input" placeholder="Имя" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Фамилия (опционально)
                </label>
                <input type="text" name="lastName" className="input" placeholder="Фамилия" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Роль *
                </label>
                <select name="role" required className="input" defaultValue="student">
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Квантум (опционально)
                </label>
                <select name="group" className="input" defaultValue="">
                  <option value="">Не выбран</option>
                  {groups.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Create Form */}
      {showBulkForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Массовое создание пользователей
            </h2>
            <button
              onClick={() => setShowBulkForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleBulkCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email адреса или логины (по одному на строку или через запятую) *
              </label>
              <textarea
                name="emails"
                required
                rows={10}
                className="input"
                placeholder="user1@example.com&#10;user2@example.com&#10;student123&#10;user4@example.com"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Введите email адреса или логины, разделенные переносами строк или запятыми. Для email автоматически будет создан логин.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Роль по умолчанию
                </label>
                <select name="role" className="input" defaultValue="student">
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Пароль по умолчанию
                </label>
                <input
                  type="password"
                  name="defaultPassword"
                  minLength={6}
                  className="input"
                  placeholder="student123 (по умолчанию)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkForm(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={bulkCreateMutation.isPending}
              >
                {bulkCreateMutation.isPending ? 'Создание...' : 'Создать пользователей'}
              </button>
            </div>
          </form>
          {bulkCreateMutation.data && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Создано: {bulkCreateMutation.data.created}, Ошибок: {bulkCreateMutation.data.failed}
              </p>
              {bulkCreateMutation.data.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">Ошибки:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                    {bulkCreateMutation.data.errors.map((error, idx) => (
                      <li key={idx}>
                        {error.email}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Create By Count Form */}
      {showBulkCountForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Создание пользователей по количеству
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Массовое создание пользователей с автоматической генерацией логинов
              </p>
            </div>
            <button
              onClick={() => {
                setShowBulkCountForm(false);
                setBulkCountForm({
                  count: 10,
                  prefix: 'user',
                  role: 'student',
                  group: '' as GroupType | '',
                  defaultPassword: 'student123',
                  startFrom: 1,
                });
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleBulkCreateByCount} className="space-y-6">
            {/* Основные параметры */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Количество пользователей *
                </label>
                <input
                  type="number"
                  value={bulkCountForm.count}
                  onChange={(e) => setBulkCountForm({ ...bulkCountForm, count: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={200}
                  required
                  className="input"
                  placeholder="10"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  От 1 до 200 пользователей
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Префикс логина
                </label>
                <input
                  type="text"
                  value={bulkCountForm.prefix}
                  onChange={(e) => setBulkCountForm({ ...bulkCountForm, prefix: e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase() })}
                  maxLength={20}
                  className="input"
                  placeholder="user"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Только буквы, цифры и _
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Начать с номера
                </label>
                <input
                  type="number"
                  value={bulkCountForm.startFrom}
                  onChange={(e) => setBulkCountForm({ ...bulkCountForm, startFrom: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="input"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Первый номер в логине
                </p>
              </div>
            </div>

            {/* Предпросмотр логинов */}
            {bulkCountForm.prefix && bulkCountForm.count > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Пример логинов:
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-600 dark:text-gray-400">
                  {Array.from({ length: Math.min(5, bulkCountForm.count) }).map((_, i) => (
                    <span key={i} className="px-2 py-1 bg-white dark:bg-gray-700 rounded">
                      {bulkCountForm.prefix}_{bulkCountForm.startFrom + i}
                    </span>
                  ))}
                  {bulkCountForm.count > 5 && (
                    <span className="px-2 py-1 text-gray-500 dark:text-gray-500">
                      ... и еще {bulkCountForm.count - 5}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Роль и группа */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Роль *
                </label>
                <select
                  value={bulkCountForm.role}
                  onChange={(e) => setBulkCountForm({ ...bulkCountForm, role: e.target.value as 'student' | 'teacher' | 'admin' })}
                  className="input"
                >
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Квантум (опционально)
                </label>
                <select
                  value={bulkCountForm.group}
                  onChange={(e) => setBulkCountForm({ ...bulkCountForm, group: e.target.value as GroupType | '' })}
                  className="input"
                >
                  <option value="">Не выбран</option>
                  {groups.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пароль по умолчанию *
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={bulkCountForm.defaultPassword}
                  onChange={(e) => setBulkCountForm({ ...bulkCountForm, defaultPassword: e.target.value })}
                  minLength={6}
                  required
                  className="input flex-1"
                  placeholder="student123"
                />
                <button
                  type="button"
                  onClick={() => {
                    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                    setBulkCountForm({ ...bulkCountForm, defaultPassword: randomPassword });
                  }}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Сгенерировать
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Минимум 6 символов. Этот пароль будет использован для всех созданных пользователей.
              </p>
            </div>

            {/* Информационное сообщение */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>💡 Важно:</strong> После создания пользователей вы сможете скачать список с логинами и паролями в формате PDF. 
                Будет создано <strong>{bulkCountForm.count}</strong> пользователей с логинами от <strong>{bulkCountForm.prefix || 'user'}_{bulkCountForm.startFrom}</strong> до <strong>{bulkCountForm.prefix || 'user'}_{bulkCountForm.startFrom + bulkCountForm.count - 1}</strong>.
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowBulkCountForm(false);
                  setBulkCountForm({
                    count: 10,
                    prefix: 'user',
                    role: 'student',
                    group: '' as GroupType | '',
                    defaultPassword: 'student123',
                    startFrom: 1,
                  });
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={bulkCreateByCountMutation.isPending || !bulkCountForm.defaultPassword || bulkCountForm.defaultPassword.length < 6}
              >
                {bulkCreateByCountMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Создание...
                  </>
                ) : (
                  `Создать ${bulkCountForm.count} пользователей`
                )}
              </button>
            </div>
          </form>
          {bulkCreateByCountMutation.data && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">
                Создано: {bulkCreateByCountMutation.data.created}, Ошибок: {bulkCreateByCountMutation.data.failed}
              </p>
              {bulkCreateByCountMutation.data.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">Ошибки:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                    {bulkCreateByCountMutation.data.errors.map((error, idx) => (
                      <li key={idx}>
                        {error.username}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Список пользователей ({users?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Логин
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Квантум
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users?.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {editingUser === user._id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={user.firstName || ''}
                          placeholder="Имя"
                          onBlur={(e) => {
                            const newValue = e.target.value.trim();
                            const oldValue = user.firstName || '';
                            if (newValue !== oldValue) {
                              updateMutation.mutate({
                                userId: user._id,
                                data: { firstName: newValue || undefined },
                              });
                            }
                          }}
                          className="w-24 input text-sm"
                        />
                        <input
                          type="text"
                          defaultValue={user.lastName || ''}
                          placeholder="Фамилия"
                          onBlur={(e) => {
                            const newValue = e.target.value.trim();
                            const oldValue = user.lastName || '';
                            if (newValue !== oldValue) {
                              updateMutation.mutate({
                                userId: user._id,
                                data: { lastName: newValue || undefined },
                              });
                            }
                          }}
                          className="w-24 input text-sm"
                        />
                      </div>
                    ) : (
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user._id ? (
                      <select
                        defaultValue={user.role}
                        onChange={(e) => {
                          handleUpdateRole(user._id, e.target.value as 'student' | 'teacher' | 'admin');
                        }}
                        className="input text-sm"
                      >
                        <option value="student">Студент</option>
                        <option value="teacher">Преподаватель</option>
                        <option value="admin">Администратор</option>
                      </select>
                    ) : (
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-semibold rounded',
                          getRoleBadgeColor(user.role)
                        )}
                      >
                        {getRoleName(user.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user._id ? (
                      <select
                        defaultValue={user.group || ''}
                        onChange={(e) => {
                          const newGroup = e.target.value || null;
                          updateMutation.mutate({
                            userId: user._id,
                            data: { group: newGroup },
                          });
                        }}
                        className="input text-sm"
                      >
                        <option value="">Не выбран</option>
                        {groups.map((group) => (
                          <option key={group.value} value={group.value}>
                            {group.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {user.group ? groups.find(g => g.value === user.group)?.label || user.group : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-semibold rounded',
                        user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      )}
                    >
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setEditingUser(editingUser === user._id ? null : user._id)
                        }
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                        title="Редактировать"
                      >
                        {editingUser === user._id ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Edit2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setResettingPasswordUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="Сбросить пароль"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        disabled={deleteMutation.isPending}
                        title="Удалить"
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
        {users?.length === 0 && (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            Пользователи не найдены
          </p>
        )}
      </div>

      {/* Reset Password Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Сброс пароля
              </h3>
              <button
                onClick={() => {
                  setResettingPasswordUser(null);
                  setNewPassword('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Пользователь: <strong className="text-gray-900 dark:text-white">{resettingPasswordUser.username}</strong>
                {resettingPasswordUser.firstName && (
                  <> ({resettingPasswordUser.firstName} {resettingPasswordUser.lastName})</>
                )}
              </p>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Новый пароль *
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  className="input flex-1"
                  placeholder="Минимум 6 символов"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                    setNewPassword(randomPassword);
                  }}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Сгенерировать
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Пароль должен содержать минимум 6 символов
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setResettingPasswordUser(null);
                  setNewPassword('');
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (!newPassword || newPassword.length < 6) {
                    toast.error('Пароль должен быть минимум 6 символов');
                    return;
                  }
                  resetPasswordMutation.mutate({
                    userId: resettingPasswordUser._id,
                    password: newPassword,
                  });
                }}
                className="btn btn-primary"
                disabled={resetPasswordMutation.isPending || !newPassword || newPassword.length < 6}
              >
                {resetPasswordMutation.isPending ? 'Сброс...' : 'Сбросить пароль'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
