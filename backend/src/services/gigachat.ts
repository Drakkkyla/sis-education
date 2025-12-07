import axios from 'axios';
import https from 'https';

// Create axios instance with SSL configuration for GigaChat API
// Note: In production, you should use proper SSL certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Allow self-signed certificates (for development)
});

const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY || 'MDE5YTU1OTItOTk3MS03NDRjLWI4MWEtZWM3M2M1OGFkM2RiOjdkZjZkZGE0LWJlNGMtNGZmZi1hNzU5LWQ0YmI1Y2RiMTM2Zg==';
const GIGACHAT_SCOPE = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
const GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const GIGACHAT_API_URL = 'https://gigachat.devices.sberbank.ru/api/v1';

// Ensure Authorization Key doesn't already contain 'Basic ' prefix
const getAuthHeader = (): string => {
  const key = GIGACHAT_AUTH_KEY.trim();
  if (key.startsWith('Basic ')) {
    return key;
  }
  return `Basic ${key}`;
};

// Token cache
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: 'GigaChat-2' | 'GigaChat-2-Pro' | 'GigaChat-2-Max';
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Generate unique request ID (UUID v4 format)
 * GigaChat API requires RqUID in UUID format
 */
function generateRqUID(): string {
  // Generate UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get Access Token from GigaChat API
 * Token is valid for 30 minutes
 */
async function getAccessToken(): Promise<string> {
  // Check if token is still valid (with 5 minute buffer)
  const now = Date.now();
  if (accessToken !== null && tokenExpiresAt > now + 5 * 60 * 1000) {
    return accessToken;
  }

  try {
    const rqUID = generateRqUID();
    
    // Use URLSearchParams for proper form-urlencoded format
    const params = new URLSearchParams();
    params.append('scope', GIGACHAT_SCOPE);
    
    const authHeader = getAuthHeader();
    const requestBody = params.toString();
    
    console.log('GigaChat OAuth request:', {
      url: GIGACHAT_OAUTH_URL,
      scope: GIGACHAT_SCOPE,
      rqUID: rqUID,
      authKeyLength: GIGACHAT_AUTH_KEY?.length,
      body: requestBody,
    });
    
    const response = await axios.post(
      GIGACHAT_OAUTH_URL,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': rqUID,
          'Authorization': authHeader,
        },
        httpsAgent: httpsAgent,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      }
    );
    
    // Check for error status
    if (response.status !== 200 && response.status !== 201) {
      const errorData = response.data || {};
      console.error('GigaChat OAuth error response:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        headers: response.headers,
      });
      
      // Extract error message
      const errorMsg = errorData.error_description || errorData.error || errorData.message || `HTTP ${response.status}`;
      throw new Error(`GigaChat OAuth failed (${response.status}): ${errorMsg}`);
    }
    
    console.log('GigaChat OAuth response:', {
      status: response.status,
      hasAccessToken: !!response.data?.access_token,
      expiresAt: response.data?.expires_at,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });

    if (response.data && response.data.access_token) {
      const newToken = response.data.access_token;
      accessToken = newToken;
      // Token is valid for 30 minutes (1800 seconds)
      // GigaChat returns expires_at in seconds, convert to milliseconds
      const expiresIn = response.data.expires_at ? response.data.expires_at * 1000 : 30 * 60 * 1000;
      tokenExpiresAt = now + expiresIn;
      console.log('Access token obtained successfully, expires in:', expiresIn / 1000, 'seconds');
      return newToken;
    }

    throw new Error(`Не удалось получить Access Token от GigaChat API. Response: ${JSON.stringify(response.data)}`);
  } catch (error: any) {
    console.error('GigaChat OAuth error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error_description || error.response?.data?.error || 'Некорректный запрос';
      throw new Error(`Ошибка авторизации GigaChat API (400): ${errorMsg}. Проверьте Authorization Key и Scope.`);
    }
    
    if (error.response?.status === 401) {
      throw new Error('Неверный Authorization Key для GigaChat API. Проверьте настройки в .env файле.');
    }
    
    throw new Error(error.response?.data?.error_description || error.response?.data?.message || error.message || 'Ошибка при получении токена доступа GigaChat');
  }
}

/**
 * Send a chat completion request to GigaChat API
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  try {
    const {
      model = 'GigaChat-2',
      temperature = 0.7,
      max_tokens = 2000,
      stream = false,
    } = options;

    // Get access token
    const token = await getAccessToken();

    const response = await axios.post(
      `${GIGACHAT_API_URL}/chat/completions`,
      {
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens,
        stream,
        n: 1,
        repetition_penalty: 1,
        update_interval: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        httpsAgent: httpsAgent,
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content || '';
    }

    throw new Error('Пустой ответ от GigaChat API');
  } catch (error: any) {
    console.error('GigaChat API error:', error.response?.data || error.message);
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Token might be expired, try to refresh
      accessToken = null;
      tokenExpiresAt = 0;
      try {
        const token = await getAccessToken();
        // Retry the request
        return chatCompletion(messages, options);
      } catch (retryError: any) {
        throw new Error('Неверный Authorization Key для GigaChat API. Проверьте настройки в .env файле.');
      }
    }
    
    if (error.response?.status === 402 || error.response?.status === 403) {
      throw new Error('Недостаточно средств на аккаунте GigaChat API или доступ запрещен. Пожалуйста, пополните баланс на https://developers.sber.ru/');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Превышен лимит запросов к GigaChat API. Попробуйте позже.');
    }
    
    if (error.response?.status === 500 || error.response?.status === 503) {
      throw new Error('Сервис GigaChat временно недоступен. Попробуйте позже.');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Ошибка при обращении к GigaChat API');
  }
}

/**
 * Get AI assistance for students
 */
