import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiService, AssistRequest } from '../services/ai';
import { Bot, Send, Loader2, BookOpen, HelpCircle, Lightbulb, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useParams, Link } from 'react-router-dom';
import { coursesService, lessonsService } from '../services/courses';

const AIAssistant = () => {
  const { id: courseId, lessonId } = useParams<{ id?: string; lessonId?: string }>();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [useCourseContext, setUseCourseContext] = useState(false);

  // Fetch course and lesson data if IDs provided
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesService.getById(courseId!),
    enabled: !!courseId && useCourseContext,
  });

  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonsService.getById(lessonId!),
    enabled: !!lessonId && useCourseContext,
  });

  const assistMutation = useMutation({
    mutationFn: (data: AssistRequest) => aiService.assist(data),
    onSuccess: (response) => {
      if (response.success && response.response) {
        setHistory((prev) => [
          ...prev,
          { role: 'user', content: question },
          { role: 'assistant', content: response.response! },
        ]);
        setQuestion('');
        setContext('');
      } else {
        toast.error(response.message || 'Ошибка при получении ответа');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обращении к AI');
    },
  });

  const searchCourseMutation = useMutation({
    mutationFn: (data: { question: string; courseId?: string; lessonId?: string }) =>
      aiService.searchCourse(data.question, data.courseId, data.lessonId),
    onSuccess: (response) => {
      if (response.success && response.answer) {
        setHistory((prev) => [
          ...prev,
          { role: 'user', content: question },
          { role: 'assistant', content: response.answer! },
        ]);
        setQuestion('');
        setContext('');
      } else {
        toast.error(response.message || 'Ошибка при поиске');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при поиске по курсу');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error('Введите вопрос');
      return;
    }

    // Use course context search if enabled and course/lesson IDs available
    if (useCourseContext && (courseId || lessonId)) {
      searchCourseMutation.mutate({
        question: question.trim(),
        courseId: courseId || undefined,
        lessonId: lessonId || undefined,
      });
    } else {
      assistMutation.mutate({
        question: question.trim(),
        context: context.trim() || undefined,
      });
    }
  };

  const exampleQuestions = [
    'Что такое IP-адрес?',
    'Как работает протокол TCP/IP?',
    'Объясни разницу между маршрутизатором и коммутатором',
    'Что такое DNS и как он работает?',
    'Как настроить виртуальную машину в VirtualBox?',
  ];

  const handleExampleClick = (example: string) => {
    setQuestion(example);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              AI Помощник
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Задайте вопрос по сетевому или системному администрированию, и я помогу вам разобраться
            </p>
          </div>
          <Link to="/ai-tools" className="btn btn-secondary">
            <Sparkles className="h-5 w-5 mr-2" />
            AI Инструменты
          </Link>
        </div>
      </div>

      {/* Example Questions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Примеры вопросов
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleQuestions.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((message, index) => (
            <div
              key={index}
              className={cn(
                'card',
                message.role === 'user'
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                  : 'bg-white dark:bg-gray-800'
              )}
            >
              <div className="flex items-start gap-3">
                {message.role === 'assistant' ? (
                  <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {message.role === 'user' ? 'Вы' : 'AI Помощник'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(courseId || lessonId) && (
            <div className="flex items-center space-x-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <input
                type="checkbox"
                id="useCourseContext"
                checked={useCourseContext}
                onChange={(e) => setUseCourseContext(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useCourseContext" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Search className="h-4 w-4 inline mr-1" />
                Использовать контекст курса {course && `"${course.title}"`} {lesson && `- урок "${lesson.title}"`}
              </label>
            </div>
          )}

          <div>
            <label
              htmlFor="context"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <BookOpen className="h-4 w-4 inline mr-1" />
              Контекст (опционально)
            </label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Опишите контекст вашего вопроса (например, на каком уроке вы сейчас находитесь, какую тему изучаете)"
              rows={3}
              className="input"
              disabled={!!(useCourseContext && (courseId || lessonId))}
            />
            {useCourseContext && (courseId || lessonId) && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Контекст берется из курса/урока
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Ваш вопрос *
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Задайте вопрос по сетевому или системному администрированию..."
              rows={4}
              required
              className="input"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setQuestion('');
                setContext('');
                setHistory([]);
              }}
              className="btn btn-secondary"
              disabled={assistMutation.isPending || searchCourseMutation.isPending}
            >
              Очистить
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                (assistMutation.isPending || searchCourseMutation.isPending) || !question.trim()
              }
            >
              {assistMutation.isPending || searchCourseMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  {useCourseContext && (courseId || lessonId) ? (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Поиск по курсу
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Отправить
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;

