import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import Notification from '../models/Notification';
import Progress from '../models/Progress';
import QuizResult from '../models/QuizResult';
import Course from '../models/Course';

export async function checkAchievements(userId: string): Promise<any[]> {
  const achievements = await Achievement.find({ isActive: true });
  const newlyUnlocked: any[] = [];

  for (const achievement of achievements) {
    // Проверяем, не разблокировано ли уже
    const existing = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id,
      unlockedAt: { $exists: true },
    });

    if (existing) continue;

    // Вычисляем прогресс
    const progress = await calculateAchievementProgress(userId, achievement);

    // Проверяем, достигнуто ли требование
    if (progress >= 100) {
      // Создаем или обновляем запись
      await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: achievement._id },
        {
          user: userId,
          achievement: achievement._id,
          unlockedAt: new Date(),
          progress: 100,
        },
        { upsert: true, new: true }
      );

      // Создаем уведомление
      await Notification.create({
        user: userId,
        type: 'achievement',
        title: 'Новое достижение! 🏆',
        message: `Вы получили достижение "${achievement.title}"! ${achievement.description}`,
        link: `/achievements`,
      });

      newlyUnlocked.push(achievement);
    } else {
      // Обновляем прогресс
      await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: achievement._id },
        {
          user: userId,
          achievement: achievement._id,
          progress,
        },
        { upsert: true, new: true }
      );
    }
  }

  return newlyUnlocked;
}

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

