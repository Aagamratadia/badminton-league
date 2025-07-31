import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST() {
  await dbConnect();
  try {
    await User.updateMany({}, { $set: { outstandingBalance: 0 } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reset balances:', error);
    return NextResponse.json({ success: false, message: 'Failed to reset balances' }, { status: 500 });
  }
}