export async function getStudentAssistance(
  question: string,
  context?: string
): Promise<string> {
  const systemPrompt = `Ты - полезный помощник для студентов, изучающих сетевое и системное администрирование.
Твоя задача - помочь студентам понять материал, ответить на вопросы и объяснить сложные концепции простым языком.
Будь дружелюбным, понятным и используй примеры из реальной жизни когда это возможно.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: context
        ? `Контекст: ${context}\n\nВопрос: ${question}`
        : question,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Pro',
    temperature: 0.7,
    max_tokens: 1500,
  });
}

/**
 * Analyze and provide feedback on student answers
 */
export async function analyzeAnswer(
  question: string,
  studentAnswer: string,
  correctAnswer?: string
): Promise<string> {
  const systemPrompt = `Ты - преподаватель, который анализирует ответы студентов.
Твоя задача - дать конструктивную обратную связь, указать на ошибки (если они есть) и объяснить правильное решение.
Будь тактичным и мотивирующим.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Вопрос: ${question}\n\nОтвет студента: ${studentAnswer}${
        correctAnswer ? `\n\nПравильный ответ: ${correctAnswer}` : ''
      }\n\nПроанализируй ответ студента и дай обратную связь.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Pro',
    temperature: 0.5,
    max_tokens: 1000,
  });
}

/**
 * Generate educational content
 */
export async function generateContent(
  topic: string,
  type: 'explanation' | 'example' | 'exercise' | 'summary',
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<string> {
  const typePrompts = {
    explanation: 'Объясни эту тему подробно и понятно',
    example: 'Приведи практический пример использования этой темы',
    exercise: 'Создай практическое задание по этой теме',
    summary: 'Создай краткое резюме по этой теме',
  };

  const levelDescriptions = {
    beginner: 'для начинающих, используй простой язык',
    intermediate: 'для среднего уровня',
    advanced: 'для продвинутого уровня, можно использовать технические термины',
  };

  const systemPrompt = `Ты - эксперт по сетевому и системному администрированию.
Твоя задача - создавать качественный образовательный контент для студентов.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `${typePrompts[type]} по теме "${topic}". Уровень сложности: ${levelDescriptions[level]}.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Max',
    temperature: 0.8,
    max_tokens: 2000,
  });
}

/**
 * Get explanation for a technical term or concept
 */
export async function explainTerm(term: string): Promise<string> {
  const systemPrompt = `Ты - преподаватель, который объясняет технические термины простым языком.
Объясни термин понятно, приведи примеры использования и контекст, в котором он применяется.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Объясни термин: ${term}`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2',
    temperature: 0.7,
    max_tokens: 800,
  });
}

/**
 * Check code or command for errors and provide suggestions
 */
export async function checkCode(code: string, language: string = 'bash'): Promise<string> {
  const systemPrompt = `Ты - эксперт по программированию и системному администрированию.
Твоя задача - проверить код/команды на ошибки и предложить исправления.
Будь точным и конкретным в своих замечаниях.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Проверь следующий ${language} код/команду на ошибки и предложи исправления:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Pro',
    temperature: 0.3,
    max_tokens: 1500,
  });
}

/**
 * Generate practice exercises
 */
export async function generateExercises(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  count: number = 5
): Promise<string> {
  const systemPrompt = `Ты - преподаватель, который создает практические задания для студентов.
Создавай интересные и полезные задания, которые помогут закрепить материал.`;

  const difficultyDescriptions = {
    easy: 'простые задания для начинающих',
    medium: 'задания среднего уровня сложности',
    hard: 'сложные задания для продвинутых студентов',
  };

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Создай ${count} практических заданий по теме "${topic}". Уровень сложности: ${difficultyDescriptions[difficulty]}. Каждое задание должно включать описание задачи и ожидаемый результат.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Max',
    temperature: 0.8,
    max_tokens: 3000,
  });
}

/**
 * Summarize lesson content
 */
export async function summarizeContent(content: string, maxLength: number = 500): Promise<string> {
  const systemPrompt = `Ты - эксперт по созданию кратких резюме.
Твоя задача - создать краткое, но информативное резюме учебного материала.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Создай краткое резюме следующего материала (максимум ${maxLength} символов):\n\n${content}`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2',
    temperature: 0.5,
    max_tokens: maxLength,
  });
}

/**
 * Get personalized learning recommendations
 */
export async function getLearningRecommendations(
  completedTopics: string[],
  currentLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<string> {
  const systemPrompt = `Ты - персональный наставник по обучению.
Твоя задача - дать персональные рекомендации по дальнейшему обучению на основе пройденных тем.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Студент изучил следующие темы: ${completedTopics.join(', ')}. Текущий уровень: ${currentLevel}.
Предложи следующие шаги обучения и темы для изучения.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Pro',
    temperature: 0.7,
    max_tokens: 1000,
  });
}

