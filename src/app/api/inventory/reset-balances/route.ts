import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { Inventory } from '@/models/Inventory';

export async function POST() {
  await dbConnect();
  try {
    await User.updateMany({}, { $set: { outstandingBalance: 0 } });
    // Record the time of reset to demarcate the new cycle
    await Inventory.findOneAndUpdate(
      {},
      { $set: { lastResetAt: new Date() } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset balances:', error);
    return NextResponse.json({ success: false, message: 'Failed to reset balances' }, { status: 500 });
  }
}
