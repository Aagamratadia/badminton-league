import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Match from '@/models/Match';
import type { Types } from 'mongoose';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    // Compute current month range [start, end)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Load settings to know how many points to award
    const Settings = (await import('@/models/Settings')).default;
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const pointsForWin = settings.pointsForWin;
    const pointsForPlay = settings.pointsForPlay; // used for losers/participants

    // Fetch completed matches in the month
    const matches = await Match.find({
      status: 'completed',
      scheduledDate: { $gte: monthStart, $lt: nextMonthStart },
    })
      .select(
        'matchType winner winnerTeam playerOne playerTwo team1.player1 team1.player2 team2.player1 team2.player2'
      )
      .lean();

    // Aggregate per-user monthly stats in memory
    type Stat = { points: number; matchesPlayed: number; matchesWon: number };
    const stats = new Map<string, Stat>();

    const inc = (userId: unknown, delta: Partial<Stat>) => {
      if (!userId) return;
      const key = String(userId);
      const s = stats.get(key) || { points: 0, matchesPlayed: 0, matchesWon: 0 };
      stats.set(key, {
        points: s.points + (delta.points ?? 0),
        matchesPlayed: s.matchesPlayed + (delta.matchesPlayed ?? 0),
        matchesWon: s.matchesWon + (delta.matchesWon ?? 0),
      });
    };

    for (const m of matches) {
      // Everyone who participated gets matchesPlayed +1
      if (m.matchType === '1v1') {
        const p1 = m.playerOne as Types.ObjectId | undefined;
        const p2 = m.playerTwo as Types.ObjectId | undefined;
        inc(p1, { matchesPlayed: 1 });
        inc(p2, { matchesPlayed: 1 });

        const winnerId = m.winner as Types.ObjectId | undefined;
        if (winnerId) {
          const loserId = String(winnerId) === String(p1) ? p2 : p1;
          inc(winnerId, { points: pointsForWin, matchesWon: 1 });
          inc(loserId, { points: pointsForPlay });
        }
      } else if (m.matchType === '2v2') {
        const t1p1 = m.team1?.player1 as Types.ObjectId | undefined;
        const t1p2 = m.team1?.player2 as Types.ObjectId | undefined;
        const t2p1 = m.team2?.player1 as Types.ObjectId | undefined;
        const t2p2 = m.team2?.player2 as Types.ObjectId | undefined;

        // matches played for all 4
        for (const uid of [t1p1, t1p2, t2p1, t2p2]) {
          inc(uid, { matchesPlayed: 1 });
        }

        if (m.winnerTeam === 'team1') {
          // team1 winners
          for (const uid of [t1p1, t1p2]) {
            inc(uid, { points: pointsForWin, matchesWon: 1 });
          }
          for (const uid of [t2p1, t2p2]) {
            inc(uid, { points: pointsForPlay });
          }
        } else if (m.winnerTeam === 'team2') {
          // team2 winners
          for (const uid of [t2p1, t2p2]) {
            inc(uid, { points: pointsForWin, matchesWon: 1 });
          }
          for (const uid of [t1p1, t1p2]) {
            inc(uid, { points: pointsForPlay });
          }
        }
      }
    }

    // Join with user names
    const userIds = Array.from(stats.keys());
    let output: { _id: string; name: string; points: number; matchesPlayed: number; matchesWon: number }[] = [];
    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } })
        .select('name')
        .lean();
      const nameById = new Map<string, string>(users.map((u) => [String(u._id), u.name]));
      output = userIds.map((id) => {
        const s = stats.get(id) || { points: 0, matchesPlayed: 0, matchesWon: 0 };
        return {
          _id: id,
          name: nameById.get(id) || 'Unknown',
          points: s.points,
          matchesPlayed: s.matchesPlayed,
          matchesWon: s.matchesWon,
        };
      });
    }

    // Sort by points desc, then wins desc, then matchesPlayed asc (tie-breakers)
    output.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      return a.matchesPlayed - b.matchesPlayed;
    });

    const res = NextResponse.json(output);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ message: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
