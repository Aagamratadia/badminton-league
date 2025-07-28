import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
    const { winnerId, status, winnerTeam } = await request.json();
    const match = await Match.findById(params.matchId);

    if (!match) {
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if the current user is one of the players
    const isPlayer = match.playerOne?.equals(session.user.id) || 
                    match.playerTwo?.equals(session.user.id) ||
                    match.team1?.player1?.equals(session.user.id) ||
                    match.team1?.player2?.equals(session.user.id) ||
                    match.team2?.player1?.equals(session.user.id) ||
                    match.team2?.player2?.equals(session.user.id);
    
    if (!isPlayer) {
      return NextResponse.json(
        { message: 'You are not authorized to update this match' },
        { status: 403 }
      );
    }

    // Update match status and winner
    match.status = status || match.status;
    
    if (winnerId || winnerTeam) {
      if (winnerTeam && (match.matchType === '2v2')) {
        // Handle 2v2 match winner
        match.winnerTeam = winnerTeam;
        match.status = 'completed';
        
        // Update winners and losers for 2v2
        const winningTeam = winnerTeam === 'team1' ? match.team1 : match.team2;
        const losingTeam = winnerTeam === 'team1' ? match.team2 : match.team1;
        
        // Update points for all players
        const Settings = (await import('@/models/Settings')).default;
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        
        // Update winning team players
        if (winningTeam?.player1) {
          const winner1 = await User.findById(winningTeam.player1);
          if (winner1) {
            winner1.points += settings.pointsForWin;
            winner1.matchesPlayed = (winner1.matchesPlayed || 0) + 1;
            winner1.matchesWon = (winner1.matchesWon || 0) + 1;
            await winner1.save();
          }
        }
        if (winningTeam?.player2) {
          const winner2 = await User.findById(winningTeam.player2);
          if (winner2) {
            winner2.points += settings.pointsForWin;
            winner2.matchesPlayed = (winner2.matchesPlayed || 0) + 1;
            winner2.matchesWon = (winner2.matchesWon || 0) + 1;
            await winner2.save();
          }
        }
        
        // Update losing team players
        if (losingTeam?.player1) {
          const loser1 = await User.findById(losingTeam.player1);
          if (loser1) {
            loser1.points += settings.pointsForPlay;
            loser1.matchesPlayed = (loser1.matchesPlayed || 0) + 1;
            loser1.matchesLost = (loser1.matchesLost || 0) + 1;
            await loser1.save();
          }
        }
        if (losingTeam?.player2) {
          const loser2 = await User.findById(losingTeam.player2);
          if (loser2) {
            loser2.points += settings.pointsForPlay;
            loser2.matchesPlayed = (loser2.matchesPlayed || 0) + 1;
            loser2.matchesLost = (loser2.matchesLost || 0) + 1;
            await loser2.save();
          }
        }
      } else if (winnerId) {
        // Handle 1v1 match winner
        match.winner = winnerId;
        match.status = 'completed';

        // Award points to the winner and loser using settings
        const winner = await User.findById(winnerId);
        const loserId = match.playerOne?.equals(winnerId) ? match.playerTwo : match.playerOne;
        const loser = await User.findById(loserId);
        const Settings = (await import('@/models/Settings')).default;
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        if (winner) {
          winner.points += settings.pointsForWin;
          winner.matchesPlayed = (winner.matchesPlayed || 0) + 1;
          winner.matchesWon = (winner.matchesWon || 0) + 1;
          await winner.save();
        }
        if (loser) {
          loser.points += settings.pointsForPlay;
          loser.matchesPlayed = (loser.matchesPlayed || 0) + 1;
          loser.matchesLost = (loser.matchesLost || 0) + 1;
          await loser.save();
        }
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
