import mongoose, { Document, Schema, Model, models } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  points: number;
  role: 'user' | 'admin';
  outstandingBalance: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  approved: boolean; // New field for admin approval
  dob?: Date;
  anniversary?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  outstandingBalance: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
  matchesWon: { type: Number, default: 0 },
  matchesLost: { type: Number, default: 0 },
  approved: { type: Boolean, default: false }, // New field for admin approval
  dob: { type: Date },
  anniversary: { type: Date },
});

export default (models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
