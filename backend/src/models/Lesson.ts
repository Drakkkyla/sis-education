import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description: string;
  content: string;
  course: mongoose.Types.ObjectId;
  order: number;
  duration?: number; // in minutes
  videoUrl?: string;
  resources?: string[]; // URLs to resources
  exercises?: {
    title: string;
    description: string;
    type: 'practical' | 'theoretical';
    instructions: string;
  }[];
  photos?: string[]; // URLs to photos
  photoDisplayType?: 'single' | 'carousel'; // How to display photos
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
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
    content: {
      type: String,
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
    },
    videoUrl: {
      type: String,
    },
    resources: [
      {
        type: String,
      },
    ],
    exercises: [
      {
        title: String,
        description: String,
        type: {
          type: String,
          enum: ['practical', 'theoretical'],
        },
        instructions: String,
      },
    ],
    photos: [
      {
        type: String,
      },
    ],
    photoDisplayType: {
      type: String,
      enum: ['single', 'carousel'],
      default: 'single',
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

export default mongoose.model<ILesson>('Lesson', lessonSchema);

