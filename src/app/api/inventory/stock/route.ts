import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Inventory, Purchase } from '@/models/Inventory';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { quantity, totalPrice, selectedUserIds } = await request.json();

    if (!quantity || !totalPrice || !selectedUserIds || selectedUserIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const costPerPlayer = totalPrice / selectedUserIds.length;

    // 1. Update user balances
    await User.updateMany(
      { _id: { $in: selectedUserIds } },
      { $inc: { outstandingBalance: costPerPlayer } }
    );

    // 2. Create a new purchase record
    await Purchase.create([
      {
        quantity,
        totalPrice,
        costPerPlayer,
        splitAmong: selectedUserIds,
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
