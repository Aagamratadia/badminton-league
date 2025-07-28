import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import User from '@/models/User';
import { IMatch } from '@/models/Match';

// Helper function to adjust player stats
async function adjustPlayerStats(
  playerIds: (string | undefined)[],
  points: number,
  matchesPlayed: number,
  matchesWon: number,
  matchesLost: number
) {
  for (const playerId of playerIds) {
    if (playerId) {
      await User.findByIdAndUpdate(playerId, {
        $inc: {
          points,
          matchesPlayed,
          matchesWon,
          matchesLost,
        },
      });
    }
  }
}

// Helper to get player IDs from a match
function getPlayerIds(match: IMatch): (string | undefined)[] {
  if (match.matchType === '1v1') {
    return [match.playerOne?.toString(), match.playerTwo?.toString()];
  }
  return [
    match.team1?.player1?.toString(),
    match.team1?.player2?.toString(),
    match.team2?.player1?.toString(),
    match.team2?.player2?.toString(),
  ].filter(id => id);
}

// Main logic to adjust points based on match outcome
async function updateMatchPoints(match: IMatch, revert = false, updateMatchesPlayed = false) {
  if (match.status !== 'completed' || (!match.winner && !match.winnerTeam)) {
    return; // No points to update if match is not completed or has no winner
  }

  const Settings = (await import('@/models/Settings')).default;
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});

  const multiplier = revert ? -1 : 1;
  const pointsForWin = settings.pointsForWin * multiplier;
  const pointsForLoss = settings.pointsForPlay * multiplier; // Assuming pointsForPlay is for losers
  
  // Only adjust matchesPlayed if updateMatchesPlayed is true
  const matchesPlayedInc = updateMatchesPlayed ? multiplier : 0;

  let winners: (string | undefined)[] = [];
  let losers: (string | undefined)[] = [];

  if (match.matchType === '1v1' && match.winner) {
    const winnerId = match.winner.toString();
    winners.push(winnerId);
    losers = getPlayerIds(match).filter(id => id !== winnerId);
  } else if (match.matchType === '2v2' && match.winnerTeam) {
    const winningTeam = match.winnerTeam === 'team1' ? match.team1 : match.team2;
    const losingTeam = match.winnerTeam === 'team1' ? match.team2 : match.team1;
    winners = [winningTeam?.player1?.toString(), winningTeam?.player2?.toString()];
    losers = [losingTeam?.player1?.toString(), losingTeam?.player2?.toString()];
  }

  await adjustPlayerStats(winners, pointsForWin, matchesPlayedInc, multiplier, 0);
  await adjustPlayerStats(losers, pointsForLoss, matchesPlayedInc, 0, multiplier);
}

export async function DELETE(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'You are not authorized to perform this action' },
      { status: 403 }
    );
  }

  await dbConnect();

  try {
    const match = await Match.findById(params.matchId);
    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 });
    }

    // Revert points AND matchesPlayed before deleting
    await updateMatchPoints(match, true, true);

    await Match.findByIdAndDelete(params.matchId);

    return NextResponse.json({ message: 'Match deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { message: 'Error deleting match' },
      { status: 500 }
    );
  }
}

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
    const match = await Match.findById(params.matchId);
    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 });
    }

    const originalMatchState = JSON.parse(JSON.stringify(match));

    const body = await request.json();

    // Revert points from the original state if the match was completed
    // If match is being un-completed (status changed from 'completed' to not 'completed'), revert all stats including matchesPlayed
    if (originalMatchState.status === 'completed' && body.status !== 'completed') {
      await updateMatchPoints(originalMatchState, true, true);
    } else if (originalMatchState.status === 'completed') {
      // If editing a completed match (but still completed), revert points and win/loss only, NOT matchesPlayed
      await updateMatchPoints(originalMatchState, true, false);
    }

    // Apply updates to the match object
    Object.assign(match, body);
    
    // If the update makes the match completed, award new points
    if (originalMatchState.status !== 'completed' && match.status === 'completed') {
      // First time completion: increment matchesPlayed
      await updateMatchPoints(match, false, true);
    } else if (match.status === 'completed') {
      // Editing a completed match: do not change matchesPlayed
      await updateMatchPoints(match, false, false);
    }

    await match.save();

    const updatedMatch = await Match.findById(match._id)
      .populate('playerOne', 'name')
      .populate('playerTwo', 'name')
      .populate('winner', 'name')
      .populate({ path: 'team1.player1', model: 'User' })
      .populate({ path: 'team1.player2', model: 'User' })
      .populate({ path: 'team2.player1', model: 'User' })
      .populate({ path: 'team2.player2', model: 'User' });

    return NextResponse.json(updatedMatch, { status: 200 });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { message: 'Error updating match' },
      { status: 500 }
    );
  }
}
