import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/ai';
import {
  Bot,
  Code,
  BookOpen,
  FileText,
  Lightbulb,
  HelpCircle,
  FileQuestion,
  CheckSquare,
  Languages,
  Search,
  FlaskConical,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';

const AITools = () => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  // Code checker
  const checkCodeMutation = useMutation({
    mutationFn: ({ code, language }: { code: string; language?: string }) =>
      aiService.checkCode(code, language),
    onSuccess: (response) => {
      if (response.success && response.review) {
        setResult(response.review);
      } else {
        toast.error(response.message || 'Ошибка при проверке кода');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при проверке кода');
    },
  });

  // Exercise generator
  const generateExercisesMutation = useMutation({
    mutationFn: ({ topic, difficulty, count }: { topic: string; difficulty?: string; count?: number }) =>
      aiService.generateExercises(topic, difficulty as any, count),
    onSuccess: (response) => {
      if (response.success && response.exercises) {
        setResult(response.exercises);
      } else {
        toast.error(response.message || 'Ошибка при генерации заданий');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при генерации заданий');
    },
  });

  // Summarizer
  const summarizeMutation = useMutation({
    mutationFn: ({ content, maxLength }: { content: string; maxLength?: number }) =>
      aiService.summarize(content, maxLength),
    onSuccess: (response) => {
      if (response.success && response.summary) {
        setResult(response.summary);
      } else {
        toast.error(response.message || 'Ошибка при создании резюме');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании резюме');
    },
  });

  // Recommendations
  const recommendationsMutation = useMutation({
    mutationFn: ({ completedTopics, currentLevel }: { completedTopics: string[]; currentLevel?: string }) =>
      aiService.getRecommendations(completedTopics, currentLevel as any),
    onSuccess: (response) => {
      if (response.success && response.recommendations) {
        setResult(response.recommendations);
      } else {
        toast.error(response.message || 'Ошибка при получении рекомендаций');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при получении рекомендаций');
    },
  });

  // Explain simply
  const explainSimplyMutation = useMutation({
    mutationFn: ({ concept, targetAudience }: { concept: string; targetAudience?: string }) =>
      aiService.explainSimply(concept, targetAudience),
    onSuccess: (response) => {
      if (response.success && response.explanation) {
        setResult(response.explanation);
      } else {
        toast.error(response.message || 'Ошибка при объяснении');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при объяснении');
    },
  });

  // Translate
  const translateMutation = useMutation({
    mutationFn: ({ content, targetLanguage }: { content: string; targetLanguage?: string }) =>
      aiService.translate(content, targetLanguage),
    onSuccess: (response) => {
      if (response.success && response.translation) {
        setResult(response.translation);
      } else {
        toast.error(response.message || 'Ошибка при переводе');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при переводе');
    },
  });

  // Generate Quiz
  const generateQuizMutation = useMutation({
    mutationFn: (data: { topic: string; questionCount?: number; questionTypes?: ('single' | 'multiple' | 'text')[] }) =>
      aiService.generateQuiz(data.topic, data.questionCount, data.questionTypes),
    onSuccess: (response) => {
      if (response.success && response.questions) {
        setResult(response.questions);
      } else {
        toast.error(response.message || 'Ошибка при генерации вопросов');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при генерации вопросов');
    },
  });

  // Generate Lab
  const generateLabMutation = useMutation({
    mutationFn: (data: { topic: string; objectives: string[]; duration?: number }) =>
      aiService.generateLab(data.topic, data.objectives, data.duration),
    onSuccess: (response) => {
      if (response.success && response.instructions) {
        setResult(response.instructions);
      } else {
        toast.error(response.message || 'Ошибка при генерации лабораторной работы');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при генерации лабораторной работы');
    },
  });

  const tools = [
    {
      id: 'check-code',
      name: 'Проверка кода',
      description: 'Проверьте код или команды на ошибки',
      icon: Code,
      available: true,
    },
    {
      id: 'generate-exercises',
      name: 'Генерация заданий',
      description: 'Создайте практические задания по теме',
      icon: FileQuestion,
      available: true,
    },
    {
      id: 'summarize',
      name: 'Резюме контента',
      description: 'Создайте краткое резюме учебного материала',
      icon: FileText,
      available: true,
    },
    {
      id: 'recommendations',
      name: 'Рекомендации',
      description: 'Получите персональные рекомендации по обучению',
      icon: Lightbulb,
      available: true,
    },
    {
      id: 'explain-simply',
      name: 'Простое объяснение',
      description: 'Объясните сложную концепцию простым языком',
      icon: HelpCircle,
      available: true,
    },
    {
      id: 'translate',
      name: 'Переводчик',
      description: 'Переведите контент на другой язык',
      icon: Languages,
      available: true,
    },
    {
      id: 'generate-quiz',
      name: 'Генерация тестов',
      description: 'Создайте тестовые вопросы (только для преподавателей)',
      icon: BookOpen,
      available: user?.role === 'teacher' || user?.role === 'admin',
    },
    {
      id: 'generate-lab',
      name: 'Лабораторная работа',
      description: 'Создайте инструкции для лабораторной работы (только для преподавателей)',
      icon: FlaskConical,
      available: user?.role === 'teacher' || user?.role === 'admin',
    },
  ];

  const renderToolForm = () => {
    switch (activeTool) {
      case 'check-code':
        return <CheckCodeForm onSubmit={checkCodeMutation} />;
      case 'generate-exercises':
        return <GenerateExercisesForm onSubmit={generateExercisesMutation} />;
      case 'summarize':
        return <SummarizeForm onSubmit={summarizeMutation} />;
      case 'recommendations':
        return <RecommendationsForm onSubmit={recommendationsMutation} />;
      case 'explain-simply':
        return <ExplainSimplyForm onSubmit={explainSimplyMutation} />;
      case 'translate':
        return <TranslateForm onSubmit={translateMutation} />;
      case 'generate-quiz':
        return user?.role === 'teacher' || user?.role === 'admin' ? (
          <GenerateQuizForm onSubmit={generateQuizMutation} />
        ) : null;
      case 'generate-lab':
        return user?.role === 'teacher' || user?.role === 'admin' ? (
          <GenerateLabForm onSubmit={generateLabMutation} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          AI Инструменты
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Используйте различные AI-инструменты для обучения и работы
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(activeTool === tool.id ? null : tool.id);
                setResult('');
              }}
              disabled={!tool.available}
              className={cn(
                'card text-left p-6 hover:shadow-lg transition-shadow',
                activeTool === tool.id && 'ring-2 ring-primary-500',
                !tool.available && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Tool Form and Result */}
      {activeTool && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">{renderToolForm()}</div>
          {result && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Результат</h3>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Form components
const CheckCodeForm = ({ onSubmit }: { onSubmit: any }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('bash');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Введите код или команду');
      return;
    }
    onSubmit.mutate({ code: code.trim(), language });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Проверка кода</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Язык/Тип
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input"
        >
          <option value="bash">Bash/Shell</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cisco">Cisco IOS</option>
          <option value="powershell">PowerShell</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Код/Команда
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={10}
          className="input font-mono text-sm"
          placeholder="Введите код или команду для проверки..."
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Проверка...
          </>
        ) : (
          <>
            <CheckSquare className="h-5 w-5 mr-2" />
            Проверить код
          </>
        )}
      </button>
    </form>
  );
};

const GenerateExercisesForm = ({ onSubmit }: { onSubmit: any }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Введите тему');
      return;
    }
    onSubmit.mutate({ topic: topic.trim(), difficulty, count });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Генерация заданий</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Тема *
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input"
          placeholder="Например: Настройка сети"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Сложность
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input"
          >
            <option value="easy">Легкая</option>
            <option value="medium">Средняя</option>
            <option value="hard">Сложная</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Количество
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 5)}
            min={1}
            max={20}
            className="input"
          />
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Генерация...
          </>
        ) : (
          <>
            <FileQuestion className="h-5 w-5 mr-2" />
            Сгенерировать задания
          </>
        )}
      </button>
    </form>
  );
};

const SummarizeForm = ({ onSubmit }: { onSubmit: any }) => {
  const [content, setContent] = useState('');
  const [maxLength, setMaxLength] = useState(500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Введите контент');
      return;
    }
    onSubmit.mutate({ content: content.trim(), maxLength });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Резюме контента</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Максимальная длина
        </label>
        <input
          type="number"
          value={maxLength}
          onChange={(e) => setMaxLength(parseInt(e.target.value) || 500)}
          min={100}
          max={2000}
          className="input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Контент *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="input"
          placeholder="Введите текст для создания резюме..."
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Создание резюме...
          </>
        ) : (
          <>
            <FileText className="h-5 w-5 mr-2" />
            Создать резюме
          </>
        )}
      </button>
    </form>
  );
};

