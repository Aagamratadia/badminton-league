import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

async function getLeaderboard() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/leaderboard`, { cache: 'no-store' });
  if (!res.ok) {
    console.error('Failed to fetch leaderboard');
    return [];
  }
  return res.json();
}

// Helper to get rank-specific styles
const getRankClass = (rank: number) => {
  switch (rank) {
    case 1:
      return 'text-amber-500 font-bold'; // Gold
    case 2:
      return 'text-slate-500 font-bold'; // Silver
    case 3:
      return 'text-orange-600 font-bold'; // Bronze
    default:
      return 'text-slate-600';
  }
};

const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const users = await getLeaderboard();
  
  // Base style for all navigation buttons
  const buttonBaseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors shadow-sm px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex flex-col items-center py-12 sm:py-16 px-4">
      
      {/* --- Navigation / Actions --- */}
      <div className="flex flex-wrap justify-end items-center gap-3 w-full max-w-4xl mb-6">
        {session ? (
          <>
            {session.user?.role === 'admin' && (
              <Link href="/admin/settings" className={`${buttonBaseStyle} bg-amber-400 text-amber-900 hover:bg-amber-500`}>Admin Settings</Link>
            )}
            <Link href="/dashboard" className={`${buttonBaseStyle} bg-white text-slate-800 border border-slate-200 hover:bg-slate-100`}>Dashboard</Link>
            <Link href="/users" className={`${buttonBaseStyle} bg-cyan-600 text-white hover:bg-cyan-700`}>View & Challenge Players</Link>
            <Link href="/api/auth/signout" className={`${buttonBaseStyle} bg-red-600 text-white hover:bg-red-700`}>Sign Out</Link>
          </>
        ) : (
          <>
            <Link href="/login" className={`${buttonBaseStyle} bg-cyan-600 text-white hover:bg-cyan-700`}>Sign In</Link>
            <Link href="/register" className={`${buttonBaseStyle} bg-white text-slate-800 border border-slate-200 hover:bg-slate-100`}>Sign Up</Link>
          </>
        )}
      </div>

      {/* --- Leaderboard Card --- */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200/80">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">🏸 Badminton League</h1>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">Live rankings from the court. Points are updated after every verified match.</p>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="w-24 text-center py-3.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Player</th>
                <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Points</th>
                <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Played</th>
                <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">W</th>
                <th scope="col" className="py-3.5 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">L</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user: any, idx: number) => (
                <tr key={user._id} className="hover:bg-slate-50/70 transition-colors duration-150">
                  <td className={`py-4 px-3 text-center text-lg ${getRankClass(idx + 1)}`}>
                    {getRankIcon(idx + 1)}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{user.name}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap font-bold text-lg text-cyan-700">
                    {user.points}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-700">
                    {user.matchesPlayed}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-700">
                    {user.matchesWon}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-700">
                    {user.matchesLost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}