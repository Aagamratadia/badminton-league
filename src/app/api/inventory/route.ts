import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Inventory, Purchase, UsageLog } from '@/models/Inventory';
import mongoose from 'mongoose';
import User, { IUser } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();

  try {
    // Ensure inventory document exists
    let inventory = await Inventory.findOne();
    if (!inventory) {
      inventory = await Inventory.create({ totalShuttles: 0 });
    }

    const purchasesRaw = await Purchase.find({}).sort({ purchaseDate: -1 }).populate('splitAmong', 'name');
    // Ensure every purchase has a companyName
    const purchases = purchasesRaw.map((p: any) => ({
      ...p.toObject(),
      companyName: p.companyName || 'Unknown',
    }));
    const usageLogs = await UsageLog.find({}).sort({ usageDate: -1 });
    const usersData: IUser[] = await User.find({}).select('name outstandingBalance role');

    const users = usersData.map(user => user.toObject({ virtuals: true }));

    return NextResponse.json({
      totalShuttles: inventory.totalShuttles,
      purchases,
      usageLogs,
      users,
    });
  } catch (error) {
    console.error('Failed to fetch inventory data:', error);
    return NextResponse.json({ message: 'Failed to fetch inventory data' }, { status: 500 });
  }
}
