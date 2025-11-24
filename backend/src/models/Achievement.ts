import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  title: string;
  description: string;
  icon: string; // emoji или название иконки
  category: 'lessons' | 'quizzes' | 'streak' | 'time' | 'courses' | 'special';
  requirement: {
    type: 'lessons_completed' | 'quizzes_passed' | 'streak_days' | 'time_spent' | 'courses_completed' | 'perfect_quiz' | 'custom';
    value: number; // значение для достижения требования
  };
  points: number; // очки за достижение
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      default: '🏆',
    },
    category: {
      type: String,
      enum: ['lessons', 'quizzes', 'streak', 'time', 'courses', 'special'],
      required: true,
    },
    requirement: {
      type: {
        type: String,
        enum: ['lessons_completed', 'quizzes_passed', 'streak_days', 'time_spent', 'courses_completed', 'perfect_quiz', 'custom'],
        required: true,
      },
      value: {
        type: Number,
        required: true,
        default: 1,
      },
    },
    points: {
      type: Number,
      required: true,
      default: 10,
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAchievement>('Achievement', achievementSchema);

