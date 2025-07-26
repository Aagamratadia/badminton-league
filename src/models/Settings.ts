import mongoose, { Document, Schema, Model, models } from 'mongoose';

export interface ISettings extends Document {
  pointsForPlay: number;
  pointsForWin: number;
}

const SettingsSchema = new Schema<ISettings>({
  pointsForPlay: { type: Number, default: 1 },
  pointsForWin: { type: Number, default: 3 },
});

export default (models.Settings as Model<ISettings>) || mongoose.model<ISettings>('Settings', SettingsSchema);
