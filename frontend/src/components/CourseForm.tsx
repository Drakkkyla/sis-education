import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin';
import { aiService } from '../services/ai';
import { Course } from '../types';
import toast from 'react-hot-toast';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface CourseFormProps {
  course?: Course;
  onClose: () => void;
  onSuccess?: () => void;
}

const CourseForm = ({ course, onClose, onSuccess }: CourseFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    summary: course?.summary || '',
    category: course?.category || 'network',
    level: course?.level || 'beginner',
    thumbnail: course?.thumbnail || '',
    order: course?.order || 0,
    isPublished: course?.isPublished ?? false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Course>) => adminService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Курс создан успешно');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания курса');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Course>) => {
      if (!course?._id) throw new Error('ID курса не найден');
      return adminService.updateCourse(course._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', course?._id] });
      toast.success('Курс обновлен успешно');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления курса');
    },
  });

  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const generateDescriptionMutation = useMutation({
    mutationFn: () => {
      if (!formData.title.trim()) {
        throw new Error('Введите название курса перед генерацией');
      }
      return aiService.generateLesson(
        formData.title,
        undefined,
        formData.level || 'intermediate',
        'description'
      );
    },
    onMutate: () => {
      setGeneratingDescription(true);
    },
    onSuccess: (response) => {
      if (response.success && response.description) {
        setFormData((prev) => ({ ...prev, description: response.description! }));
        toast.success('✨ Описание курса сгенерировано успешно!');
      } else {
        toast.error('Не удалось сгенерировать описание');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Ошибка генерации описания');
    },
    onSettled: () => {
      setGeneratingDescription(false);
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: () => {
      if (!formData.title.trim()) {
        throw new Error('Введите название курса перед генерацией');
      }
      // Generate summary using AI chat
      return aiService.chat({
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по созданию образовательного контента. Создавай краткие и информативные итоговые тексты для курсов.',
          },
          {
            role: 'user',
            content: `Создай итоговый текст курса (2-3 абзаца) для курса "${formData.title}" по категории "${formData.category}" уровня "${formData.level}". 
Итоговый текст должен подводить итоги того, что студент изучит, какие навыки получит, и мотивировать к дальнейшему обучению.`,
          },
        ],
      });
    },
    onMutate: () => {
      setGeneratingSummary(true);
    },
    onSuccess: (response) => {
      if (response.success && response.response) {
        setFormData((prev) => ({ ...prev, summary: response.response! }));
        toast.success('✨ Итоговый текст курса сгенерирован успешно!');
      } else {
        toast.error('Не удалось сгенерировать итоговый текст');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Ошибка генерации итогового текста');
    },
    onSettled: () => {
      setGeneratingSummary(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (course) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {course ? 'Редактировать курс' : 'Создать курс'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название курса *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание *
              </label>
              <button
                type="button"
                onClick={() => generateDescriptionMutation.mutate()}
                disabled={!formData.title.trim() || generatingDescription}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Сгенерировать описание курса с помощью AI"
              >
                {generatingDescription ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    ✨ AI
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              required
              placeholder="Краткое описание курса..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Итоговый текст курса
              </label>
              <button
                type="button"
                onClick={() => generateSummaryMutation.mutate()}
                disabled={!formData.title.trim() || generatingSummary}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Сгенерировать итоговый текст курса с помощью AI"
              >
                {generatingSummary ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    ✨ AI
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={4}
              placeholder="Итоговый текст, который будет отображаться после завершения курса. Будет показан студентам после завершения всех уроков."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 Итоговый текст будет показан студентам после завершения курса
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Категория *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Course['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="network">Сетевое администрирование</option>
                <option value="system-linux">Linux</option>
                <option value="system-windows">Windows</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Уровень *
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as Course['level'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="beginner">Начальный</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL миниатюры
            </label>
            <input
              type="text"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://example.com/image.jpg"
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Порядок
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Опубликован
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Сохранение...'
                : course
                ? 'Сохранить'
                : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;

