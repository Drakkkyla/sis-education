import api from './api';

export interface AssistRequest {
  question: string;
  context?: string;
}

export interface AnalyzeRequest {
  question: string;
  studentAnswer: string;
  correctAnswer?: string;
}

export interface GenerateRequest {
  topic: string;
  type: 'explanation' | 'example' | 'exercise' | 'summary';
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ExplainRequest {
  term: string;
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: 'GigaChat-2' | 'GigaChat-2-Pro' | 'GigaChat-2-Max';
  temperature?: number;
  max_tokens?: number;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  feedback?: string;
  content?: string;
  description?: string; // For lesson generation
  explanation?: string;
  message?: string;
  review?: string;
  exercises?: string;
  summary?: string;
  recommendations?: string;
  questions?: string;
  translation?: string;
  answer?: string;
  instructions?: string;
  hasCourseContext?: boolean;
  targetLanguage?: string;
  difficulty?: string;
  count?: number;
  types?: string[];
  duration?: number;
}

export const aiService = {
  /**
   * Get AI assistance for students
   */
  assist: async (data: AssistRequest): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/assist', data);
    return response;
  },

  /**
   * Analyze student answer
   */
  analyze: async (data: AnalyzeRequest): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/analyze', data);
    return response;
  },

  /**
   * Generate educational content (Admin/Teacher only)
   */
  generate: async (data: GenerateRequest): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/generate', data);
    return response;
  },

  /**
   * Explain a technical term
   */
  explain: async (data: ExplainRequest): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/explain', data);
    return response;
  },

  /**
   * General chat with AI
   */
  chat: async (data: ChatRequest): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/chat', data);
    return response;
  },

  /**
   * Check code/command for errors
   */
  checkCode: async (code: string, language?: string): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/check-code', { code, language });
    return response;
  },

  /**
   * Generate practice exercises
   */
  generateExercises: async (topic: string, difficulty?: 'easy' | 'medium' | 'hard', count?: number): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/generate-exercises', { topic, difficulty, count });
    return response;
  },

  /**
   * Summarize content
   */
  summarize: async (content: string, maxLength?: number): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/summarize', { content, maxLength });
    return response;
  },

  /**
   * Get personalized learning recommendations
   */
  getRecommendations: async (completedTopics: string[], currentLevel?: 'beginner' | 'intermediate' | 'advanced'): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/recommendations', { completedTopics, currentLevel });
    return response;
  },

  /**
   * Explain complex concept in simple terms
   */
  explainSimply: async (concept: string, targetAudience?: string): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/explain-simply', { concept, targetAudience });
    return response;
  },

  /**
   * Generate quiz questions (Admin/Teacher only)
   */
  generateQuiz: async (topic: string, questionCount?: number, questionTypes?: ('single' | 'multiple' | 'text')[]): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/generate-quiz', { topic, questionCount, questionTypes });
    return response;
  },

  /**
   * Review and grade submission (Admin/Teacher only)
   */
  reviewSubmission: async (assignment: string, submission: string, criteria?: string[]): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/review-submission', { assignment, submission, criteria });
    return response;
  },

  /**
   * Translate content
   */
  translate: async (content: string, targetLanguage?: string): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/translate', { content, targetLanguage });
    return response;
  },

  /**
   * Search course content
   */
  searchCourse: async (question: string, courseId?: string, lessonId?: string): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/search-course', { question, courseId, lessonId });
    return response;
  },

  /**
   * Generate lab work instructions (Admin/Teacher only)
   */
  generateLab: async (topic: string, objectives: string[], duration?: number): Promise<AIResponse> => {
    const { data: response } = await api.post<AIResponse>('/ai/generate-lab', { topic, objectives, duration });
    return response;
  },

  /**
   * Generate lesson description and content (Admin/Teacher only)
   */
  generateLesson: async (
    title: string,
    courseId?: string,
    level?: 'beginner' | 'intermediate' | 'advanced',
    type?: 'description' | 'content' | 'full'
  ): Promise<AIResponse> => {
    const { data } = await api.post<AIResponse>('/ai/generate-lesson', { title, courseId, level, type });
    return data;
  },
};

