import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonsService } from '../services/courses';
import { quizzesService } from '../services/quizzes';
import { submissionsService } from '../services/submissions';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Upload, Download, ArrowLeft, ArrowRight, Play, FileText, BookOpen, Lightbulb, Target, Info, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import LessonContent from '../components/LessonContent';

const LessonView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState<number | undefined>(undefined);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsService.getById(id!),
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['lesson-progress', id],
    queryFn: () => lessonsService.getProgress(id!),
    enabled: !!id,
  });

  const { data: quizzes } = useQuery({
    queryKey: ['quizzes', id],
    queryFn: () => quizzesService.getAll(undefined, id),
    enabled: !!id,
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions', id],
    queryFn: () => submissionsService.getAll(undefined, id),
    enabled: !!id,
  });

  // Проверяем выполнение практических заданий
  const allExercises = lesson?.exercises || [];
  const practicalExercises = allExercises.filter((ex) => ex.type === 'practical');
  const submittedExerciseIndices = submissions?.map((s) => s.exerciseIndex).filter((idx) => idx !== undefined && idx !== null) || [];
  
  // Находим индексы практических заданий среди всех заданий
  const practicalExerciseIndices = allExercises
    .map((ex, index) => ex.type === 'practical' ? index : -1)
    .filter((idx) => idx !== -1);
  
  const allPracticalExercisesCompleted = practicalExercises.length > 0 
    ? practicalExerciseIndices.every((idx) => submittedExerciseIndices.includes(idx))
    : true;

  const completeMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('ID урока не найден');
      return lessonsService.complete(id, 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', id] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      toast.success('Урок завершен!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Ошибка завершения урока');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      if (!lesson) throw new Error('Урок не загружен');
      const courseId = typeof lesson.course === 'string' ? lesson.course : lesson.course?._id || '';
      if (!courseId) throw new Error('ID курса не найден');
      return submissionsService.upload(file, courseId, id!, exerciseIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', id] });
      toast.success('Работа загружена успешно!');
      setSelectedFile(null);
      setExerciseIndex(undefined);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Ошибка загрузки файла');
    },
  });

  const handleFileUpload = () => {
    if (!selectedFile || !lesson) return;
    uploadMutation.mutate(selectedFile);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Урок не найден</h3>
      </div>
    );
  }

  const course = typeof lesson.course === 'object' ? lesson.course : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative">
        {course && (
          <Link
            to={`/courses/${course._id}`}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Вернуться к курсу
          </Link>
        )}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
                <BookOpen className="h-8 w-8" />
                {lesson.title}
              </h1>
              <p className="text-primary-100 text-lg leading-relaxed">{lesson.description}</p>
            </div>
            {lesson.duration && (
              <div className="ml-4 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm font-medium">⏱️ {lesson.duration} мин</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video */}
      {lesson.videoUrl && (
        <div className="card">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            {lesson.videoUrl.startsWith('http') ? (
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-white hover:text-primary-400"
              >
                <Play className="h-12 w-12" />
                <span className="text-lg font-medium">Смотреть видео</span>
              </a>
            ) : (
              <video controls className="w-full h-full">
                <source src={lesson.videoUrl} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="card bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Материал урока</h2>
        </div>
        <LessonContent 
          content={lesson.content} 
          photos={lesson.photos}
          photoDisplayType={lesson.photoDisplayType}
        />
      </div>

      {/* Exercises */}
      {lesson.exercises && lesson.exercises.length > 0 && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                💡 Практические задания
              </h2>
            </div>
            {practicalExercises.length > 0 && (
              <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  ⚠️ Обязательно для завершения урока
                </span>
              </div>
            )}
          </div>
          <div className="space-y-6">
            {lesson.exercises.map((exercise, index) => {
              const isPractical = exercise.type === 'practical';
              const isCompleted = submittedExerciseIndices.includes(index);
              const exerciseSubmission = submissions?.find((s) => s.exerciseIndex === index);
              
              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 p-6 rounded-xl border-2 shadow-md hover:shadow-lg transition-shadow ${
                    isPractical 
                      ? isCompleted 
                        ? 'border-green-500 dark:border-green-600' 
                        : 'border-red-300 dark:border-red-700'
                      : 'border-green-300 dark:border-green-700'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md ${
                      isPractical 
                        ? isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {exercise.title}
                        </h3>
                        {isPractical && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                            Обязательно
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            ✓ Выполнено
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        {exercise.description}
                      </p>
                      {isCompleted && exerciseSubmission && (
                        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            📎 Загружено: {exerciseSubmission.fileName} 
                            {exerciseSubmission.status === 'approved' && exerciseSubmission.grade !== undefined && (
                              <span className="ml-2">• Оценка: {exerciseSubmission.grade}/5</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                <div className="ml-13 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Инструкции:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {exercise.instructions}
                  </p>
                </div>
                  {!isCompleted && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        📤 Загрузить выполненное задание:
                        {isPractical && (
                          <span className="ml-2 text-red-600 dark:text-red-400 text-xs">
                            (обязательно)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="file"
                          onChange={(e) => {
                            setSelectedFile(e.target.files?.[0] || null);
                            setExerciseIndex(index);
                          }}
                          className="flex-1 block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300 cursor-pointer"
                        />
                        <button
                          onClick={handleFileUpload}
                          disabled={!selectedFile || exerciseIndex !== index || uploadMutation.isPending}
                          className="btn btn-primary shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Загрузить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-purple-200 dark:border-purple-800">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              📚 Дополнительные материалы
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.resources.map((resource, index) => (
              <a
                key={index}
                href={resource}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Ресурс {index + 1}
                  </span>
                </div>
                <Download className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quizzes */}
      {quizzes && quizzes.length > 0 && (
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200 dark:border-orange-800 shadow-lg">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-orange-200 dark:border-orange-800">
            <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🎯 Проверь свои знания
            </h2>
          </div>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Link
                key={quiz._id}
                to={`/quizzes/${quiz._id}`}
                className="group flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-orange-200 dark:border-orange-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                    <span className="text-xl">📝</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-lg">
                    {quiz.title}
                  </span>
                </div>
                <ArrowRight className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex flex-col items-center pt-4 space-y-3">
        {!allPracticalExercisesCompleted && practicalExercises.length > 0 && (
          <div className="w-full max-w-md p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 text-center">
              ⚠️ Для завершения урока необходимо выполнить все практические задания
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 text-center mt-1">
              Не выполнено заданий: {practicalExerciseIndices
                .filter((idx) => !submittedExerciseIndices.includes(idx))
                .map((idx) => idx + 1)
                .join(', ')}
            </p>
          </div>
        )}
        <button
          onClick={() => {
            if (id) {
              completeMutation.mutate();
            }
          }}
          disabled={
            progress?.completed || 
            completeMutation.isPending || 
            !id || 
            !allPracticalExercisesCompleted
          }
          className={cn(
            'px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
            progress?.completed
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : !allPracticalExercisesCompleted && practicalExercises.length > 0
              ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white'
          )}
        >
          {progress?.completed ? (
            <>
              <CheckCircle className="h-6 w-6 mr-2 inline-block" />
              ✅ Урок завершен! Молодец!
            </>
          ) : (
            <>
              {completeMutation.isPending ? (
                '⏳ Завершение...'
              ) : !allPracticalExercisesCompleted && practicalExercises.length > 0 ? (
                <>
                  <X className="h-6 w-6 mr-2 inline-block" />
                  Выполните все практические задания
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 mr-2 inline-block" />
                  🎉 Завершить урок
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LessonView;

