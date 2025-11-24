import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';
import { checkAchievements } from '../services/achievementService';

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get all quizzes (optional filter by course or lesson)
// @access  Public
router.get('/', async (req: express.Request, res: Response) => {
  try {
    const { course, lesson } = req.query;
    const filter: any = { isPublished: true };

    if (course) {
      filter.course = course;
    }
    if (lesson) {
      filter.lesson = lesson;
    }

    const quizzes = await Quiz.find(filter)
      .populate('course', 'title')
      .populate('lesson', 'title')
      .select('-questions');

    res.json(quizzes);
  } catch (error: any) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get single quiz (without correct answers for students)
// @access  Public
router.get('/:id', async (req: express.Request, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID теста' });
    }

    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title')
      .populate('lesson', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: 'Тест недоступен' });
    }

    // Remove correct answers for students
    const quizData = quiz.toObject();
    if (quizData.questions && Array.isArray(quizData.questions)) {
      quizData.questions = quizData.questions.map((q: any) => {
        const { correctAnswers, ...questionWithoutAnswer } = q;
        return questionWithoutAnswer;
      });
    }

    res.json(quizData);
  } catch (error: any) {
    console.error('Get quiz error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers
// @access  Private
router.post('/:id/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID теста' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({ message: 'Тест недоступен' });
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({ message: 'Тест не содержит вопросов' });
    }

    const { answers, timeSpent } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Неверный формат ответов' });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({ 
        message: `Ожидается ${quiz.questions.length} ответов, получено ${answers.length}` 
      });
    }

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    const processedAnswers = quiz.questions.map((question, index) => {
      maxScore += question.points;
      const userAnswer = answers[index];
      let isCorrect = false;
      let points = 0;

      if (question.type === 'single' || question.type === 'multiple') {
        if (!userAnswer) {
          isCorrect = false;
        } else {
          const correctAnswers = Array.isArray(question.correctAnswers)
            ? question.correctAnswers
            : [question.correctAnswers];
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          
          // Filter out empty answers
          const filteredUserAnswers = userAnswers.filter((ans) => ans && ans.toString().trim() !== '');
          
          isCorrect =
            correctAnswers.length === filteredUserAnswers.length &&
            correctAnswers.every((ans) => filteredUserAnswers.includes(ans));
        }
      } else if (question.type === 'text') {
        // For text answers, case-insensitive comparison
        if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim() === '') {
          isCorrect = false;
        } else {
          const correctAnswer = Array.isArray(question.correctAnswers)
            ? question.correctAnswers[0]
            : question.correctAnswers;
          isCorrect =
            userAnswer.toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
        }
      }

      if (isCorrect) {
        points = question.points;
        totalScore += points;
      }

      return {
        questionId: question._id ? String(question._id) : `question-${index}`,
        answer: userAnswer,
        isCorrect,
        points,
      };
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Save result
    const result = new QuizResult({
      user: String(req.user!._id),
      quiz: String(quiz._id),
      course: String(quiz.course),
      answers: processedAnswers,
      score: totalScore,
      percentage: Math.round(percentage),
      passed,
      timeSpent,
      completedAt: new Date(),
    });

    await result.save();

    // Проверяем достижения, если тест пройден впервые
    if (passed) {
      checkAchievements(String(req.user!._id)).catch(err => {
        console.error('Error checking achievements:', err);
      });
    }

    res.json({
      result: {
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage),
        passed,
        answers: processedAnswers,
      },
      quiz: {
        questions: quiz.questions.map((q, idx) => ({
          _id: q._id ? String(q._id) : `question-${idx}`,
          question: q.question,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          points: q.points,
        })),
      },
    });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/quizzes/:id/results
// @desc    Get quiz results for user
// @access  Private
router.get('/:id/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const results = await QuizResult.find({
      user: String(req.user!._id),
      quiz: req.params.id,
    })
      .sort({ completedAt: -1 })
      .limit(10);

    res.json(results);
  } catch (error: any) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

