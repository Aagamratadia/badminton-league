import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    const matches = await Match.find({ status: 'completed' })
      .populate({
        path: 'playerOne',
        model: User,
        select: '_id name',
      })
      .populate({
        path: 'playerTwo',
        model: User,
        select: '_id name',
      })
      .populate({
        path: 'winner',
        model: User,
        select: '_id name',
      })
      .populate({
        path: 'team1.player1',
        model: User,
        select: '_id name',
      })
      .populate({
        path: 'team1.player2',
        model: User,
        select: '_id name',
      })
      .populate({
        path: 'team2.player1',
        model: User,
        select: '_id name',
      })
      .populate({
        path: 'team2.player2',
        model: User,
        select: '_id name',
      })
      .sort({ date: -1 });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching detailed matches:', error);
    return NextResponse.json(
      { message: 'Failed to fetch detailed matches' },
      { status: 500 }
    );
  }
}
