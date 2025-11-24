import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  _id?: mongoose.Types.ObjectId | string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  correctAnswers: string[] | string;
  points: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  questions: IQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['single', 'multiple', 'text'],
      required: true,
    },
    options: [
      {
        type: String,
      },
    ],
    correctAnswers: {
      type: Schema.Types.Mixed,
      required: true,
    },
    points: {
      type: Number,
      default: 1,
    },
    explanation: {
      type: String,
    },
  },
  {
    _id: true, // Explicitly enable _id for subdocuments
  }
);

const quizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    questions: [questionSchema],
    timeLimit: {
      type: Number,
    },
    passingScore: {
      type: Number,
      default: 70,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuiz>('Quiz', quizSchema);

