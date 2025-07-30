import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Inventory, UsageLog } from '@/models/Inventory';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantityUsed } = await request.json();

    if (!quantityUsed) {
      return NextResponse.json({ message: 'Missing required field: quantityUsed' }, { status: 400 });
    }

    // 1. Create a new usage log
    await UsageLog.create([{ quantityUsed }], { session });

    // 2. Update the total shuttle count
    await Inventory.findOneAndUpdate({}, { $inc: { totalShuttles: -quantityUsed } }, { upsert: true, new: true, session });

    await session.commitTransaction();

    return NextResponse.json({ message: 'Usage logged successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Failed to log usage:', error);
    return NextResponse.json({ message: 'Failed to log usage' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
