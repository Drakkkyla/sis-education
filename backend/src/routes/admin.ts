import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Quiz from '../models/Quiz';
import Submission from '../models/Submission';
import Progress from '../models/Progress';
import User from '../models/User';

const router = express.Router();

// Configure multer for lesson photo uploads
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `lesson-photo-${uniqueSuffix}-${file.originalname}`);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = /image\/(jpeg|jpg|png|gif|webp)/i.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла. Разрешенные форматы: JPG, JPEG, PNG, GIF, WEBP'));
    }
  },
});

// All admin routes require authentication and admin/teacher role
router.use(authenticate);
router.use(authorize('admin', 'teacher'));

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin/Teacher)
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const pendingSubmissions = await Submission.countDocuments({ status: 'pending' });
    const completedProgress = await Progress.countDocuments({ completed: true });

    res.json({
      users: {
        total: totalUsers,
        students: totalStudents,
      },
      courses: {
        total: totalCourses,
        lessons: totalLessons,
      },
      submissions: {
        total: totalSubmissions,
        pending: pendingSubmissions,
      },
      progress: {
        completedLessons: completedProgress,
      },
    });
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/submissions
// @desc    Get all submissions (for review)
// @access  Private (Admin/Teacher)
router.get('/submissions', async (req: AuthRequest, res: Response) => {
  try {
    const { status, courseId, lessonId } = req.query;
    const filter: any = {};

    if (status) {
      const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
      if (validStatuses.includes(status as string)) {
        filter.status = status;
      }
    }

    if (courseId) {
      if (courseId.toString().length !== 24) {
        return res.status(400).json({ message: 'Неверный ID курса' });
      }
      filter.course = courseId;
    }

    if (lessonId) {
      if (lessonId.toString().length !== 24) {
        return res.status(400).json({ message: 'Неверный ID урока' });
      }
      filter.lesson = lessonId;
    }

    const submissions = await Submission.find(filter)
      .populate('user', 'firstName lastName username email')
      .populate('course', 'title')
      .populate('lesson', 'title')
      .populate('reviewedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error: any) {
    console.error('Get admin submissions error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/admin/submissions/:id/review
// @desc    Review submission
// @access  Private (Admin/Teacher)
router.put('/submissions/:id/review', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID работы' });
    }

    const { grade, feedback, status } = req.body;

    // Validate grade if provided
    if (grade !== undefined && (isNaN(grade) || grade < 0 || grade > 5)) {
      return res.status(400).json({ message: 'Оценка должна быть числом от 0 до 5' });
    }

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус' });
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      {
        grade: grade !== undefined ? Number(grade) : undefined,
        feedback: feedback ? String(feedback).trim() : undefined,
        status: status || 'reviewed',
        reviewedBy: String(req.user!._id),
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('user', 'firstName lastName username email')
      .populate('course', 'title')
      .populate('lesson', 'title')
      .populate('reviewedBy', 'firstName lastName username');

    if (!submission) {
      return res.status(404).json({ message: 'Работа не найдена' });
    }

    res.json(submission);
  } catch (error: any) {
    console.error('Review submission error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students with progress
// @access  Private (Admin/Teacher)
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const students = await User.find({ role: 'student', isActive: true }).select('-password').sort({ createdAt: -1 });

    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.find({ user: student._id, completed: true });
        const submissions = await Submission.find({ user: student._id });
        return {
          ...student.toObject(),
          completedLessons: progress.length,
          totalSubmissions: submissions.length,
        };
      })
    );

    res.json(studentsWithProgress);
  } catch (error: any) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/courses
// @desc    Get all courses (including unpublished)
// @access  Private (Admin/Teacher)
router.get('/courses', async (req: AuthRequest, res: Response) => {
  try {
    let filter: any = {};
    
    // Преподаватели видят только свои курсы, админы - все
    if (req.user!.role === 'teacher') {
      filter.instructor = req.user!._id;
    }
    
    const courses = await Course.find(filter)
      .populate('lessons', 'title order')
      .populate('instructor', 'username firstName lastName')
      .populate('enrolledStudents', 'username firstName lastName email group')
      .sort({ order: 1 });
    res.json(courses);
  } catch (error: any) {
    console.error('Get admin courses error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/admin/courses
// @desc    Create new course
// @access  Private (Admin/Teacher)
router.post('/courses', async (req: AuthRequest, res: Response) => {
  try {
    // Проверяем, что пользователь имеет права на создание курса
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({ message: 'Только преподаватели и администраторы могут создавать курсы' });
    }

    const { title, description, summary, category, level, thumbnail, groups, order, isPublished } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Название курса обязательно' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ message: 'Описание курса обязательно' });
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ message: 'Категория курса обязательна' });
    }
    if (!level || typeof level !== 'string' || level.trim().length === 0) {
      return res.status(400).json({ message: 'Уровень курса обязателен' });
    }

    const course = new Course({
      title,
      description,
      summary,
      category,
      level,
      thumbnail,
      groups: groups && Array.isArray(groups) ? groups : [],
      instructor: req.user!._id, // Автоматически привязываем к создателю
      enrolledStudents: [],
      order: order || 0,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : false,
      lessons: [],
    });
    await course.save();
    res.status(201).json(course);
  } catch (error: any) {
    console.error('Create course error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Private (Admin/Teacher - только создатель курса или админ)
router.put('/courses/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверка прав: только создатель курса или админ могут редактировать
    if (req.user!.role !== 'admin' && String(course.instructor) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'У вас нет прав для редактирования этого курса' });
    }

    // Не позволяем изменять instructor и enrolledStudents через обычное обновление
    const { instructor, enrolledStudents, ...updateData } = req.body;
    
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updatedCourse);
  } catch (error: any) {
    console.error('Update course error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Private (Admin/Teacher - только создатель курса или админ)
router.delete('/courses/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверка прав: только создатель курса или админ могут удалять
    if (req.user!.role !== 'admin' && String(course.instructor) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'У вас нет прав для удаления этого курса' });
    }

    // Delete all lessons in the course
    await Lesson.deleteMany({ course: req.params.id });
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Курс удален', courseId: req.params.id });
  } catch (error: any) {
    console.error('Delete course error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/lessons
// @desc    Get all lessons (including unpublished)
// @access  Private (Admin/Teacher)
router.get('/lessons', async (req: AuthRequest, res: Response) => {
  try {
    const { course } = req.query;
    const filter: any = {};

    if (course) {
      if (course.toString().length !== 24) {
        return res.status(400).json({ message: 'Неверный ID курса' });
      }
      filter.course = course;
    }

    const lessons = await Lesson.find(filter)
      .populate('course', 'title category')
      .sort({ order: 1 });

    res.json(lessons);
  } catch (error: any) {
    console.error('Get admin lessons error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/admin/lessons
// @desc    Create new lesson
// @access  Private (Admin/Teacher)
router.post('/lessons', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, content, course, order, duration, videoUrl, resources, exercises, isPublished } = req.body;

    if (!title || !description || !content || !course) {
      return res.status(400).json({ message: 'Заполните все обязательные поля' });
    }

    // Validate course ID format
    if (typeof course !== 'string' || course.length !== 24) {
      return res.status(400).json({ message: 'Неверный формат ID курса' });
    }

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    const lesson = new Lesson({
      title,
      description,
      content,
      course,
      order: order || 0,
      duration,
      videoUrl,
      resources: resources || [],
      exercises: exercises || [],
      isPublished: isPublished !== undefined ? Boolean(isPublished) : false,
    });
    await lesson.save();

    // Add lesson to course if not already added
    const lessonId = String(lesson._id);
    const courseLessons = courseExists.lessons.map((id) => String(id));
    if (!courseLessons.includes(lessonId)) {
      await Course.findByIdAndUpdate(course, {
        $push: { lessons: lesson._id },
      });
    }

    res.status(201).json(lesson);
  } catch (error: any) {
    console.error('Create lesson error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID курса' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/admin/lessons/:id
// @desc    Update lesson
// @access  Private (Admin/Teacher)
router.put('/lessons/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    res.json(lesson);
  } catch (error: any) {
    console.error('Update lesson error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   DELETE /api/admin/lessons/:id
// @desc    Delete lesson
// @access  Private (Admin/Teacher)
router.delete('/lessons/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Remove lesson from course
    const courseId = String(lesson.course);
    await Course.findByIdAndUpdate(courseId, {
      $pull: { lessons: req.params.id },
    });

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({ message: 'Урок удален', lessonId: req.params.id });
  } catch (error: any) {
    console.error('Delete lesson error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/admin/lessons/:id/photos
// @desc    Upload photos for lesson
// @access  Private (Admin/Teacher)
router.post('/lessons/:id/photos', photoUpload.array('photos', 10), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ message: 'Фотографии не загружены' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Handle multer array files
    let files: Express.Multer.File[];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      // If it's an object with fieldname keys, extract all files
      files = Object.values(req.files).flat();
    }

    if (files.length === 0) {
      return res.status(400).json({ message: 'Фотографии не загружены' });
    }

    const photoUrls = files.map((file) => `/uploads/${file.filename}`);

    // Add photos to lesson
    const existingPhotos = lesson.photos || [];
    const updatedPhotos = [...existingPhotos, ...photoUrls];

    lesson.photos = updatedPhotos;
    await lesson.save();

    res.json({ photos: updatedPhotos });
  } catch (error: any) {
    console.error('Upload lesson photos error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Файл слишком большой (максимум 10MB)' });
    }
    if (error.message && error.message.includes('Недопустимый тип файла')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка загрузки фотографий' });
  }
});

// @route   DELETE /api/admin/lessons/:id/photos/:photoIndex
// @desc    Delete photo from lesson
// @access  Private (Admin/Teacher)
router.delete('/lessons/:id/photos/:photoIndex', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID урока' });
    }

    const photoIndex = parseInt(req.params.photoIndex);
    if (isNaN(photoIndex) || photoIndex < 0) {
      return res.status(400).json({ message: 'Неверный индекс фотографии' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    const photos = lesson.photos || [];
    if (photoIndex >= photos.length) {
      return res.status(400).json({ message: 'Фотография не найдена' });
    }

    // Remove photo from array
    photos.splice(photoIndex, 1);
    lesson.photos = photos;
    await lesson.save();

    res.json({ photos });
  } catch (error: any) {
    console.error('Delete lesson photo error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка удаления фотографии' });
  }
});

// @route   POST /api/admin/quizzes
// @desc    Create new quiz
// @access  Private (Admin/Teacher)
router.post('/quizzes', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, course, lesson, questions, timeLimit, passingScore, isPublished } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Название теста обязательно' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ message: 'Описание теста обязательно' });
    }
    if (!course || typeof course !== 'string' || course.length !== 24) {
      return res.status(400).json({ message: 'Неверный формат ID курса' });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Тест должен содержать хотя бы один вопрос' });
    }

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Verify lesson exists if provided
    if (lesson) {
      if (typeof lesson !== 'string' || lesson.length !== 24) {
        return res.status(400).json({ message: 'Неверный формат ID урока' });
      }
      const lessonExists = await Lesson.findById(lesson);
      if (!lessonExists) {
        return res.status(404).json({ message: 'Урок не найден' });
      }
    }

    const quiz = new Quiz({
      title,
      description,
      course,
      lesson: lesson || undefined,
      questions,
      timeLimit,
      passingScore: passingScore || 70,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : false,
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error: any) {
    console.error('Create quiz error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/admin/quizzes/:id
// @desc    Update quiz
// @access  Private (Admin/Teacher)
router.put('/quizzes/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID теста' });
    }

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    res.json(quiz);
  } catch (error: any) {
    console.error('Update quiz error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, group, search } = req.query;
    const filter: any = {};
    
    // Преподаватели могут видеть только студентов, админы - всех
    if (req.user!.role === 'teacher') {
      filter.role = 'student';
      filter.isActive = true; // Преподаватели видят только активных студентов
    } else if (role) {
      filter.role = role;
      // Для студентов всегда показываем только активных
      if (role === 'student') {
        filter.isActive = true;
      }
    } else {
      // Если роль не указана, показываем только активных пользователей
      filter.isActive = true;
    }

    // Фильтр по группе
    if (group) {
      filter.group = group;
    }

    // Поиск по имени, логину или email
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/admin/users
// @desc    Create new user (admin only)
// @access  Private (Admin)
router.post(
  '/users',
  authorize('admin'),
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Логин должен содержать только буквы, цифры и подчеркивание (3-30 символов)'),
    body('password').isLength({ min: 6 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').isIn(['student', 'teacher', 'admin']).optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, firstName, lastName, role, group } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }

      // Check email if provided
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }
      }

      // Create new user - don't include email field if not provided
      const userData: any = {
        username: username.toLowerCase(),
        password,
        firstName: firstName || 'Пользователь',
        lastName: lastName || '',
        role: role || 'student',
      };
      // Only include email if it's actually provided
      if (email) {
        userData.email = email.toLowerCase().trim();
      }
      // Include group if provided
      if (group) {
        userData.group = group;
      }
      const user = new User(userData);

      await user.save();

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        group: user.group,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
      }
      res.status(500).json({ message: error.message || 'Ошибка сервера' });
    }
  }
);

// @route   POST /api/admin/users/bulk-count
// @desc    Create users by count (admin only)
// @access  Private (Admin)
router.post(
  '/users/bulk-count',
  authorize('admin'),
  [
    body('count').isInt({ min: 1, max: 200 }).withMessage('Количество должно быть от 1 до 200'),
    body('role').isIn(['student', 'teacher', 'admin']).optional(),
    body('defaultPassword').optional().isLength({ min: 6 }),
    body('prefix').optional().isString().isLength({ min: 1, max: 20 }),
    body('group').optional().isIn(['haitech', 'promdesign', 'promrobo', 'energy', 'bio', 'aero', 'media', 'vrar']),
    body('startFrom').optional().isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { count, role, defaultPassword, prefix, group, startFrom } = req.body;
      const userRole = role || 'student';
      const password = defaultPassword || 'student123';
      const usernamePrefix = (prefix || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const startNumber = startFrom || 1;

      const createdUsers = [];
      const errorsList = [];
      const usersToCreate: any[] = [];

      // Prepare all users first
      for (let i = 0; i < count; i++) {
        const userNumber = startNumber + i;
        // Generate unique username
        let username = `${usernamePrefix}_${userNumber}`;
        let attempts = 0;
        while (await User.findOne({ username }) && attempts < 10) {
          username = `${usernamePrefix}_${userNumber}_${Math.random().toString(36).substring(2, 6)}`;
          attempts++;
        }

        if (attempts >= 10) {
          errorsList.push({
            index: i,
            username: username,
            error: 'Не удалось создать уникальный логин',
          });
          continue;
        }

        // Prepare user data without email field
        const userData: any = {
          username: username.toLowerCase(),
          password: password,
          firstName: `Пользователь ${userNumber}`,
          lastName: '',
          role: userRole,
        };
        // Include group if provided
        if (group) {
          userData.group = group;
        }
        // Explicitly don't include email field to avoid null index issues
        usersToCreate.push(userData);
      }

      // Create users one by one to handle errors properly
      for (let i = 0; i < usersToCreate.length; i++) {
        try {
          const userData = usersToCreate[i];
          // Create user without email field
          const user = await User.create(userData);
          
          // Immediately remove email field if it was set to null by Mongoose
          if (user.email === null || user.email === undefined || user.email === '') {
            await User.updateOne({ _id: user._id }, { $unset: { email: '' } });
          }
          
          // Reload user to get clean data without null email
          const cleanUser = await User.findById(user._id);
          if (cleanUser) {
            createdUsers.push({
              _id: cleanUser._id,
              username: cleanUser.username,
              email: cleanUser.email,
              firstName: cleanUser.firstName,
              lastName: cleanUser.lastName,
              role: cleanUser.role,
              group: cleanUser.group,
              password: password,
            });
          }
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate key error - likely email index issue
            // Try to fix by removing email field and retry
            try {
              const retryUserData = usersToCreate[i];
              // Remove email from userData and try again
              const userWithoutEmail = { ...retryUserData };
              delete userWithoutEmail.email;
              const retryUser = await User.create(userWithoutEmail);
              
              // Remove email field if it was set to null
              if (retryUser.email === null || retryUser.email === undefined || retryUser.email === '') {
                await User.updateOne({ _id: retryUser._id }, { $unset: { email: '' } });
              }
              
              const cleanRetryUser = await User.findById(retryUser._id);
              if (cleanRetryUser) {
                createdUsers.push({
                  _id: cleanRetryUser._id,
                  username: cleanRetryUser.username,
                  email: cleanRetryUser.email,
                  firstName: cleanRetryUser.firstName,
                  lastName: cleanRetryUser.lastName,
                  role: cleanRetryUser.role,
                  password: password,
                });
              }
            } catch (retryError: any) {
              errorsList.push({
                index: i,
                username: usersToCreate[i].username,
                error: retryError.message || 'Ошибка создания пользователя',
              });
            }
          } else {
            errorsList.push({
              index: i,
              username: usersToCreate[i].username,
              error: error.message || 'Ошибка создания пользователя',
            });
          }
        }
      }

      res.status(201).json({
        created: createdUsers.length,
        failed: errorsList.length,
        users: createdUsers,
        errors: errorsList,
      });
    } catch (error: any) {
      console.error('Bulk create users by count error:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

// @route   POST /api/admin/users/bulk
// @desc    Create multiple users (admin only)
// @access  Private (Admin)
router.post(
  '/users/bulk',
  authorize('admin'),
  [
    body('users').isArray().notEmpty(),
    body('users.*.email').optional().isEmail().withMessage('Некорректный email адрес'),
    body('users.*.username').optional().isLength({ min: 3, max: 30 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { users, role, defaultPassword } = req.body;
      const userRole = role || 'student';
      const password = defaultPassword || 'student123';

      const createdUsers = [];
      const errorsList = [];

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        try {
          // Validate username or email
          if (!userData.username && !userData.email) {
            errorsList.push({
              index: i,
              email: userData.email || 'N/A',
              error: 'Требуется логин или email',
            });
            continue;
          }

          // Generate username from email if not provided
          let username = userData.username;
          if (!username && userData.email) {
            username = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
            // Ensure username meets requirements
            if (username.length < 3) {
              username = username + '_' + Math.random().toString(36).substring(2, 5);
            }
            if (username.length > 30) {
              username = username.substring(0, 30);
            }
          }

          const normalizedUsername = username.toLowerCase().trim();
          
          // Check if user already exists
          const existingUser = await User.findOne({ username: normalizedUsername });
          if (existingUser) {
            errorsList.push({
              index: i,
              email: userData.email || userData.username,
              error: 'Пользователь с таким логином уже существует',
            });
            continue;
          }

          // Check email if provided
          if (userData.email) {
            const normalizedEmail = userData.email.toLowerCase().trim();
            const existingEmail = await User.findOne({ email: normalizedEmail });
            if (existingEmail) {
              errorsList.push({
                index: i,
                email: userData.email,
                error: 'Пользователь с таким email уже существует',
              });
              continue;
            }
          }

          // Create user - don't include email field if not provided
          const userDataToSave: any = {
            username: normalizedUsername,
            password: userData.password || password,
            firstName: userData.firstName || 'Пользователь',
            lastName: userData.lastName || '',
            role: userData.role || userRole,
          };
          // Only include email if it's actually provided
          if (userData.email) {
            userDataToSave.email = userData.email.toLowerCase().trim();
          }
          const user = new User(userDataToSave);

          await user.save();
          createdUsers.push({
            _id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          });
        } catch (error: any) {
          errorsList.push({
            index: i,
            email: userData.email || userData.username || 'N/A',
            error: error.message || 'Ошибка создания пользователя',
          });
        }
      }

      res.status(201).json({
        created: createdUsers.length,
        failed: errorsList.length,
        users: createdUsers,
        errors: errorsList,
      });
    } catch (error: any) {
      console.error('Bulk create users error:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/users/:id', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID пользователя' });
    }

    const { firstName, lastName, role, isActive, group } = req.body;
    const updateData: any = {};

    if (firstName !== undefined) {
      updateData.firstName = firstName && firstName.trim() ? firstName.trim() : undefined;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName && lastName.trim() ? lastName.trim() : undefined;
    }
    if (role !== undefined) {
      if (!['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Недопустимая роль' });
      }
      updateData.role = role;
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }
    if (group !== undefined) {
      // Allow setting group to null/empty string to remove it
      if (group === '' || group === null) {
        // Use $unset to remove the field
        await User.findByIdAndUpdate(req.params.id, { $unset: { group: '' } });
        // Continue with other updates
      } else {
        updateData.group = group;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/admin/users/:id/reset-password
// @desc    Reset user password (admin only)
// @access  Private (Admin)
router.post(
  '/users/:id/reset-password',
  authorize('admin'),
  [
    body('newPassword').isLength({ min: 6 }).withMessage('Пароль должен быть минимум 6 символов'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.params.id || req.params.id.length !== 24) {
        return res.status(400).json({ message: 'Неверный ID пользователя' });
      }

      const { newPassword } = req.body;

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Пароль успешно изменен', userId: user._id });
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Неверный формат ID' });
      }
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/users/:id', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID пользователя' });
    }

    // Prevent deleting yourself
    if (req.params.id === String(req.user!._id)) {
      return res.status(400).json({ message: 'Нельзя удалить самого себя' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Soft delete - set isActive to false instead of deleting
    user.isActive = false;
    await user.save();

    res.json({ message: 'Пользователь деактивирован', userId: user._id });
  } catch (error: any) {
    console.error('Delete user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/courses/:id/students
// @desc    Get enrolled students for a course
// @access  Private (Admin/Teacher - только создатель курса или админ)
router.get('/courses/:id/students', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const course = await Course.findById(req.params.id).populate('enrolledStudents', 'username firstName lastName email group');
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверка прав: только создатель курса или админ могут просматривать студентов
    if (req.user!.role !== 'admin' && String(course.instructor) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'У вас нет прав для просмотра студентов этого курса' });
    }

    res.json(course.enrolledStudents);
  } catch (error: any) {
    console.error('Get course students error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/admin/courses/:id/students
// @desc    Add students to course
// @access  Private (Admin/Teacher - только создатель курса или админ)
router.post('/courses/:id/students', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Необходимо указать массив ID студентов' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверка прав: только создатель курса или админ могут добавлять студентов
    if (req.user!.role !== 'admin' && String(course.instructor) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'У вас нет прав для управления студентами этого курса' });
    }

    // Проверяем, что все ID валидны
    const validStudentIds = studentIds.filter((id: string) => id && id.length === 24);
    if (validStudentIds.length === 0) {
      return res.status(400).json({ message: 'Неверные ID студентов' });
    }

    // Проверяем, что студенты существуют и имеют роль student
    const students = await User.find({
      _id: { $in: validStudentIds },
      role: 'student',
      isActive: true,
    });

    if (students.length !== validStudentIds.length) {
      return res.status(400).json({ message: 'Некоторые студенты не найдены или неактивны' });
    }

    // Добавляем студентов (исключаем дубликаты)
    const existingIds = course.enrolledStudents.map((id) => String(id));
    const newStudentIds = validStudentIds.filter((id: string) => !existingIds.includes(id));
    
    if (newStudentIds.length > 0) {
      course.enrolledStudents.push(...newStudentIds);
      await course.save();
    }

    const updatedCourse = await Course.findById(req.params.id).populate('enrolledStudents', 'username firstName lastName email group');
    res.json(updatedCourse!.enrolledStudents);
  } catch (error: any) {
    console.error('Add course students error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   DELETE /api/admin/courses/:id/students/:studentId
// @desc    Remove student from course
// @access  Private (Admin/Teacher - только создатель курса или админ)
router.delete('/courses/:id/students/:studentId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }
    if (!req.params.studentId || req.params.studentId.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID студента' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверка прав: только создатель курса или админ могут удалять студентов
    if (req.user!.role !== 'admin' && String(course.instructor) !== String(req.user!._id)) {
      return res.status(403).json({ message: 'У вас нет прав для управления студентами этого курса' });
    }

    // Удаляем студента из списка
    course.enrolledStudents = course.enrolledStudents.filter(
      (id) => String(id) !== req.params.studentId
    );
    await course.save();

    const updatedCourse = await Course.findById(req.params.id).populate('enrolledStudents', 'username firstName lastName email group');
    res.json(updatedCourse!.enrolledStudents);
  } catch (error: any) {
    console.error('Remove course student error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/admin/courses/my
// @desc    Get courses created by current teacher
// @access  Private (Teacher)
router.get('/courses/my', async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ instructor: req.user!._id })
      .populate('lessons', 'title order')
      .populate('enrolledStudents', 'username firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error: any) {
    console.error('Get my courses error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

