import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const userId = session.user.id;
    const matches = await Match.find({
      $or: [{ playerOne: session.user.id }, { playerTwo: session.user.id }],
    })
      .populate('playerOne', 'name')
      .populate('playerTwo', 'name')
      .populate('winner', 'name')
      .sort({ scheduledDate: -1 });

    return NextResponse.json(matches, { status: 200 });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ message: 'Error fetching matches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { opponentId, matchDate } = await request.json();

    if (!opponentId || !matchDate) {
      return NextResponse.json({ message: 'Opponent ID and match date are required' }, { status: 400 });
    }

    const newMatch = new Match({
      playerOne: session.user.id,
      playerTwo: opponentId,
      scheduledDate: new Date(matchDate),
      requester: session.user.id,
      status: 'pending', // Default status
    });

    await newMatch.save();

    return NextResponse.json(newMatch, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ message: 'Error creating match' }, { status: 500 });
  }
}
