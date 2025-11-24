import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin';
import { coursesService } from '../services/courses';
import { aiService } from '../services/ai';
import { Lesson, Course } from '../types';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Sparkles, Loader2, Image, Upload } from 'lucide-react';

interface LessonFormProps {
  lesson?: Lesson;
  courseId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const LessonForm = ({ lesson, courseId, onClose, onSuccess }: LessonFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    content: lesson?.content || '',
    course: courseId || (typeof lesson?.course === 'string' ? lesson.course : lesson?.course?._id || ''),
    order: lesson?.order || 0,
    duration: lesson?.duration || 0,
    videoUrl: lesson?.videoUrl || '',
    resources: lesson?.resources || [''],
    exercises: lesson?.exercises || [],
    photos: lesson?.photos || [],
    photoDisplayType: lesson?.photoDisplayType || 'single',
    isPublished: lesson?.isPublished ?? false,
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lesson>) => adminService.createLesson(data),
    onSuccess: (newLesson) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', formData.course] });
      
      // If there are photos to upload, upload them after creating the lesson
      if (selectedPhotos.length > 0 && newLesson._id) {
        setUploadingPhotos(true);
        adminService.uploadLessonPhotos(newLesson._id, selectedPhotos)
          .then((data) => {
            toast.success('Урок создан и фотографии загружены успешно');
            setSelectedPhotos([]);
            setUploadingPhotos(false);
            onSuccess?.();
            onClose();
          })
          .catch((error) => {
            toast.success('Урок создан успешно, но произошла ошибка при загрузке фотографий');
            setUploadingPhotos(false);
            onSuccess?.();
            onClose();
          });
      } else {
        toast.success('Урок создан успешно');
        onSuccess?.();
        onClose();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания урока');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lesson>) => {
      if (!lesson?._id) throw new Error('ID урока не найден');
      return adminService.updateLesson(lesson._id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', lesson?._id] });
      queryClient.invalidateQueries({ queryKey: ['course', formData.course] });
      toast.success('Урок обновлен успешно');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления урока');
    },
  });

  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  const generateDescriptionMutation = useMutation({
    mutationFn: () => {
      if (!formData.title.trim()) {
        throw new Error('Введите название урока перед генерацией');
      }
      const selectedCourse = courses?.find((c) => c._id === formData.course);
      return aiService.generateLesson(
        formData.title,
        formData.course || undefined,
        selectedCourse?.level || 'intermediate',
        'description'
      );
    },
    onMutate: () => {
      setGeneratingDescription(true);
    },
    onSuccess: (response) => {
      if (response.success && response.description) {
        setFormData((prev) => ({ ...prev, description: response.description! }));
        toast.success('✨ Описание сгенерировано успешно!');
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

  const generateContentMutation = useMutation({
    mutationFn: () => {
      if (!formData.title.trim()) {
        throw new Error('Введите название урока перед генерацией');
      }
      const selectedCourse = courses?.find((c) => c._id === formData.course);
      return aiService.generateLesson(
        formData.title,
        formData.course || undefined,
        selectedCourse?.level || 'intermediate',
        'content'
      );
    },
    onMutate: () => {
      setGeneratingContent(true);
    },
    onSuccess: (response) => {
      if (response.success && response.content) {
        setFormData((prev) => ({ ...prev, content: response.content! }));
        toast.success('✨ Содержание урока сгенерировано успешно!');
      } else {
        toast.error('Не удалось сгенерировать содержание');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Ошибка генерации содержания');
    },
    onSettled: () => {
      setGeneratingContent(false);
    },
  });

  const generateFullMutation = useMutation({
    mutationFn: () => {
      if (!formData.title.trim()) {
        throw new Error('Введите название урока перед генерацией');
      }
      if (!formData.course) {
        throw new Error('Выберите курс перед генерацией');
      }
      const selectedCourse = courses?.find((c) => c._id === formData.course);
      return aiService.generateLesson(
        formData.title,
        formData.course || undefined,
        selectedCourse?.level || 'intermediate',
        'full'
      );
    },
    onMutate: () => {
      setGeneratingDescription(true);
      setGeneratingContent(true);
    },
    onSuccess: (response) => {
      if (response.success) {
        const updates: any = {};
        if (response.description) {
          updates.description = response.description;
        }
        if (response.content) {
          updates.content = response.content;
        }
        if (Object.keys(updates).length > 0) {
          setFormData((prev) => ({ ...prev, ...updates }));
          toast.success('🎉 Весь урок сгенерирован успешно!');
        } else {
          toast.error('Не удалось сгенерировать урок');
        }
      } else {
        toast.error('Не удалось сгенерировать урок');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Ошибка генерации урока');
    },
    onSettled: () => {
      setGeneratingDescription(false);
      setGeneratingContent(false);
    },
  });

  const handleGenerateDescription = () => {
    generateDescriptionMutation.mutate();
  };

  const handleGenerateContent = () => {
    generateContentMutation.mutate();
  };

  const handleGenerateFull = () => {
    generateFullMutation.mutate();
  };

  const uploadPhotosMutation = useMutation({
    mutationFn: async (photos: File[]) => {
      if (!lesson?._id) throw new Error('ID урока не найден');
      return adminService.uploadLessonPhotos(lesson._id, photos);
    },
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, photos: data.photos }));
      setSelectedPhotos([]);
      setUploadingPhotos(false);
      queryClient.invalidateQueries({ queryKey: ['lesson', lesson?._id] });
      toast.success('Фотографии загружены успешно');
    },
    onError: (error: any) => {
      setUploadingPhotos(false);
      toast.error(error.response?.data?.message || 'Ошибка загрузки фотографий');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoIndex: number) => {
      if (!lesson?._id) throw new Error('ID урока не найден');
      return adminService.deleteLessonPhoto(lesson._id, photoIndex);
    },
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, photos: data.photos }));
      queryClient.invalidateQueries({ queryKey: ['lesson', lesson?._id] });
      toast.success('Фотография удалена');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления фотографии');
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(files);
  };

  const handleUploadPhotos = async () => {
    if (selectedPhotos.length === 0 || !lesson?._id) return;
    setUploadingPhotos(true);
    uploadPhotosMutation.mutate(selectedPhotos);
  };

  const handleDeletePhoto = (index: number) => {
    if (!lesson?._id) return;
    deletePhotoMutation.mutate(index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      resources: formData.resources.filter((r) => r.trim() !== ''),
    };
    if (lesson) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addResource = () => {
    setFormData({ ...formData, resources: [...formData.resources, ''] });
  };

  const removeResource = (index: number) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter((_, i) => i !== index),
    });
  };

  const updateResource = (index: number, value: string) => {
    const newResources = [...formData.resources];
    newResources[index] = value;
    setFormData({ ...formData, resources: newResources });
  };

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        {
          title: '',
          description: '',
          type: 'practical' as const,
          instructions: '',
        },
      ],
    });
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    });
  };

  const updateExercise = (index: number, field: string, value: string) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setFormData({ ...formData, exercises: newExercises });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lesson ? 'Редактировать урок' : 'Создать урок'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!courseId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Курс *
              </label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Выберите курс</option>
                {courses?.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название урока *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Например: NAT (Network Address Translation)"
              required
            />
            {formData.title && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                💡 Введите название урока и используйте кнопки AI для генерации контента
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание *
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={!formData.title.trim() || generatingDescription || generateFullMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Сгенерировать описание урока с помощью AI"
              >
                {generatingDescription || generateFullMutation.isPending ? (
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
              placeholder="Краткое описание урока..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Содержание урока * (HTML)
            </label>
            
            {/* Toolbar */}
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Photo insertion section */}
                {formData.photos && formData.photos.length > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
                    <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Фото:</span>
                    <div className="flex items-center gap-1">
                      {formData.photos.map((photo, index) => {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        return (
                          <div key={index} className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = contentTextareaRef.current;
                                if (textarea) {
                                  const cursorPos = textarea.selectionStart;
                                  const textBefore = formData.content.substring(0, cursorPos);
                                  const textAfter = formData.content.substring(cursorPos);
                                  const photoTag = `<photo index="${index}" />`;
                                  const newContent = textBefore + photoTag + textAfter;
                                  setFormData({ ...formData, content: newContent });
                                  setTimeout(() => {
                                    textarea.focus();
                                    const newCursorPos = cursorPos + photoTag.length;
                                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                                  }, 0);
                                }
                              }}
                              className="relative w-10 h-10 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all hover:scale-110 group"
                              title={`Вставить фото ${index + 1}`}
                            >
                              <img
                                src={`${API_URL}${photo}`}
                                alt={`Фото ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  {index + 1}
                                </span>
                              </div>
                            </button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              Фото {index + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <Image className="h-4 w-4 inline mr-1" />
                    Загрузите фотографии, чтобы вставлять их в текст
                  </div>
                )}

                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

                {/* HTML formatting buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = contentTextareaRef.current;
                      if (textarea) {
                        const cursorPos = textarea.selectionStart;
                        const textBefore = formData.content.substring(0, cursorPos);
                        const textAfter = formData.content.substring(cursorPos);
                        const tag = '<h2>Заголовок</h2>';
                        setFormData({ ...formData, content: textBefore + tag + textAfter });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(cursorPos + 3, cursorPos + 11);
                        }, 0);
                      }
                    }}
                    className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Вставить заголовок H2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = contentTextareaRef.current;
                      if (textarea) {
                        const cursorPos = textarea.selectionStart;
                        const textBefore = formData.content.substring(0, cursorPos);
                        const textAfter = formData.content.substring(cursorPos);
                        const tag = '<h3>Подзаголовок</h3>';
                        setFormData({ ...formData, content: textBefore + tag + textAfter });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(cursorPos + 3, cursorPos + 14);
                        }, 0);
                      }
                    }}
                    className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Вставить заголовок H3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = contentTextareaRef.current;
                      if (textarea) {
                        const cursorPos = textarea.selectionStart;
                        const textBefore = formData.content.substring(0, cursorPos);
                        const textAfter = formData.content.substring(cursorPos);
                        const tag = '<p>Текст</p>';
                        setFormData({ ...formData, content: textBefore + tag + textAfter });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(cursorPos + 3, cursorPos + 7);
                        }, 0);
                      }
                    }}
                    className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Вставить параграф"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = contentTextareaRef.current;
                      if (textarea) {
                        const cursorPos = textarea.selectionStart;
                        const textBefore = formData.content.substring(0, cursorPos);
                        const textAfter = formData.content.substring(cursorPos);
                        const tag = '<ul>\n<li>Элемент списка</li>\n</ul>';
                        setFormData({ ...formData, content: textBefore + tag + textAfter });
                        setTimeout(() => {
                          textarea.focus();
                          const newPos = cursorPos + tag.indexOf('Элемент');
                          textarea.setSelectionRange(newPos, newPos + 14);
                        }, 0);
                      }
                    }}
                    className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Вставить список"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = contentTextareaRef.current;
                      if (textarea) {
                        const cursorPos = textarea.selectionStart;
                        const textBefore = formData.content.substring(0, cursorPos);
                        const textAfter = formData.content.substring(cursorPos);
                        const tag = '<pre><code>команда</code></pre>';
                        setFormData({ ...formData, content: textBefore + tag + textAfter });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(cursorPos + 15, cursorPos + 22);
                        }, 0);
                      }
                    }}
                    className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Вставить блок кода"
                  >
                    &lt;/&gt;
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

                {/* AI Generation button */}
                <button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={!formData.title.trim() || generatingContent || generateFullMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  title="Сгенерировать содержание урока с помощью AI"
                >
                  {generatingContent || generateFullMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      ✨ AI Генерация
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Генерация полного урока
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Сгенерируйте описание и содержание урока одной кнопкой. Требуется выбор курса.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateFull}
                disabled={!formData.title.trim() || !formData.course || generatingDescription || generatingContent || generateFullMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                {generatingDescription || generatingContent || generateFullMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Генерация полного урока...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    🚀 Сгенерировать весь урок
                  </>
                )}
              </button>
              {!formData.course && formData.title.trim() && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                  ⚠️ Выберите курс выше для генерации полного урока
                </p>
              )}
            </div>
            <textarea
              ref={contentTextareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              rows={12}
              required
              placeholder="Содержание урока в формате HTML..."
            />
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 <strong>Совет:</strong> Используйте кнопки на панели инструментов выше для быстрой вставки элементов. 
                Для фотографий просто нажмите на миниатюру нужного фото в нужном месте текста.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Длительность (минуты)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
              />
            </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL видео
            </label>
            <input
              type="text"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://example.com/video.mp4"
            />
          </div>

          {/* Photos Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Фотографии урока
            </label>
            
            {/* Display Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Способ отображения фотографий
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="photoDisplayType"
                    value="single"
                    checked={formData.photoDisplayType === 'single'}
                    onChange={(e) => setFormData({ ...formData, photoDisplayType: e.target.value as 'single' | 'carousel' })}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Одно фото</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="photoDisplayType"
                    value="carousel"
                    checked={formData.photoDisplayType === 'carousel'}
                    onChange={(e) => setFormData({ ...formData, photoDisplayType: e.target.value as 'single' | 'carousel' })}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Карусель (слайдер)</span>
                </label>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {lesson?._id ? 'Загрузить фотографии' : 'Выбрать фотографии для загрузки'}
              </label>
              <div className="flex gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="flex-1 block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300 cursor-pointer"
                />
                {lesson?._id && (
                  <button
                    type="button"
                    onClick={handleUploadPhotos}
                    disabled={selectedPhotos.length === 0 || uploadingPhotos}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Загрузить
                      </>
                    )}
                  </button>
                )}
              </div>
              {selectedPhotos.length > 0 && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Выбрано фотографий: {selectedPhotos.length}
                  {!lesson?._id && ' (будут загружены после создания урока)'}
                </p>
              )}
            </div>

            {/* Display existing photos */}
            {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photo}`}
                      alt={`Фото ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    />
                    {lesson?._id && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(index)}
                        disabled={deletePhotoMutation.isPending}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Удалить фотографию"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!lesson?._id && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💡 Вы можете выбрать фотографии перед созданием урока, они будут загружены автоматически после сохранения
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ресурсы
            </label>
            {formData.resources.map((resource, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => updateResource(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="URL ресурса"
                />
                {formData.resources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addResource}
              className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Добавить ресурс
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Упражнения
            </label>
            {formData.exercises.map((exercise, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Упражнение {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={exercise.title}
                    onChange={(e) => updateExercise(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Название"
                  />
                  <textarea
                    value={exercise.description}
                    onChange={(e) => updateExercise(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={2}
                    placeholder="Описание"
                  />
                  <select
                    value={exercise.type}
                    onChange={(e) => updateExercise(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="practical">Практическое</option>
                    <option value="theoretical">Теоретическое</option>
                  </select>
                  <textarea
                    value={exercise.instructions}
                    onChange={(e) => updateExercise(index, 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="Инструкции"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addExercise}
              className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Добавить упражнение
            </button>
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
                : lesson
                ? 'Сохранить'
                : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;

