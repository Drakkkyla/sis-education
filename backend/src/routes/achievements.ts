import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import Progress from '../models/Progress';
import QuizResult from '../models/QuizResult';
import Course from '../models/Course';
import { checkAchievements } from '../services/achievementService';

const router = express.Router();

// @route   GET /api/achievements
// @desc    Get all achievements
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ points: -1 });
    const userId = String(req.user!._id);

    // Получаем достижения пользователя
    const userAchievements = await UserAchievement.find({ user: userId });
    const unlockedAchievementIds = new Set(
      userAchievements
        .filter(ua => ua.unlockedAt)
        .map(ua => String(ua.achievement))
    );

    // Получаем прогресс по достижениям
    const achievementsWithProgress = await Promise.all(
      achievements.map(async (achievement) => {
        const userAchievement = userAchievements.find(
          ua => String(ua.achievement) === String(achievement._id)
        );

        let progress = 0;
        if (!userAchievement || !userAchievement.unlockedAt) {
          // Вычисляем прогресс
          progress = await calculateAchievementProgress(userId, achievement);
        } else {
          progress = userAchievement.progress || 100;
        }

        return {
          ...achievement.toObject(),
          unlocked: !!userAchievement?.unlockedAt,
          unlockedAt: userAchievement?.unlockedAt,
          progress,
        };
      })
    );

    res.json(achievementsWithProgress);
  } catch (error: any) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/achievements/my
// @desc    Get user's achievements
// @access  Private
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const userAchievements = await UserAchievement.find({ user: userId })
      .populate('achievement')
      .sort({ unlockedAt: -1 });

    const unlocked = userAchievements.filter(ua => ua.unlockedAt);
    const inProgress = userAchievements.filter(ua => !ua.unlockedAt);

    // Подсчитываем общие очки
    const totalPoints = unlocked.reduce((sum, ua) => {
      const achievement = ua.achievement as any;
      return sum + (achievement?.points || 0);
    }, 0);

    res.json({
      unlocked: unlocked.map(ua => ({
        ...ua.toObject(),
        achievement: ua.achievement,
      })),
      inProgress: inProgress.map(ua => ({
        ...ua.toObject(),
        achievement: ua.achievement,
      })),
      totalPoints,
      totalUnlocked: unlocked.length,
    });
  } catch (error: any) {
    console.error('Get my achievements error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/achievements/check
// @desc    Check and unlock achievements for user
// @access  Private
router.post('/check', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user!._id);
    const newlyUnlocked = await checkAchievements(userId);
    res.json({ newlyUnlocked, count: newlyUnlocked.length });
  } catch (error: any) {
    console.error('Check achievements error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Функция для вычисления прогресса достижения
async function calculateAchievementProgress(userId: string, achievement: any): Promise<number> {
  const { type, value } = achievement.requirement;

  try {
    let current = 0;

    switch (type) {
      case 'lessons_completed':
        current = await Progress.countDocuments({
          user: userId,
          completed: true,
        });
        break;

      case 'quizzes_passed':
        current = await QuizResult.countDocuments({
          user: userId,
          passed: true,
        });
        break;

      case 'courses_completed':
        const courses = await Course.find({ isPublished: true });
        let completedCourses = 0;
        for (const course of courses) {
          const courseLessons = course.lessons || [];
          if (courseLessons.length === 0) continue;
          
          const completedLessons = await Progress.countDocuments({
            user: userId,
            course: course._id,
            completed: true,
          });
          
          if (completedLessons === courseLessons.length) {
            completedCourses++;
          }
        }
        current = completedCourses;
        break;

      case 'time_spent':
        const progressRecords = await Progress.find({ user: userId, completed: true });
        const totalMinutes = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
        current = totalMinutes;
        break;

      case 'perfect_quiz':
        current = await QuizResult.countDocuments({
          user: userId,
          passed: true,
          percentage: 100,
        });
        break;

      default:
        return 0;
    }

    const progress = Math.min(100, Math.round((current / value) * 100));
    return progress;
  } catch (error) {
    console.error('Calculate progress error:', error);
    return 0;
  }
}

export default router;

