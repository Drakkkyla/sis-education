import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAchievement extends Document {
  user: mongoose.Types.ObjectId;
  achievement: mongoose.Types.ObjectId;
  unlockedAt: Date;
  progress?: number; // текущий прогресс к достижению (0-100)
  createdAt: Date;
  updatedAt: Date;
}

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
    },
    unlockedAt: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index для быстрого поиска достижений пользователя
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, unlockedAt: -1 });

export default mongoose.model<IUserAchievement>('UserAchievement', userAchievementSchema);

