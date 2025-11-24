import mongoose, { Document, Schema } from 'mongoose';

export type GroupType = 
  | 'haitech' 
  | 'promdesign' 
  | 'promrobo' 
  | 'energy' 
  | 'bio' 
  | 'aero' 
  | 'media' 
  | 'vrar';

export interface IGroup extends Document {
  name: GroupType;
  displayName: string;
  logo: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      enum: ['haitech', 'promdesign', 'promrobo', 'energy', 'bio', 'aero', 'media', 'vrar'],
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    description: {
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

// Статические методы для получения всех групп
groupSchema.statics.getAllGroups = async function() {
  return this.find({ isActive: true }).sort({ displayName: 1 });
};

export default mongoose.model<IGroup>('Group', groupSchema);

