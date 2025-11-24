import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Progress from '../models/Progress';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses (filtered by user group if authenticated)
// @access  Public/Authenticated
router.get('/', async (req: express.Request | AuthRequest, res: Response) => {
  try {
    const { category, level } = req.query;
    const filter: any = { isPublished: true };

    if (category) {
      filter.category = category;
    }
    if (level) {
      filter.level = level;
    }

    // Если пользователь авторизован, фильтруем по его группе и зачислению
    const authReq = req as AuthRequest;
    if (authReq.header && authReq.header('Authorization')) {
      try {
        const token = authReq.header('Authorization')?.replace('Bearer ', '');
        if (token) {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET: string = process.env.JWT_SECRET || 'secret';
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          const user = await User.findById(decoded.userId).select('-password');
          
          if (user) {
            if (user.role === 'admin') {
              // Админы видят все курсы
            } else if (user.role === 'teacher') {
              // Преподаватели видят свои курсы и курсы, где они зачислены
              filter.$or = [
                { instructor: user._id },
                { enrolledStudents: user._id },
                { groups: { $size: 0 } }, // Курсы без привязки к группам доступны всем
              ];
              // Если есть группа, также показываем курсы для этой группы
              if (user.group) {
                filter.$or.push({ groups: { $in: [user.group] } });
              }
            } else if (user.role === 'student') {
              // Студенты видят только курсы, где они зачислены
              filter.$or = [
                { enrolledStudents: user._id },
                { groups: { $size: 0 } }, // Курсы без привязки к группам доступны всем
              ];
              // Если есть группа, также показываем курсы для этой группы
              if (user.group) {
                filter.$or.push({ groups: { $in: [user.group] } });
              }
            }
          }
        }
      } catch (err) {
        // Если токен невалиден, продолжаем как неавторизованный пользователь
      }
    }

    const courses = await Course.find(filter)
      .populate('lessons', 'title order')
      .sort({ order: 1 });

    res.json(courses);
  } catch (error: any) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course with lessons (check group access)
// @access  Public/Authenticated
router.get('/:id', async (req: express.Request | AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const course = await Course.findById(req.params.id).populate({
      path: 'lessons',
      match: { isPublished: true },
      options: { sort: { order: 1 } },
    });

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    if (!course.isPublished) {
      return res.status(403).json({ message: 'Курс недоступен' });
    }

    // Проверка доступа по группе и зачислению
    const authReq = req as AuthRequest;
    if (authReq.header && authReq.header('Authorization')) {
      try {
        const token = authReq.header('Authorization')?.replace('Bearer ', '');
        if (token) {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET: string = process.env.JWT_SECRET || 'secret';
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          const user = await User.findById(decoded.userId).select('-password');
          
          if (user) {
            if (user.role === 'admin') {
              // Админы имеют доступ ко всем курсам
            } else if (user.role === 'teacher') {
              // Преподаватели имеют доступ к своим курсам или курсам, где они зачислены
              const isInstructor = String(course.instructor) === String(user._id);
              const isEnrolled = course.enrolledStudents.some((id) => String(id) === String(user._id));
              const hasGroupAccess = !course.groups || course.groups.length === 0 || (user.group && course.groups.includes(user.group));
              
              if (!isInstructor && !isEnrolled && !hasGroupAccess) {
                return res.status(403).json({ message: 'У вас нет доступа к этому курсу' });
              }
            } else if (user.role === 'student') {
              // Студенты имеют доступ только если зачислены или курс доступен по группе
              const isEnrolled = course.enrolledStudents.some((id) => String(id) === String(user._id));
              const hasGroupAccess = !course.groups || course.groups.length === 0 || (user.group && course.groups.includes(user.group));
              
              if (!isEnrolled && !hasGroupAccess) {
                return res.status(403).json({ message: 'У вас нет доступа к этому курсу. Обратитесь к преподавателю для зачисления.' });
              }
            }
          }
        }
      } catch (err) {
        // Если токен невалиден, продолжаем как неавторизованный пользователь
        // Неавторизованные пользователи могут видеть только курсы без ограничений
        if (course.groups && course.groups.length > 0) {
          return res.status(403).json({ message: 'Для доступа к этому курсу необходима авторизация' });
        }
        if (course.enrolledStudents && course.enrolledStudents.length > 0) {
          return res.status(403).json({ message: 'Для доступа к этому курсу необходима авторизация' });
        }
      }
    } else {
      // Неавторизованные пользователи могут видеть только курсы без ограничений
      if (course.groups && course.groups.length > 0) {
        return res.status(403).json({ message: 'Для доступа к этому курсу необходима авторизация' });
      }
      if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        return res.status(403).json({ message: 'Для доступа к этому курсу необходима авторизация' });
      }
    }

    res.json(course);
  } catch (error: any) {
    console.error('Get course error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/courses/:id/progress
// @desc    Get course progress for user
// @access  Private
router.get('/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'Неверный ID курса' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    const progress = await Progress.find({
      user: String(req.user!._id),
      course: req.params.id,
      completed: true,
    });

    const completedLessons = progress.map((p) => String(p.lesson));
    const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
    const completedCount = completedLessons.length;
    const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    res.json({
      course: String(course._id),
      totalLessons,
      completedCount,
      progressPercentage: Math.round(progressPercentage),
      completedLessons,
    });
  } catch (error: any) {
    console.error('Get course progress error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

