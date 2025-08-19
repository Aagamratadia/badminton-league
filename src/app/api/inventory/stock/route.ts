import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Inventory, Purchase } from '@/models/Inventory';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { companyName, quantity, totalPrice, selectedUserIds } = await request.json();

    if (!companyName || !quantity || !totalPrice) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const userIds: string[] = Array.isArray(selectedUserIds) ? selectedUserIds : [];
    const hasSplit = userIds.length > 0;
    const costPerPlayer = hasSplit ? totalPrice / userIds.length : totalPrice;

    // 1. Update user balances
    if (hasSplit) {
      await User.updateMany(
        { _id: { $in: userIds } },
        { $inc: { outstandingBalance: costPerPlayer } }
      );
    }

    // 2. Create a new purchase record
    await Purchase.create([
      {
        companyName,
        quantity,
        totalPrice,
        costPerPlayer,
        splitAmong: hasSplit ? userIds : [],
      },
    ]);

    // 3. Update the total shuttle count
    await Inventory.findOneAndUpdate({}, { $inc: { totalShuttles: quantity } }, { upsert: true, new: true });

    return NextResponse.json({ message: 'Stock added and costs split successfully' });
  } catch (error) {
    console.error('Failed to add new stock:', error);
    return NextResponse.json({ message: 'Failed to add new stock' }, { status: 500 });
  }
}
