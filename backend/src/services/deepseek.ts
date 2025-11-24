import OpenAI from 'openai';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-3978606fbaba4866b21f6c5579516092';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

// Initialize OpenAI client for DeepSeek API
// DeepSeek API is compatible with OpenAI API format
const client = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: DEEPSEEK_BASE_URL,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: 'deepseek-chat' | 'deepseek-reasoner';
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Send a chat completion request to DeepSeek API
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  try {
    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      max_tokens = 2000,
      stream = false,
    } = options;

    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature,
      max_tokens,
      stream,
    });

    if (stream && typeof response === 'object' && 'asyncIterator' in response) {
      // Handle streaming response
      let fullContent = '';
      for await (const chunk of response as any) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
      }
      return fullContent;
    }

    return (response as any).choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('DeepSeek API error:', error);
    
    // Handle specific error codes
    if (error.status === 402 || error.code === 'invalid_request_error') {
      if (error.error?.message?.includes('Balance') || error.error?.message?.includes('balance')) {
        throw new Error('Недостаточно баланса на аккаунте DeepSeek API. Пожалуйста, пополните баланс на https://platform.deepseek.com/');
      }
    }
    
    if (error.status === 401) {
      throw new Error('Неверный API ключ DeepSeek. Проверьте настройки в .env файле.');
    }
    
    if (error.status === 429) {
      throw new Error('Превышен лимит запросов к DeepSeek API. Попробуйте позже.');
    }
    
    if (error.status === 500 || error.status === 503) {
      throw new Error('Сервис DeepSeek временно недоступен. Попробуйте позже.');
    }
    
    throw new Error(error.error?.message || error.message || 'Ошибка при обращении к DeepSeek API');
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
    model: 'deepseek-chat',
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
    model: 'deepseek-chat',
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
    model: 'deepseek-chat',
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
    model: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 800,
  });
}

export default {
  chatCompletion,
  getStudentAssistance,
  analyzeAnswer,
  generateContent,
  explainTerm,
};