const RecommendationsForm = ({ onSubmit }: { onSubmit: any }) => {
  const [completedTopics, setCompletedTopics] = useState('');
  const [currentLevel, setCurrentLevel] = useState('intermediate');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topics = completedTopics.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    if (topics.length === 0) {
      toast.error('Введите изученные темы');
      return;
    }
    onSubmit.mutate({ completedTopics: topics, currentLevel });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Рекомендации по обучению</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Текущий уровень
        </label>
        <select
          value={currentLevel}
          onChange={(e) => setCurrentLevel(e.target.value)}
          className="input"
        >
          <option value="beginner">Начинающий</option>
          <option value="intermediate">Средний</option>
          <option value="advanced">Продвинутый</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Изученные темы (через запятую) *
        </label>
        <textarea
          value={completedTopics}
          onChange={(e) => setCompletedTopics(e.target.value)}
          rows={5}
          className="input"
          placeholder="TCP/IP, DNS, Маршрутизация, ..."
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Получение рекомендаций...
          </>
        ) : (
          <>
            <Lightbulb className="h-5 w-5 mr-2" />
            Получить рекомендации
          </>
        )}
      </button>
    </form>
  );
};

const ExplainSimplyForm = ({ onSubmit }: { onSubmit: any }) => {
  const [concept, setConcept] = useState('');
  const [targetAudience, setTargetAudience] = useState('начинающий студент');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      toast.error('Введите концепцию');
      return;
    }
    onSubmit.mutate({ concept: concept.trim(), targetAudience });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Простое объяснение</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Аудитория
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          className="input"
          placeholder="начинающий студент"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Концепция *
        </label>
        <input
          type="text"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          className="input"
          placeholder="Например: Что такое VLAN?"
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Объяснение...
          </>
        ) : (
          <>
            <HelpCircle className="h-5 w-5 mr-2" />
            Объяснить
          </>
        )}
      </button>
    </form>
  );
};

