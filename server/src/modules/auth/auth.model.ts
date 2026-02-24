import { Schema, model } from 'mongoose';

const authSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const AuthModel = model('Auth', authSchema);