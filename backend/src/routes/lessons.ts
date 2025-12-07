import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Lesson from '../models/Lesson';
import Course from '../models/Course';
import Progress from '../models/Progress';
import Submission from '../models/Submission';
import { checkAchievements } from '../services/achievementService';
// import { checkAndIssueCertificate } from '../services/certificateService'; // Временно отключено

const router = express.Router();

// @route   GET /api/lessons
// @desc    Get all lessons (optional filter by course)
// @access  Public
router.get('/', async (req: express.Request, res: Response) => {
  try {
    const { course } = req.query;
    // Allow seeing all lessons for admins, or only published for public
    // But for now let's keep it simple: simple list is public if needed, but usually filtered by course
    // If request comes from admin panel, we might want to see drafts too.
    // Let's assume public access gets only published.
    
    // Check if user is admin (this logic is complex without auth middleware on public route)
    // For now, let's return only published for public route.
    // If admin wants to see all, they should use a different route or we should check auth header here manually.
    
    const filter: any = { isPublished: true };

    if (course) {
      filter.course = course;
    }

    const lessons = await Lesson.find(filter)
      .populate('course', 'title category')
      .sort({ order: 1 });

    res.json(lessons);
  } catch (error: any) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/lessons
// @desc    Create new lesson
// @access  Private (Admin/Teacher)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ message: 'Нет прав доступа' });
    }

    const { title, description, content, course: courseId, isPublished, order } = req.body;

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Get max order if not provided
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const lastLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
      lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = new Lesson({
      title,
      description,
      content,
      course: courseId,
      isPublished: isPublished || false,
      order: lessonOrder,
    });

    await lesson.save();

    // Add lesson to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { lessons: lesson._id }
    });

    res.status(201).json(lesson);
  } catch (error: any) {
    console.error('Create lesson error:', error);
    res.status(500).json({ message: 'Ошибка при создании урока', error: error.message });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update lesson
// @access  Private (Admin/Teacher)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({ message: 'Нет прав доступа' });
    }

    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Update fields
    const fields = ['title', 'description', 'content', 'isPublished', 'order', 'videoUrl', 'duration'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        (lesson as any)[field] = req.body[field];
      }
    });

    // Update photos/resources/exercises if provided (handling arrays)
    if (req.body.exercises) lesson.exercises = req.body.exercises;
    if (req.body.resources) lesson.resources = req.body.resources;
    if (req.body.photos) lesson.photos = req.body.photos;

    await lesson.save();

    res.json(lesson);
  } catch (error: any) {
    console.error('Update lesson error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении урока', error: error.message });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson
// @access  Public
router.get('/:id', async (req: express.Request, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const lesson = await Lesson.findById(req.params.id).populate('course', 'title category level');

    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    if (!lesson.isPublished) {
      return res.status(403).json({ message: 'Урок недоступен' });
    }

    res.json(lesson);
  } catch (error: any) {
    console.error('Get lesson error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/lessons/:id/complete
// @desc    Mark lesson as completed
// @access  Private
router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    const userId = String(req.user!._id);
    const courseId = String(lesson.course);
    const lessonId = String(lesson._id);

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем наличие практических заданий
    const exercises = lesson.exercises || [];
    
    // Находим индексы практических заданий среди всех заданий
    const practicalExerciseIndices = exercises
      .map((ex: any, index: number) => ex.type === 'practical' ? index : -1)
      .filter((idx: number) => idx !== -1);
    
    // Если есть практические задания, проверяем их выполнение
    if (practicalExerciseIndices.length > 0) {
      // Проверяем, загружены ли все практические задания
      const submissions = await Submission.find({
        user: userId,
        course: courseId,
        lesson: lessonId,
      });

      // Получаем индексы загруженных заданий
      const submittedIndices = submissions
        .map((s) => s.exerciseIndex)
        .filter((idx) => idx !== undefined && idx !== null) as number[];

      // Проверяем, что все практические задания загружены
      const missingExercises = practicalExerciseIndices.filter((idx) => !submittedIndices.includes(idx));

      if (missingExercises.length > 0) {
        return res.status(400).json({
          message: `Для завершения урока необходимо выполнить все практические задания. Не выполнено заданий: ${missingExercises.map((idx) => idx + 1).join(', ')}`,
          missingExercises: missingExercises,
        });
      }
    }

    // Проверяем, был ли урок уже завершен
    const existingProgress = await Progress.findOne({
      user: userId,
      course: courseId,
      lesson: lessonId,
      completed: true,
    });

    const progress = await Progress.findOneAndUpdate(
      {
        user: userId,
        course: courseId,
        lesson: lessonId,
      },
      {
        user: userId,
        course: courseId,
        lesson: lessonId,
        completed: true,
        completedAt: new Date(),
        timeSpent: req.body.timeSpent || 0,
      },
      { upsert: true, new: true }
    );

    // Проверяем достижения, если урок был завершен впервые
    if (!existingProgress) {
      // Запускаем проверку достижений асинхронно (не блокируем ответ)
      checkAchievements(userId).catch(err => {
        console.error('Error checking achievements:', err);
      });

      // Сертификаты временно отключены
      // checkAndIssueCertificate(userId, courseId).catch(err => {
      //   console.error('Error checking certificate:', err);
      // });
    }

    res.json(progress);
  } catch (error: any) {
    console.error('Complete lesson error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/lessons/:id/progress
// @desc    Get lesson progress for user
// @access  Private
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const progress = await Progress.findOne({
      user: String(req.user!._id),
      lesson: req.params.id,
    });

    res.json(progress || { completed: false });
  } catch (error: any) {
    console.error('Get lesson progress error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

