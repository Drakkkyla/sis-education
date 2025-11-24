import { useQuery } from '@tanstack/react-query';
import { achievementsService } from '../services/achievements';
import { Achievement } from '../types';
import { Trophy, Award, Sparkles, TrendingUp, Lock, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const Achievements = () => {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementsService.getAll(),
  });

  const { data: myAchievements } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => achievementsService.getMy(),
  });

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300';
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300';
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300';
      case 'legendary':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
  };

  const getRarityName = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'Обычное';
      case 'rare':
        return 'Редкое';
      case 'epic':
        return 'Эпическое';
      case 'legendary':
        return 'Легендарное';
      default:
        return rarity;
    }
  };

  const getCategoryName = (category: Achievement['category']) => {
    switch (category) {
      case 'lessons':
        return 'Уроки';
      case 'quizzes':
        return 'Тесты';
      case 'courses':
        return 'Курсы';
      case 'time':
        return 'Время';
      case 'streak':
        return 'Серии';
      default:
        return category;
    }
  };

  const getRequirementText = (achievement: Achievement) => {
    const { type, value } = achievement.requirement;
    switch (type) {
      case 'lessons_completed':
        return `Завершить ${value} ${value === 1 ? 'урок' : value < 5 ? 'урока' : 'уроков'}`;
      case 'quizzes_passed':
        return `Пройдите ${value} ${value === 1 ? 'тест' : value < 5 ? 'теста' : 'тестов'}`;
      case 'courses_completed':
        return `Завершите ${value} ${value === 1 ? 'курс' : value < 5 ? 'курса' : 'курсов'}`;
      case 'time_spent':
        return `Потратьте ${value} минут на обучение`;
      case 'perfect_quiz':
        return `Пройдите тест на 100%`;
      default:
        return `Выполните требование`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600"></div>
      </div>
    );
  }

  const unlockedCount = myAchievements?.totalUnlocked || 0;
  const totalPoints = myAchievements?.totalPoints || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          Достижения
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Отслеживайте свой прогресс и получайте награды за обучение
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-2 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Разблокировано
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {unlockedCount} / {achievements?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-primary-500 to-blue-500 rounded-2xl shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card border-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Всего очков
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalPoints}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Прогресс
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {achievements?.length ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Все достижения
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements?.map((achievement) => {
            const isUnlocked = achievement.unlocked || false;
            const progress = achievement.progress || 0;

            return (
              <div
                key={achievement._id}
                className={cn(
                  'card relative overflow-hidden transition-all duration-300',
                  isUnlocked
                    ? 'border-2 border-primary-300 dark:border-primary-700 shadow-lg'
                    : 'border-2 border-gray-200 dark:border-gray-700 opacity-75'
                )}
              >
                {isUnlocked && (
                  <div className="absolute top-4 right-4">
                    <div className="p-2 bg-primary-600 rounded-full">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className={cn(
                    'text-5xl p-4 rounded-2xl',
                    isUnlocked ? '' : 'grayscale opacity-50'
                  )}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {achievement.title}
                      </h3>
                    </div>
                    <span className={cn(
                      'px-2 py-1 text-xs font-semibold rounded-lg border',
                      getRarityColor(achievement.rarity)
                    )}>
                      {getRarityName(achievement.rarity)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {achievement.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{getRequirementText(achievement)}</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {achievement.points} очков
                    </span>
                  </div>

                  {!isUnlocked && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {isUnlocked && achievement.unlockedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Разблокировано: {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;

