import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  summary?: string; // Итоговый текст курса
  category: 'network' | 'system-linux' | 'system-windows';
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnail?: string;
  groups: ('haitech' | 'promdesign' | 'promrobo' | 'energy' | 'bio' | 'aero' | 'media' | 'vrar')[];
  instructor: mongoose.Types.ObjectId; // Преподаватель/создатель курса
  enrolledStudents: mongoose.Types.ObjectId[]; // Список зачисленных студентов
  lessons: mongoose.Types.ObjectId[];
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
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
    summary: {
      type: String,
    },
    category: {
      type: String,
      enum: ['network', 'system-linux', 'system-windows'],
      required: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    thumbnail: {
      type: String,
    },
    groups: {
      type: [String],
      enum: ['haitech', 'promdesign', 'promrobo', 'energy', 'bio', 'aero', 'media', 'vrar'],
      default: [],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Для обратной совместимости со старыми курсами
    },
    enrolledStudents: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    lessons: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    order: {
      type: Number,
      default: 0,
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

export default mongoose.model<ICourse>('Course', courseSchema);

