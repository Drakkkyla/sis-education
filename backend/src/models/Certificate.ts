import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  certificateNumber: string; // Уникальный номер сертификата
  issuedAt: Date;
  completedAt: Date; // Дата завершения курса
  grade?: number; // Средняя оценка по курсу (если есть)
  pdfUrl?: string; // URL к сгенерированному PDF (если храним на сервере)
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
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
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    pdfUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index для быстрого поиска сертификатов пользователя
certificateSchema.index({ user: 1, course: 1 }, { unique: true });
certificateSchema.index({ user: 1, issuedAt: -1 });
// certificateNumber уже имеет unique: true, что создает индекс автоматически

// Генерация уникального номера сертификата
certificateSchema.pre('save', async function (next) {
  if (!this.certificateNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.certificateNumber = `CERT-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model<ICertificate>('Certificate', certificateSchema);