const TranslateForm = ({ onSubmit }: { onSubmit: any }) => {
  const [content, setContent] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('русский');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Введите текст для перевода');
      return;
    }
    onSubmit.mutate({ content: content.trim(), targetLanguage });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Переводчик</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Целевой язык
        </label>
        <input
          type="text"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="input"
          placeholder="русский, английский, etc."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Текст для перевода *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="input"
          placeholder="Введите текст для перевода..."
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Перевод...
          </>
        ) : (
          <>
            <Languages className="h-5 w-5 mr-2" />
            Перевести
          </>
        )}
      </button>
    </form>
  );
};

const GenerateQuizForm = ({ onSubmit }: { onSubmit: any }) => {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['single', 'multiple']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Введите тему');
      return;
    }
    onSubmit.mutate({ topic: topic.trim(), questionCount, questionTypes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Генерация тестов</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Тема *
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input"
          placeholder="Например: Настройка сети"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Количество вопросов
          </label>
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
            min={1}
            max={20}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Типы вопросов
        </label>
        <div className="space-y-2">
          {['single', 'multiple', 'text'].map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={questionTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setQuestionTypes([...questionTypes, type]);
                  } else {
                    setQuestionTypes(questionTypes.filter((t) => t !== type));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {type === 'single' ? 'Одиночный выбор' : type === 'multiple' ? 'Множественный выбор' : 'Текстовый ответ'}
              </span>
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Генерация...
          </>
        ) : (
          <>
            <BookOpen className="h-5 w-5 mr-2" />
            Сгенерировать вопросы
          </>
        )}
      </button>
    </form>
  );
};

const GenerateLabForm = ({ onSubmit }: { onSubmit: any }) => {
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [duration, setDuration] = useState(60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Введите тему');
      return;
    }
    const objectivesList = objectives.split(',').map((o) => o.trim()).filter((o) => o.length > 0);
    if (objectivesList.length === 0) {
      toast.error('Введите цели работы');
      return;
    }
    onSubmit.mutate({ topic: topic.trim(), objectives: objectivesList, duration });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Лабораторная работа</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Тема *
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input"
          placeholder="Например: Настройка VLAN"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Цели работы (через запятую) *
        </label>
        <textarea
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          rows={3}
          className="input"
          placeholder="Изучить настройку VLAN, Настроить коммутатор, ..."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Продолжительность (минуты)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
          min={15}
          max={300}
          className="input"
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={onSubmit.isPending}
      >
        {onSubmit.isPending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Генерация...
          </>
        ) : (
          <>
            <FlaskConical className="h-5 w-5 mr-2" />
            Сгенерировать инструкции
          </>
        )}
      </button>
    </form>
  );
};

export default AITools;

