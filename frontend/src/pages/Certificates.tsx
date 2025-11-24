import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificatesService } from '../services/certificates';
import { Certificate } from '../types';
import { Award, Download, FileText, Calendar, Hash, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Certificates = () => {
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => certificatesService.getAll(),
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => certificatesService.downloadPDF(id),
    onSuccess: (blob, certificateId) => {
      const certificate = certificates?.find(c => c._id === certificateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate?.certificateNumber || certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Сертификат скачан');
    },
    onError: () => {
      toast.error('Ошибка при скачивании сертификата');
    },
  });

  const getCategoryName = (category?: string) => {
    switch (category) {
      case 'network':
        return 'Сетевое администрирование';
      case 'system-linux':
        return 'Системное администрирование (Linux)';
      case 'system-windows':
        return 'Системное администрирование (Windows)';
      default:
        return category || 'Курс';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'network':
        return 'from-blue-500 to-cyan-500';
      case 'system-linux':
        return 'from-green-500 to-emerald-500';
      case 'system-windows':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Award className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          Мои сертификаты
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Сертификаты о прохождении курсов
        </p>
      </div>

      {/* Stats */}
      {certificates && certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card border-2 border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Всего сертификатов
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {certificates.length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary-500 to-blue-500 rounded-2xl shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="card border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Средняя оценка
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {certificates.filter(c => c.grade !== undefined).length > 0
                    ? Math.round(
                        certificates
                          .filter(c => c.grade !== undefined)
                          .reduce((sum, c) => sum + (c.grade || 0), 0) /
                          certificates.filter(c => c.grade !== undefined).length
                      )
                    : '-'}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="card border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Категорий
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {new Set(
                    certificates
                      .map(c => (typeof c.course === 'object' ? c.course.category : null))
                      .filter(Boolean)
                  ).size}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      <div>
        {certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => {
              const course = typeof certificate.course === 'object' ? certificate.course : null;
              const category = course?.category || '';

              return (
                <div
                  key={certificate._id}
                  className="card border-2 border-primary-200 dark:border-primary-800 hover:shadow-xl transition-all duration-300"
                >
                  {/* Certificate Header */}
                  <div
                    className={cn(
                      'relative h-32 rounded-t-xl bg-gradient-to-br flex items-center justify-center mb-4',
                      getCategoryColor(category)
                    )}
                  >
                    <div className="text-white text-center">
                      <Award className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm font-semibold">СЕРТИФИКАТ</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {course?.title || 'Курс'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getCategoryName(category)}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Hash className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {certificate.certificateNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(certificate.completedAt).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {certificate.grade !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            Оценка: {certificate.grade}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => downloadMutation.mutate(certificate._id)}
                        disabled={downloadMutation.isPending}
                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                      >
                        {downloadMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Скачать PDF
                          </>
                        )}
                      </button>
                      {course && (
                        <Link
                          to={`/courses/${typeof certificate.course === 'object' ? certificate.course._id : certificate.course}`}
                          className="btn btn-secondary"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 card border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Award className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Нет сертификатов
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Завершите курсы, чтобы получить сертификаты
            </p>
            <Link to="/courses" className="btn btn-primary">
              Перейти к курсам
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;

