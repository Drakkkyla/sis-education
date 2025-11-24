import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { coursesService, lessonsService } from '../services/courses';
// import { certificatesService } from '../services/certificates'; // Временно отключено
import { CheckCircle, Circle, Play, Clock, Plus, Edit } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import CourseForm from '../components/CourseForm';
import LessonForm from '../components/LessonForm';
import { Course } from '../types';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'teacher';

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesService.getById(id!),
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', id],
    queryFn: () => coursesService.getProgress(id!),
    enabled: !!id,
  }) as { data: any };

  // Сертификаты временно отключены

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Курс не найден</h3>
      </div>
    );
  }

  const lessons = Array.isArray(course.lessons) 
    ? course.lessons.filter((lesson: any) => lesson && lesson._id)
    : [];
  const completedLessons = Array.isArray(progress?.completedLessons) 
    ? (progress.completedLessons as string[]) 
    : [];
  
  // Вычисляем процент выполнения
  const progressPercentage = progress && progress.totalLessons 
    ? Math.round((progress.completedCount / progress.totalLessons) * 100)
    : lessons.length > 0 
    ? Math.round((completedLessons.length / lessons.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{course.description}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCourseForm(true)}
              className="btn btn-secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Редактировать курс
            </button>
            <button
              onClick={() => setShowLessonForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить урок
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Прогресс курса
            </span>
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {progress.completedCount} / {progress.totalLessons}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Выполнено {progressPercentage}% курса
          </p>
        </div>
      )}

      {/* Certificate Section - Временно отключено */}
      {progress && progressPercentage === 100 && !isAdmin && (
        <div className="card border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Поздравляем! Курс завершен!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Вы успешно прошли все уроки курса. Отличная работа!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary - Always show if exists, highlight when completed */}
      {course.summary && (
        <div className={cn(
          "card border-2",
          progress && progressPercentage === 100
            ? "bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-primary-300 dark:border-primary-700"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {progress && progressPercentage === 100 ? "🎉 Итоги курса" : "📋 О курсе"}
            </h2>
            {progress && progressPercentage === 100 && (
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-semibold">
                Курс завершен!
              </span>
            )}
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-base leading-relaxed">
              {course.summary}
            </p>
          </div>
        </div>
      )}

      {/* Course completion certificate */}
      {progress && progressPercentage === 100 && (
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-300 dark:border-yellow-700">
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Поздравляем!
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Вы успешно завершили курс "{course.title}"
            </p>
            <button
              onClick={() => {
                // Generate a simple certificate
                const certificateWindow = window.open('', '_blank');
                if (certificateWindow) {
                  certificateWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Сертификат - ${course.title}</title>
                      <style>
                        body {
                          font-family: 'Times New Roman', serif;
                          text-align: center;
                          padding: 50px;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .certificate {
                          background: white;
                          padding: 60px;
                          border: 10px solid #d4af37;
                          box-shadow: 0 0 30px rgba(0,0,0,0.3);
                          max-width: 800px;
                          margin: 0 auto;
                        }
                        h1 {
                          color: #333;
                          font-size: 48px;
                          margin-bottom: 20px;
                        }
                        h2 {
                          color: #666;
                          font-size: 24px;
                          margin-bottom: 40px;
                        }
                        .name {
                          font-size: 36px;
                          color: #333;
                          margin: 30px 0;
                          font-weight: bold;
                        }
                        .course {
                          font-size: 28px;
                          color: #555;
                          margin: 20px 0;
                        }
                        .date {
                          margin-top: 40px;
                          color: #777;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="certificate">
                        <h1>СЕРТИФИКАТ</h1>
                        <h2>О завершении курса</h2>
                        <div class="name">${user?.firstName || ''} ${user?.lastName || user?.username || 'Студент'}</div>
                        <div class="course">успешно завершил(а) курс</div>
                        <div class="course" style="font-weight: bold; color: #333;">"${course.title}"</div>
                        <div class="date">${new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </body>
                    </html>
                  `);
                  certificateWindow.document.close();
                  setTimeout(() => certificateWindow.print(), 500);
                }
              }}
              className="btn btn-primary"
            >
              🎓 Получить сертификат
            </button>
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Уроки курса</h2>
        <div className="space-y-2">
          {lessons.map((lesson: any, index: number) => {
            if (!lesson || !lesson._id) return null;
            const lessonId = typeof lesson._id === 'string' ? lesson._id : String(lesson._id);
            const isCompleted = completedLessons.some((id: string) => String(id) === lessonId);
            return (
              <Link
                key={lessonId}
                to={`/lessons/${lessonId}`}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors',
                  isCompleted
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                )}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Урок {index + 1}
                      </span>
                      {lesson.duration && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          {lesson.duration} мин
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {lesson.title || 'Урок без названия'}
                    </h3>
                  </div>
                </div>
                <Play className="h-5 w-5 text-gray-400" />
              </Link>
            );
          })}
        </div>
      </div>

      {lessons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Уроки будут добавлены в ближайшее время</p>
          {isAdmin && (
            <button
              onClick={() => setShowLessonForm(true)}
              className="mt-4 btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать первый урок
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showCourseForm && course && (
        <CourseForm
          course={course}
          onClose={() => setShowCourseForm(false)}
          onSuccess={() => setShowCourseForm(false)}
        />
      )}

      {showLessonForm && id && (
        <LessonForm
          courseId={id}
          onClose={() => setShowLessonForm(false)}
          onSuccess={() => setShowLessonForm(false)}
        />
      )}
    </div>
  );
};

export default CourseDetail;

