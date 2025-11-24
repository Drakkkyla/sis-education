import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Achievement from '../models/Achievement';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sis-education';

const achievements = [
  {
    title: 'Первый шаг',
    description: 'Завершите свой первый урок',
    icon: '🎯',
    category: 'lessons',
    requirement: { type: 'lessons_completed', value: 1 },
    points: 10,
    rarity: 'common',
  },
  {
    title: 'Ученик',
    description: 'Завершите 5 уроков',
    icon: '📚',
    category: 'lessons',
    requirement: { type: 'lessons_completed', value: 5 },
    points: 25,
    rarity: 'common',
  },
  {
    title: 'Студент',
    description: 'Завершите 10 уроков',
    icon: '🎓',
    category: 'lessons',
    requirement: { type: 'lessons_completed', value: 10 },
    points: 50,
    rarity: 'rare',
  },
  {
    title: 'Мастер обучения',
    description: 'Завершите 25 уроков',
    icon: '🌟',
    category: 'lessons',
    requirement: { type: 'lessons_completed', value: 25 },
    points: 100,
    rarity: 'epic',
  },
  {
    title: 'Легенда',
    description: 'Завершите 50 уроков',
    icon: '👑',
    category: 'lessons',
    requirement: { type: 'lessons_completed', value: 50 },
    points: 250,
    rarity: 'legendary',
  },
  {
    title: 'Первый тест',
    description: 'Пройдите свой первый тест',
    icon: '✅',
    category: 'quizzes',
    requirement: { type: 'quizzes_passed', value: 1 },
    points: 15,
    rarity: 'common',
  },
  {
    title: 'Тестировщик',
    description: 'Пройдите 5 тестов',
    icon: '📝',
    category: 'quizzes',
    requirement: { type: 'quizzes_passed', value: 5 },
    points: 40,
    rarity: 'common',
  },
  {
    title: 'Эксперт по тестам',
    description: 'Пройдите 10 тестов',
    icon: '💯',
    category: 'quizzes',
    requirement: { type: 'quizzes_passed', value: 10 },
    points: 75,
    rarity: 'rare',
  },
  {
    title: 'Идеальный результат',
    description: 'Пройдите тест на 100%',
    icon: '🏆',
    category: 'quizzes',
    requirement: { type: 'perfect_quiz', value: 1 },
    points: 50,
    rarity: 'epic',
  },
  {
    title: 'Первый курс',
    description: 'Завершите свой первый курс',
    icon: '📖',
    category: 'courses',
    requirement: { type: 'courses_completed', value: 1 },
    points: 100,
    rarity: 'rare',
  },
  {
    title: 'Многопрофильный',
    description: 'Завершите 3 курса',
    icon: '🎯',
    category: 'courses',
    requirement: { type: 'courses_completed', value: 3 },
    points: 200,
    rarity: 'epic',
  },
  {
    title: 'Время инвестировано',
    description: 'Потратьте 60 минут на обучение',
    icon: '⏰',
    category: 'time',
    requirement: { type: 'time_spent', value: 60 },
    points: 30,
    rarity: 'common',
  },
  {
    title: 'Усердный ученик',
    description: 'Потратьте 300 минут на обучение',
    icon: '🔥',
    category: 'time',
    requirement: { type: 'time_spent', value: 300 },
    points: 100,
    rarity: 'rare',
  },
  {
    title: 'Мастер времени',
    description: 'Потратьте 1000 минут на обучение',
    icon: '⏳',
    category: 'time',
    requirement: { type: 'time_spent', value: 1000 },
    points: 300,
    rarity: 'epic',
  },
];

async function seedAchievements() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Удаляем существующие достижения (опционально)
    // await Achievement.deleteMany({});
    // console.log('Cleared existing achievements');

    let created = 0;
    let updated = 0;

    for (const achievementData of achievements) {
      const existing = await Achievement.findOne({ title: achievementData.title });
      
      if (existing) {
        await Achievement.updateOne(
          { title: achievementData.title },
          { $set: achievementData }
        );
        updated++;
        console.log(`Updated: ${achievementData.title}`);
      } else {
        await Achievement.create(achievementData);
        created++;
        console.log(`Created: ${achievementData.title}`);
      }
    }

    console.log(`\n✅ Seeding completed!`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total: ${achievements.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
}

seedAchievements();

