"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Type definitions 
interface Player {
  _id: string;
  name: string;
}

interface Team {
  player1: Player | null;
  player2: Player | null;
}

interface Match {
  _id: string;
  matchType: '1v1' | '2v2';
  status: 'completed';
  playerOne?: Player | null;
  playerTwo?: Player | null;
  team1?: Team | null;
  team2?: Team | null;
  winner?: Player | null;
  winnerTeam?: 'team1' | 'team2';
}

// New interface for stats against a specific opponent
interface OpponentStats {
  id: string;
  name: string;
  wonWith: number;
  wonAgainst: number;
  lostAgainst: number;
}

export default function PerformancePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<OpponentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return; // Wait for session

    const fetchAndCalculateStats = async () => {
      try {
        setLoading(true);
        const currentUserId = session.user.id;

        const [usersRes, matchesRes] = await Promise.all([
          fetch('/api/users/list'),
          fetch('/api/matches?status=completed'),
        ]);

        if (!usersRes.ok || !matchesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const allUsers: Player[] = await usersRes.json();
        const matches: Match[] = await matchesRes.json();

        const otherUsers = allUsers.filter(user => user._id !== currentUserId);

        const opponentStatsMap: Map<string, OpponentStats> = new Map(
          otherUsers.map(user => [
            user._id,
            { id: user._id, name: user.name, wonWith: 0, wonAgainst: 0, lostAgainst: 0 },
          ])
        );

        for (const match of matches) {
          // Check if the current user participated in the match
          const isUserInMatch = 
            (match.matchType === '1v1' && (match.playerOne?._id === currentUserId || match.playerTwo?._id === currentUserId)) ||
            (match.matchType === '2v2' && 
              (match.team1?.player1?._id === currentUserId || match.team1?.player2?._id === currentUserId ||
               match.team2?.player1?._id === currentUserId || match.team2?.player2?._id === currentUserId));

          if (!isUserInMatch) continue;

          // 1v1 Matches
          if (match.matchType === '1v1' && match.playerOne && match.playerTwo && match.winner) {
            const opponent = match.playerOne._id === currentUserId ? match.playerTwo : match.playerOne;
            const opponentStat = opponentStatsMap.get(opponent._id);
            if (!opponentStat) continue;

            if (match.winner._id === currentUserId) {
              opponentStat.wonAgainst++;
            } else {
              opponentStat.lostAgainst++;
            }
          }
          // 2v2 Matches
          else if (match.matchType === '2v2' && match.team1 && match.team2 && match.winnerTeam) {
            const userTeam = match.team1.player1?._id === currentUserId || match.team1.player2?._id === currentUserId ? 'team1' : 'team2';
            const partner = userTeam === 'team1' ? 
              (match.team1.player1?._id === currentUserId ? match.team1.player2 : match.team1.player1) :
              (match.team2.player1?._id === currentUserId ? match.team2.player2 : match.team2.player1);

            const opponents = userTeam === 'team1' ? [match.team2.player1, match.team2.player2] : [match.team1.player1, match.team1.player2];
            
            if (!partner || opponents.some(p => !p)) continue;

            const isWinner = match.winnerTeam === userTeam;

            if (isWinner) {
              const partnerStat = opponentStatsMap.get(partner._id);
              if (partnerStat) partnerStat.wonWith++;

              opponents.forEach(opponent => {
                if(opponent) {
                  const opponentStat = opponentStatsMap.get(opponent._id);
                  if (opponentStat) opponentStat.wonAgainst++;
                }
              });
            } else {
              opponents.forEach(opponent => {
                if(opponent) {
                  const opponentStat = opponentStatsMap.get(opponent._id);
                  if (opponentStat) opponentStat.lostAgainst++;
                }
              });
            }
          }
        }
        setStats(Array.from(opponentStatsMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, [session]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Your Performance Stats</h1>

        <div className="bg-white/90 p-4 sm:p-6 rounded-3xl shadow-2xl border border-slate-200/80">
          {loading && <div className="text-center text-slate-500 py-8">Loading your stats...</div>}
          {error && <div className="text-center text-red-500 py-8">Error: {error}</div>}
          {!session && !loading && <div className="text-center text-slate-500 py-8">Please log in to view your stats.</div>}
          
          {!loading && !error && session && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Player</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Matches Won With</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Matches Won Against</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Matches Lost Against</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Win % Against</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {stats.map((player) => {
                    const totalAgainst = player.wonAgainst + player.lostAgainst;
                    const winPercentage = totalAgainst > 0 ? Math.round((player.wonAgainst / totalAgainst) * 100) : 0;

                    return (
                      <tr key={player.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{player.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{player.wonWith}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{player.wonAgainst}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{player.lostAgainst}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{winPercentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}