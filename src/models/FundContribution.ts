import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IFundContribution extends Document {
  date: Date;
  amountPerPerson: number;
  totalAmount: number;
  userIds: mongoose.Types.ObjectId[];
}

const FundContributionSchema: Schema<IFundContribution> = new Schema({
  date: { type: Date, required: true, default: Date.now },
  amountPerPerson: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  userIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
});

const FundContribution: Model<IFundContribution> = mongoose.models.FundContribution || mongoose.model<IFundContribution>('FundContribution', FundContributionSchema);

export default FundContribution;
