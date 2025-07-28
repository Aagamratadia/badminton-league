import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import { Types } from 'mongoose';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a match' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { team1, team2, scheduledDate, matchTime } = data;

    // Validate required fields
    if (!team1?.player1 || !team1?.player2 || !team2?.player1 || !team2?.player2 || !scheduledDate) {
      return NextResponse.json(
        { error: 'All player and date fields are required' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectId
    const playerIds = [
      new Types.ObjectId(team1.player1),
      new Types.ObjectId(team1.player2),
      new Types.ObjectId(team2.player1),
      new Types.ObjectId(team2.player2)
    ];

    // Check for duplicate players across teams
    const uniquePlayers = new Set(playerIds.map(id => id.toString()));
    if (uniquePlayers.size < 4) {
      return NextResponse.json(
        { error: 'Each player can only appear once in the match' },
        { status: 400 }
      );
    }

    // Combine date and time, defaulting time to midnight if not provided
    const [year, month, day] = scheduledDate.split('-').map(Number);
    let hours = 0, minutes = 0;
    if (matchTime) {
      [hours, minutes] = matchTime.split(':').map(Number);
    }
    const matchDateTime = new Date(year, month - 1, day, hours, minutes);

    // Check if match is in the future
    if (matchDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Match must be scheduled in the future' },
        { status: 400 }
      );
    }

    // Create the match
    const match = new Match({
      matchType: '2v2',
      team1: {
        player1: playerIds[0],
        player2: playerIds[1],
        score: 0
      },
      team2: {
        player1: playerIds[2],
        player2: playerIds[3],
        score: 0
      },
      scheduledDate: matchDateTime,
      status: 'pending',
      requester: new Types.ObjectId(session.user.id)
    });

    await match.save();

    return NextResponse.json({
      success: true,
      matchId: match._id,
      message: '2v2 match created successfully. Waiting for opponent confirmation.'
    });

  } catch (error) {
    console.error('Error creating 2v2 match:', error);
    return NextResponse.json(
      { error: 'Failed to create match. Please try again.' },
      { status: 500 }
    );
  }
}
