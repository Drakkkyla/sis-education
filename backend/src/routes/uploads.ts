import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import Submission from '../models/Submission';
import Lesson from '../models/Lesson';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types for educational submissions
    const allowedExtensions = /\.(pdf|doc|docx|zip|rar|txt|jpg|jpeg|png|pkt|pptx|ppt|xls|xlsx)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname));
    
    // More lenient mimetype check since some files might have generic mimetypes
    const allowedMimeTypes = /(pdf|msword|document|zip|compressed|text|image|powerpoint|spreadsheet|application\/octet-stream)/i;
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла. Разрешенные форматы: PDF, DOC, DOCX, ZIP, RAR, TXT, JPG, PNG, PKT, PPT, PPTX, XLS, XLSX'));
    }
  },
});

// @route   POST /api/uploads
// @desc    Upload submission file
// @access  Private
router.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не загружен' });
      }

      const { courseId, lessonId, exerciseIndex } = req.body;

      if (!courseId || !lessonId) {
        return res.status(400).json({ message: 'Требуется ID курса и урока' });
      }

      // Verify lesson exists
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Урок не найден' });
      }

      // Verify course matches lesson
      if (String(lesson.course) !== String(courseId)) {
        return res.status(400).json({ message: 'Урок не принадлежит указанному курсу' });
      }

      const submission = new Submission({
        user: String(req.user!._id),
        course: courseId,
        lesson: lessonId,
        exerciseIndex: exerciseIndex ? parseInt(exerciseIndex) : undefined,
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: 'pending',
      });

      await submission.save();

      res.status(201).json(submission);
    } catch (error: any) {
      console.error('Upload error:', error);
      // Handle multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой' });
      }
      if (error.message === 'Недопустимый тип файла') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Ошибка загрузки файла' });
    }
  }
);

// @route   GET /api/uploads
// @desc    Get user submissions
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, lessonId } = req.query;
    const filter: any = { user: String(req.user!._id) };

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
      .populate('course', 'title')
      .populate('lesson', 'title')
      .populate('reviewedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/uploads/:id
// @desc    Get single submission
// @access  Private
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID работы' });
    }

    const submission = await Submission.findById(req.params.id)
      .populate('course', 'title')
      .populate('lesson', 'title')
      .populate('reviewedBy', 'firstName lastName username');

    if (!submission) {
      return res.status(404).json({ message: 'Работа не найдена' });
    }

    // Check if user owns the submission or is teacher/admin
    const userId = String(req.user!._id);
    const submissionUserId = String(submission.user);
    
    if (
      submissionUserId !== userId &&
      req.user!.role !== 'teacher' &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    res.json(submission);
  } catch (error: any) {
    console.error('Get submission error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

