import mongoose, { Document, Schema, Model, models, Types } from 'mongoose';

type MatchType = '1v1' | '2v2';
type MatchStatus = 'pending' | 'accepted' | 'completed' | 'declined';

interface ITeam {
  player1: Types.ObjectId;
  player2: Types.ObjectId;
  score?: number;
}

export interface IMatch extends Document {
  // For backward compatibility with 1v1 matches
  playerOne?: Types.ObjectId;
  playerTwo?: Types.ObjectId;
  
  // New fields for 2v2 support
  matchType: MatchType;
  team1?: ITeam;
  team2?: ITeam;
  
  scheduledDate: Date;
  status: MatchStatus;
  winner?: Types.ObjectId | null;
  winnerTeam?: 'team1' | 'team2' | null;
  winningTeam?: 1 | 2 | null; // Keeping this for backward compatibility
  requester: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  player1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 0 }
}, { _id: false });

const MatchSchema = new Schema<IMatch>({
  // For 1v1 matches (legacy support)
  playerOne: { type: Schema.Types.ObjectId, ref: 'User' },
  playerTwo: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // For 2v2 matches
  matchType: { type: String, enum: ['1v1', '2v2'], default: '1v1' },
  team1: { type: TeamSchema },
  team2: { type: TeamSchema },
  winnerTeam: { type: String, enum: ['team1', 'team2'], default: null },
  
  scheduledDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'completed', 'declined'], 
    default: 'pending' 
  },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  winningTeam: { type: Number, enum: [1, 2] },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { 
  timestamps: true,
  // Add a pre-save hook to ensure data consistency
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add validation to ensure either 1v1 or 2v2 structure is used
MatchSchema.pre('validate', function(next) {
  if (this.matchType === '1v1') {
    if (!this.playerOne || !this.playerTwo) {
      next(new Error('Both players are required for 1v1 matches'));
    }
  } else if (this.matchType === '2v2') {
    if (!this.team1 || !this.team2) {
      next(new Error('Both teams are required for 2v2 matches'));
    }
  }
  next();
});

export default (models.Match as Model<IMatch>) || mongoose.model<IMatch>('Match', MatchSchema);
