import mongoose, { Document, Schema } from 'mongoose';

export interface ISubmission extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;
  exerciseIndex?: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  grade?: number;
  feedback?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    exerciseIndex: {
      type: Number,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending',
    },
    grade: {
      type: Number,
      min: 0,
      max: 5,
    },
    feedback: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
submissionSchema.index({ user: 1, course: 1, lesson: 1 });
submissionSchema.index({ status: 1 });

export default mongoose.model<ISubmission>('Submission', submissionSchema);

