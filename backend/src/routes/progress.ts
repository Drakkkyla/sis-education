import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Progress from '../models/Progress';
import Course from '../models/Course';

const router = express.Router();

// @route   GET /api/progress
// @desc    Get all progress for user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const progress = await Progress.find({ user: String(req.user!._id) })
      .populate('course', 'title category')
      .populate('lesson', 'title order')
      .sort({ updatedAt: -1 });

    res.json(progress);
  } catch (error: any) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/progress/stats
// @desc    Get learning statistics for user
// @access  Private
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const completedProgress = await Progress.find({
      user: userId,
      completed: true,
    })
      .populate('course', 'title')
      .populate('lesson', 'title');

    const totalCourses = await Course.countDocuments({ isPublished: true });
    const coursesWithProgress = await Progress.distinct('course', {
      user: userId,
    });

    const totalLessonsCompleted = completedProgress.length;
    const totalTimeSpent = completedProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    res.json({
      totalCourses,
      coursesStarted: coursesWithProgress.length,
      totalLessonsCompleted,
      totalTimeSpent,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

