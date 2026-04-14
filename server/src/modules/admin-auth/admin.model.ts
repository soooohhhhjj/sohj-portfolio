import mongoose, { Schema } from 'mongoose';

export interface AdminDocument {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
  },
);

export const AdminModel = mongoose.model<AdminDocument>('Admin', adminSchema);
