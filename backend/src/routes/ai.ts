import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getStudentAssistance,
  analyzeAnswer,
  generateContent,
  explainTerm,
  chatCompletion,
  ChatMessage,
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
} from '../services/gigachat';
import Course from '../models/Course';
import Lesson from '../models/Lesson';

const router = express.Router();

// @route   POST /api/ai/assist
// @desc    Get AI assistance for students
// @access  Private
router.post('/assist', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { question, context } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ message: 'Вопрос обязателен' });
    }

    const response = await getStudentAssistance(question.trim(), context?.trim());

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('AI assist error:', error);
    
    // Determine status code based on error message
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при получении помощи от AI',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/analyze
// @desc    Analyze student answer
// @access  Private
router.post('/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { question, studentAnswer, correctAnswer } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ message: 'Вопрос обязателен' });
    }

    if (!studentAnswer || typeof studentAnswer !== 'string' || studentAnswer.trim().length === 0) {
      return res.status(400).json({ message: 'Ответ студента обязателен' });
    }

    const feedback = await analyzeAnswer(
      question.trim(),
      studentAnswer.trim(),
      correctAnswer?.trim()
    );

    res.json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    console.error('AI analyze error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при анализе ответа',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/generate
// @desc    Generate educational content
// @access  Private (Admin/Teacher)
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or teacher
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { topic, type, level } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ message: 'Тема обязательна' });
    }

    const validTypes = ['explanation', 'example', 'exercise', 'summary'];
    const contentType = validTypes.includes(type) ? type : 'explanation';

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    const contentLevel = validLevels.includes(level) ? level : 'intermediate';

    const content = await generateContent(topic.trim(), contentType as any, contentLevel as any);

    res.json({
      success: true,
      content,
      type: contentType,
      level: contentLevel,
    });
  } catch (error: any) {
    console.error('AI generate error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при генерации контента',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/explain
// @desc    Explain a technical term
// @access  Private
router.post('/explain', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { term } = req.body;

    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return res.status(400).json({ message: 'Термин обязателен' });
    }

    const explanation = await explainTerm(term.trim());

    res.json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    console.error('AI explain error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при объяснении термина',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/chat
// @desc    General chat with AI
// @access  Private
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Сообщения обязательны' });
    }

    // Validate messages format
    const validMessages: ChatMessage[] = messages.map((msg: any) => {
      if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
        throw new Error('Недопустимая роль в сообщении');
      }
      if (!msg.content || typeof msg.content !== 'string') {
        throw new Error('Содержимое сообщения обязательно');
      }
      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      };
    });

    const response = await chatCompletion(validMessages, {
      model: model || 'GigaChat-2',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2000,
      stream: false,
    });

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при общении с AI',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/check-code
// @desc    Check code/command for errors
// @access  Private
router.post('/check-code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ message: 'Код/команда обязательна' });
    }

    const result = await checkCode(code.trim(), language || 'bash');

    res.json({
      success: true,
      review: result,
    });
  } catch (error: any) {
    console.error('AI check code error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при проверке кода',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/generate-exercises
// @desc    Generate practice exercises
// @access  Private
router.post('/generate-exercises', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, difficulty, count } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ message: 'Тема обязательна' });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    const exerciseDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';
    const exerciseCount = typeof count === 'number' && count > 0 && count <= 20 ? count : 5;

    const exercises = await generateExercises(topic.trim(), exerciseDifficulty as any, exerciseCount);

    res.json({
      success: true,
      exercises,
      difficulty: exerciseDifficulty,
      count: exerciseCount,
    });
  } catch (error: any) {
    console.error('AI generate exercises error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при генерации заданий',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/summarize
// @desc    Summarize content
// @access  Private
router.post('/summarize', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, maxLength } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Контент обязателен' });
    }

    const length = typeof maxLength === 'number' && maxLength > 0 && maxLength <= 2000 ? maxLength : 500;

    const summary = await summarizeContent(content.trim(), length);

    res.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('AI summarize error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при создании резюме',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/recommendations
// @desc    Get personalized learning recommendations
// @access  Private
router.post('/recommendations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { completedTopics, currentLevel } = req.body;

    if (!completedTopics || !Array.isArray(completedTopics)) {
      return res.status(400).json({ message: 'Список изученных тем обязателен' });
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    const level = validLevels.includes(currentLevel) ? currentLevel : 'intermediate';

    const recommendations = await getLearningRecommendations(completedTopics, level as any);

    res.json({
      success: true,
      recommendations,
    });
  } catch (error: any) {
    console.error('AI recommendations error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при получении рекомендаций',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/explain-simply
// @desc    Explain complex concept in simple terms
// @access  Private
router.post('/explain-simply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { concept, targetAudience } = req.body;

    if (!concept || typeof concept !== 'string' || concept.trim().length === 0) {
      return res.status(400).json({ message: 'Концепция обязательна' });
    }

    const explanation = await explainSimply(concept.trim(), targetAudience || 'начинающий студент');

    res.json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    console.error('AI explain simply error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при объяснении',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/generate-quiz
// @desc    Generate quiz questions
// @access  Private (Admin/Teacher)
router.post('/generate-quiz', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or teacher
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { topic, questionCount, questionTypes } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ message: 'Тема обязательна' });
    }

    const count = typeof questionCount === 'number' && questionCount > 0 && questionCount <= 20 ? questionCount : 5;
    const validTypes = ['single', 'multiple', 'text'];
    const types = Array.isArray(questionTypes)
      ? questionTypes.filter((t) => validTypes.includes(t))
      : ['single', 'multiple'];

    const questions = await generateQuizQuestions(topic.trim(), count, types as any);

    res.json({
      success: true,
      questions,
      count,
      types: types,
    });
  } catch (error: any) {
    console.error('AI generate quiz error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при генерации вопросов',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/review-submission
// @desc    Review and grade student submission
// @access  Private (Admin/Teacher)
router.post('/review-submission', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or teacher
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { assignment, submission, criteria } = req.body;

    if (!assignment || typeof assignment !== 'string' || assignment.trim().length === 0) {
      return res.status(400).json({ message: 'Задание обязательно' });
    }

    if (!submission || typeof submission !== 'string' || submission.trim().length === 0) {
      return res.status(400).json({ message: 'Работа студента обязательна' });
    }

    const reviewCriteria = Array.isArray(criteria) ? criteria : [];

    const review = await reviewSubmission(assignment.trim(), submission.trim(), reviewCriteria);

    res.json({
      success: true,
      review,
    });
  } catch (error: any) {
    console.error('AI review submission error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при проверке работы',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/translate
// @desc    Translate content to another language
// @access  Private
router.post('/translate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, targetLanguage } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Контент обязателен' });
    }

    const translation = await translateContent(content.trim(), targetLanguage || 'русский');

    res.json({
      success: true,
      translation,
      targetLanguage: targetLanguage || 'русский',
    });
  } catch (error: any) {
    console.error('AI translate error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при переводе',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/search-course
// @desc    Search and answer questions about course content
// @access  Private
router.post('/search-course', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { question, courseId, lessonId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ message: 'Вопрос обязателен' });
    }

    let courseContent = '';

    // If courseId or lessonId provided, fetch content
    if (courseId) {
      if (typeof courseId !== 'string' || courseId.length !== 24) {
        return res.status(400).json({ message: 'Неверный ID курса' });
      }

      const course = await Course.findById(courseId);
      if (course) {
        courseContent += `Курс: ${course.title}\nОписание: ${course.description}\n`;

        if (lessonId && typeof lessonId === 'string' && lessonId.length === 24) {
          const lesson = await Lesson.findById(lessonId);
          if (lesson && String(lesson.course) === courseId) {
            courseContent += `\nУрок: ${lesson.title}\nОписание: ${lesson.description}\nКонтент: ${lesson.content}\n`;
          }
        } else if (Array.isArray(course.lessons) && course.lessons.length > 0) {
          // Load all lessons for the course
          const lessons = await Lesson.find({ _id: { $in: course.lessons } }).limit(10);
          courseContent += '\nУроки курса:\n';
          lessons.forEach((lesson) => {
            courseContent += `- ${lesson.title}: ${lesson.description}\n`;
          });
        }
      }
    }

    const answer = await searchCourseContent(question.trim(), courseContent || undefined);

    res.json({
      success: true,
      answer,
      hasCourseContext: !!courseContent,
    });
  } catch (error: any) {
    console.error('AI search course error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    } else if (error.name === 'CastError') {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при поиске по курсу',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/generate-lab
// @desc    Generate lab work instructions
// @access  Private (Admin/Teacher)
router.post('/generate-lab', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or teacher
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { topic, objectives, duration } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ message: 'Тема обязательна' });
    }

    if (!objectives || !Array.isArray(objectives) || objectives.length === 0) {
      return res.status(400).json({ message: 'Цели работы обязательны' });
    }

    const labDuration = typeof duration === 'number' && duration > 0 && duration <= 300 ? duration : 60;

    const instructions = await generateLabInstructions(topic.trim(), objectives, labDuration);

    res.json({
      success: true,
      instructions,
      duration: labDuration,
    });
  } catch (error: any) {
    console.error('AI generate lab error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при генерации лабораторной работы',
      error: error.message,
    });
  }
});

// @route   POST /api/ai/generate-lesson
// @desc    Generate lesson description and content
// @access  Private (Admin/Teacher)
router.post('/generate-lesson', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or teacher
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { title, courseId, level, type } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Название урока обязательно' });
    }

    // Get course info if courseId provided
    let courseInfo = '';
    if (courseId) {
      if (typeof courseId !== 'string' || courseId.length !== 24) {
        return res.status(400).json({ message: 'Неверный ID курса' });
      }
      const course = await Course.findById(courseId);
      if (course) {
        courseInfo = `Курс: ${course.title}. Категория: ${course.category}. Уровень: ${course.level}.`;
      }
    }

    const lessonLevel = level || 'intermediate';
    const contentType = type || 'full'; // 'description', 'content', 'full'

    // Generate lesson content using chat
    const systemPrompt = `Ты - эксперт по созданию образовательного контента для уроков по сетевому и системному администрированию.
Твоя задача - создавать качественный, понятный и структурированный контент для студентов.
Используй HTML разметку для форматирования (заголовки h2, h3, параграфы p, списки ul/li, блоки кода pre/code).
Контент должен быть интересным, понятным и мотивирующим для изучения.`;

    const generateDescription = async () => {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        {
          role: 'user' as const,
          content: `Создай краткое описание урока (2-3 предложения) для урока "${title}". ${courseInfo}
Описание должно быть интересным и мотивирующим, объяснять что студент узнает из этого урока.`,
        },
      ];
      return chatCompletion(messages, {
        model: 'GigaChat-2',
        temperature: 0.8,
        max_tokens: 200,
      });
    };

    const generateContent = async () => {
      const levelDescriptions = {
        beginner: 'для начинающих, используй простой язык и много примеров',
        intermediate: 'для среднего уровня, можно использовать технические термины с объяснениями',
        advanced: 'для продвинутого уровня, можно использовать сложные технические термины',
      };

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        {
          role: 'user' as const,
          content: `Создай полное содержание урока "${title}". ${courseInfo}
Уровень сложности: ${levelDescriptions[lessonLevel as keyof typeof levelDescriptions] || levelDescriptions.intermediate}.

Контент должен включать:
1. Введение в тему
2. Основные концепции и теорию
3. Практические примеры с командами/кодом (если применимо)
4. Пошаговые инструкции (если применимо)
5. Важные моменты для запоминания

Используй HTML разметку:
- Заголовки h2, h3 для разделов
- Параграфы p для текста
- Списки ul/li для перечислений
- Блоки кода pre/code для команд и конфигураций
- Выделение важного текста strong, em

Контент должен быть подробным, структурированным и интересным для чтения.`,
        },
      ];
      return chatCompletion(messages, {
        model: 'GigaChat-2-Max',
        temperature: 0.8,
        max_tokens: 4000,
      });
    };

    let description = '';
    let content = '';

    if (contentType === 'description' || contentType === 'full') {
      description = await generateDescription();
    }

    if (contentType === 'content' || contentType === 'full') {
      content = await generateContent();
    }

    res.json({
      success: true,
      description,
      content,
    });
  } catch (error: any) {
    console.error('AI generate lesson error:', error);
    
    let statusCode = 500;
    if (error.message?.includes('баланс') || error.message?.includes('средств') || error.message?.includes('доступ запрещен')) {
      statusCode = 402;
    } else if (error.message?.includes('Authorization Key') || error.message?.includes('ключ') || error.message?.includes('токен')) {
      statusCode = 401;
    } else if (error.message?.includes('лимит') || error.message?.includes('limit')) {
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Ошибка при генерации урока',
      error: error.message,
    });
  }
});

export default router;

