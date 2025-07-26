import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import User from '@/models/User';

export async function PATCH(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { message: 'You must be logged in to update a match' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const { winnerId, status } = await request.json();
    const match = await Match.findById(params.matchId);

    if (!match) {
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if the current user is one of the players
    const isPlayer = match.playerOne.equals(session.user.id) || 
                    match.playerTwo.equals(session.user.id);
    
    if (!isPlayer) {
      return NextResponse.json(
        { message: 'You are not authorized to update this match' },
        { status: 403 }
      );
    }

    // Update match status and winner
    match.status = status || match.status;
    if (winnerId) {
      match.winner = winnerId;
      match.status = 'completed';

      // Award points to the winner and loser using settings
      const winner = await User.findById(winnerId);
      const loserId = match.playerOne.equals(winnerId) ? match.playerTwo : match.playerOne;
      const loser = await User.findById(loserId);
      const Settings = (await import('@/models/Settings')).default;
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      if (winner) {
        winner.points += settings.pointsForWin;
        await winner.save();
      }
      if (loser) {
        loser.points += settings.pointsForPlay;
        await loser.save();
      }
    }

    await match.save();

    // Populate the winner and player fields for the response
    const updatedMatch = await Match.findById(match._id)
      .populate('playerOne', 'name')
      .populate('playerTwo', 'name')
      .populate('winner', 'name');

    return NextResponse.json(updatedMatch, { status: 200 });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { message: 'Error updating match' },
      { status: 500 }
    );
  }
}
