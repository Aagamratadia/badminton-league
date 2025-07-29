'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function getRankClass(rank: number) {
  switch (rank) {
    case 1:
      return 'text-amber-500 font-bold';
    case 2:
      return 'text-slate-500 font-bold';
    case 3:
      return 'text-orange-600 font-bold';
    default:
      return 'text-slate-600';
  }
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return '1';
    case 2: return '2';
    case 3: return '3';
    default: return rank;
  }
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Base style for all navigation buttons
  const buttonBaseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors shadow-sm px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2";

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex flex-col items-center py-12 sm:py-16 px-4">
      {/* --- Leaderboard Card --- */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200/80">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">RAWAT ACADEMY KHELGHAR</h1>
            <h2 className="text-2xl font-bold text-cyan-700 mt-2">Leaderboard</h2>
        </div>
        {error && <div className="text-red-600 text-center mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-8 text-cyan-700 font-semibold">Loading leaderboard...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="w-24 text-center py-3.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                  <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Player</th>
                  <th scope="col" className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Played</th>
                  <th scope="col" className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Win</th>
                  <th scope="col" className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">%Wins</th>
                  <th scope="col" className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user: any, idx: number) => (
                  <tr key={user._id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className={`py-4 px-3 text-center text-lg ${getRankClass(idx + 1)}`}>{getRankIcon(idx + 1)}</td>
                    <td className="py-4 px-4 whitespace-nowrap"><div className="font-medium text-slate-800">{user.name}</div></td>
                    <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700 font-medium">{user.matchesPlayed}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700 font-medium">{user.matchesWon}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700 font-medium">{user.matchesPlayed ? Math.round((user.matchesWon / user.matchesPlayed) * 100) + '%' : '0%'}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-center font-bold text-lg text-cyan-700">{user.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}