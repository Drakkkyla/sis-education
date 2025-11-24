import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  quiz?: mongoose.Types.ObjectId;
  note?: string; // заметка пользователя
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index для быстрого поиска закладок пользователя
bookmarkSchema.index({ user: 1, createdAt: -1 });
// Уникальность: один пользователь может добавить один ресурс только один раз
bookmarkSchema.index({ user: 1, course: 1, lesson: 1, quiz: 1 }, { 
  unique: true,
  partialFilterExpression: {
    $or: [
      { course: { $exists: true } },
      { lesson: { $exists: true } },
      { quiz: { $exists: true } }
    ]
  }
});

export default mongoose.model<IBookmark>('Bookmark', bookmarkSchema);

