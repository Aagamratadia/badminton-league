import mongoose, { Document, Schema, Model, models } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  points: number;
  role: 'user' | 'admin';
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  approved: boolean; // New field for admin approval
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  matchesPlayed: { type: Number, default: 0 },
  matchesWon: { type: Number, default: 0 },
  matchesLost: { type: Number, default: 0 },
  approved: { type: Boolean, default: false }, // New field for admin approval
});

export default (models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
