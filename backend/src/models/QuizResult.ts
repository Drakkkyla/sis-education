import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
}

export interface IQuizResult extends Document {
  user: mongoose.Types.ObjectId;
  quiz: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  percentage: number;
  passed: boolean;
  timeSpent?: number; // in minutes
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>({
  questionId: {
    type: String,
    required: true,
  },
  answer: {
    type: Schema.Types.Mixed,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
});

const quizResultSchema = new Schema<IQuizResult>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeSpent: {
      type: Number,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
quizResultSchema.index({ user: 1, quiz: 1 });

export default mongoose.model<IQuizResult>('QuizResult', quizResultSchema);

