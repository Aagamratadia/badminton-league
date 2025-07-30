import mongoose, { Document, Schema, Model, models } from 'mongoose';

// 1. Purchase Schema
export interface IPurchase extends Document {
  purchaseDate: Date;
  quantity: number;
  totalPrice: number;
  costPerPlayer: number;
  splitAmong: mongoose.Schema.Types.ObjectId[];
}

const PurchaseSchema: Schema<IPurchase> = new Schema({
  purchaseDate: { type: Date, default: Date.now, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  costPerPlayer: { type: Number, required: true },
  splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export const Purchase: Model<IPurchase> = models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);

// 2. UsageLog Schema
export interface IUsageLog extends Document {
  usageDate: Date;
  quantityUsed: number;
}

const UsageLogSchema: Schema<IUsageLog> = new Schema({
  usageDate: { type: Date, default: Date.now, required: true },
  quantityUsed: { type: Number, required: true },
});

export const UsageLog: Model<IUsageLog> = models.UsageLog || mongoose.model<IUsageLog>('UsageLog', UsageLogSchema);

// 3. Inventory Schema (Singleton)
export interface IInventory extends Document {
  totalShuttles: number;
}

const InventorySchema: Schema<IInventory> = new Schema({
  totalShuttles: { type: Number, required: true, default: 0 },
});

export const Inventory: Model<IInventory> = models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
