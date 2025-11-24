import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Bookmark from '../models/Bookmark';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Quiz from '../models/Quiz';

const router = express.Router();

// @route   GET /api/bookmarks
// @desc    Get all bookmarks for user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const bookmarks = await Bookmark.find({ user: userId })
      .populate('course', 'title description thumbnail category')
      .populate('lesson', 'title description order')
      .populate('quiz', 'title description')
      .sort({ createdAt: -1 });

    res.json(bookmarks);
  } catch (error: any) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/bookmarks
// @desc    Create bookmark
// @access  Private
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const { courseId, lessonId, quizId, note } = req.body;

    if (!courseId && !lessonId && !quizId) {
      return res.status(400).json({ message: 'Необходимо указать courseId, lessonId или quizId' });
    }

    // Проверяем существование ресурса
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Курс не найден' });
      }
    }
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Урок не найден' });
      }
    }
    if (quizId) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Тест не найден' });
      }
    }

    // Проверяем, не существует ли уже закладка
    const existing = await Bookmark.findOne({
      user: userId,
      course: courseId || null,
      lesson: lessonId || null,
      quiz: quizId || null,
    });

    if (existing) {
      return res.status(400).json({ message: 'Закладка уже существует' });
    }

    const bookmark = await Bookmark.create({
      user: userId,
      course: courseId || undefined,
      lesson: lessonId || undefined,
      quiz: quizId || undefined,
      note,
    });

    await bookmark.populate('course', 'title description thumbnail category');
    await bookmark.populate('lesson', 'title description order');
    await bookmark.populate('quiz', 'title description');

    res.status(201).json(bookmark);
  } catch (error: any) {
    console.error('Create bookmark error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Закладка уже существует' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   DELETE /api/bookmarks/:id
// @desc    Delete bookmark
// @access  Private
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Закладка не найдена' });
    }

    res.json({ message: 'Закладка удалена' });
  } catch (error: any) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/bookmarks/:id
// @desc    Update bookmark note
// @access  Private
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const { note } = req.body;

    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { note },
      { new: true }
    )
      .populate('course', 'title description thumbnail category')
      .populate('lesson', 'title description order')
      .populate('quiz', 'title description');

    if (!bookmark) {
      return res.status(404).json({ message: 'Закладка не найдена' });
    }

    res.json(bookmark);
  } catch (error: any) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