/**
 * Explain complex concept in simple terms
 */
export async function explainSimply(concept: string, targetAudience: string = 'начинающий студент'): Promise<string> {
  const systemPrompt = `Ты - преподаватель, который объясняет сложные концепции простым языком.
Используй аналогии и примеры из реальной жизни.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Объясни концепцию "${concept}" для ${targetAudience}. Используй простой язык и примеры.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2',
    temperature: 0.7,
    max_tokens: 1500,
  });
}

/**
 * Generate quiz questions
 */
export async function generateQuizQuestions(
  topic: string,
  questionCount: number = 5,
  questionTypes: ('single' | 'multiple' | 'text')[] = ['single', 'multiple']
): Promise<string> {
  const systemPrompt = `Ты - эксперт по созданию тестовых вопросов.
Создавай качественные вопросы с правильными ответами и объяснениями.`;

  const typeNames = {
    single: 'одиночный выбор',
    multiple: 'множественный выбор',
    text: 'текстовый ответ',
  };

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Создай ${questionCount} тестовых вопросов по теме "${topic}".
Типы вопросов: ${questionTypes.map((t) => typeNames[t]).join(', ')}.
Для каждого вопроса укажи: текст вопроса, варианты ответов (если применимо), правильный ответ и объяснение.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Max',
    temperature: 0.8,
    max_tokens: 4000,
  });
}

/**
 * Review and grade submission
 */
export async function reviewSubmission(
  assignment: string,
  submission: string,
  criteria?: string[]
): Promise<string> {
  const systemPrompt = `Ты - преподаватель, который проверяет работы студентов.
Дай конструктивную обратную связь, укажи на ошибки и предложи улучшения.`;

  const criteriaText = criteria ? `Критерии оценки: ${criteria.join(', ')}.\n\n` : '';

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Задание: ${assignment}\n\n${criteriaText}Работа студента:\n${submission}\n\nПроверь работу и дай оценку с обратной связью.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Pro',
    temperature: 0.5,
    max_tokens: 2000,
  });
}

/**
 * Translate content to another language
 */
export async function translateContent(content: string, targetLanguage: string = 'русский'): Promise<string> {
  const systemPrompt = `Ты - профессиональный переводчик технических текстов.
Переводи точно, сохраняя техническую терминологию.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Переведи следующий текст на ${targetLanguage}:\n\n${content}`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2',
    temperature: 0.3,
    max_tokens: 2000,
  });
}

/**
 * Search and answer questions about course content
 */
export async function searchCourseContent(
  question: string,
  courseContent?: string
): Promise<string> {
  const systemPrompt = `Ты - помощник, который отвечает на вопросы по учебным материалам.
Используй только информацию из предоставленного контента.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: courseContent
        ? `Контент курса:\n${courseContent}\n\nВопрос: ${question}`
        : `Вопрос: ${question}\n\nОтветь на вопрос по сетевому и системному администрированию.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Pro',
    temperature: 0.7,
    max_tokens: 1500,
  });
}

/**
 * Generate lab work instructions
 */
export async function generateLabInstructions(
  topic: string,
  objectives: string[],
  duration: number = 60
): Promise<string> {
  const systemPrompt = `Ты - преподаватель, который создает инструкции для лабораторных работ.
Создавай пошаговые инструкции с четкими задачами и ожидаемыми результатами.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Создай инструкцию для лабораторной работы по теме "${topic}".
Цели работы: ${objectives.join(', ')}.
Продолжительность: ${duration} минут.
Включи: цель работы, необходимое оборудование, пошаговые инструкции, ожидаемые результаты, вопросы для самопроверки.`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2-Max',
    temperature: 0.7,
    max_tokens: 3000,
  });
}

/**
 * Improve text style and formatting
 */
export async function improveText(text: string): Promise<string> {
  const systemPrompt = `Ты опытный методист и редактор образовательных материалов.
Твоя задача — улучшить текст урока. Используй дружелюбный, но профессиональный тон.
Добавь подходящие по смыслу эмодзи, чтобы текст выглядел живым.
Если текст длинный — разбей на абзацы.
Не меняй смысл текста, только стиль и форматирование.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Перепиши этот текст красиво, с эмодзи и правильным форматированием:\n\n"${text}"`,
    },
  ];

  return chatCompletion(messages, {
    model: 'GigaChat-2',
    temperature: 0.7,
    max_tokens: 2000,
  });
}

export {
  getAccessToken,
  getStudentAssistance,
  analyzeAnswer,
  generateContent,
  explainTerm,
  checkCode,
  generateExercises,
  summarizeContent,
  getLearningRecommendations,
  explainSimply,
  generateQuizQuestions,
  reviewSubmission,
  translateContent,
  searchCourseContent,
  generateLabInstructions,
  improveText,
};

