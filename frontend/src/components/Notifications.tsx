import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, Trash2, ExternalLink } from 'lucide-react';
import { notificationsService } from '../services/notifications';
import { Notification } from '../types';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(20),
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Все уведомления отмечены как прочитанные');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Уведомление удалено');
    },
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'lesson':
        return '📚';
      case 'quiz':
        return '✅';
      case 'deadline':
        return '⏰';
      case 'comment':
        return '💬';
      case 'grade':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
      case 'lesson':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
      case 'quiz':
        return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700';
      case 'deadline':
        return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        title="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Уведомления
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({unreadCount} новых)
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  disabled={markAllAsReadMutation.isPending}
                >
                  Отметить все как прочитанные
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Загрузка...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                        !notification.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification._id);
                        }
                        if (notification.link) {
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={cn(
                                'text-sm font-medium text-gray-900 dark:text-white',
                                !notification.isRead && 'font-semibold'
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString('ru-RU', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-primary-600 rounded-full" />
                              )}
                              <button
                                onClick={(e) => handleDelete(notification._id, e)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          {notification.link && (
                            <Link
                              to={notification.link}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                              }}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              Перейти <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;

