import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({}).sort({ points: -1 }).select('name points matchesPlayed matchesLost matchesWon');

    const res = NextResponse.json(users);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
