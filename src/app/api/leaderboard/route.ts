import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({}).sort({ points: -1 }).select('name points');

    return NextResponse.json(users);
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
