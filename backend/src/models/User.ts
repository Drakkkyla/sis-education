import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'teacher' | 'admin';
  group?: 'haitech' | 'promdesign' | 'promrobo' | 'energy' | 'bio' | 'aero' | 'media' | 'vrar';
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: false,
      default: 'Пользователь',
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    group: {
      type: String,
      enum: ['haitech', 'promdesign', 'promrobo', 'energy', 'bio', 'aero', 'media', 'vrar'],
      required: false,
    },
    avatar: {
      type: String,
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create sparse unique index on email that allows multiple null/undefined values
userSchema.index(
  { email: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { email: { $exists: true, $ne: null } },
  }
);

export default mongoose.model<IUser>('User', userSchema);


