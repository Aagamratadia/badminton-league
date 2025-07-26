import mongoose, { Document, Schema, Model, models, Types } from 'mongoose';

export interface IMatch extends Document {
  playerOne: Types.ObjectId;
  playerTwo: Types.ObjectId;
  scheduledDate: Date;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  winner?: Types.ObjectId | null;
  requester: Types.ObjectId;
}

const MatchSchema = new Schema<IMatch>({
  playerOne: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  playerTwo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'declined'], default: 'pending' },
  winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default (models.Match as Model<IMatch>) || mongoose.model<IMatch>('Match', MatchSchema);
