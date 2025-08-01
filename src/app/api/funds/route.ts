import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FundContribution from '@/models/FundContribution';
import User from '@/models/User';

// GET all fund contributions
export async function GET() {
  try {
    await dbConnect();
    const contributions = await FundContribution.find({}).sort({ date: -1 }).populate('userIds', 'name');
    return NextResponse.json(contributions);
  } catch (error) {
    console.error('Failed to fetch fund contributions:', error);
    return NextResponse.json({ message: 'Failed to fetch fund contributions' }, { status: 500 });
  }
}

// POST a new fund contribution
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { amountPerPerson, totalAmount, userIds } = await request.json();

    if (!amountPerPerson || !totalAmount || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Decrease the outstanding balance for each user
    await User.updateMany(
      { _id: { $in: userIds } },
      { $inc: { outstandingBalance: -amountPerPerson } }
    );

    const newContribution = new FundContribution({
      amountPerPerson,
      totalAmount,
      userIds,
    });

    await newContribution.save();
    return NextResponse.json(newContribution, { status: 201 });
  } catch (error) {
    console.error('Failed to create fund contribution:', error);
    return NextResponse.json({ message: 'Failed to create fund contribution' }, { status: 500 });
  }
}
