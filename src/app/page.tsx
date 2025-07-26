import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function getLeaderboard() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/leaderboard`, { cache: 'no-store' });
  if (!res.ok) {
    console.error('Failed to fetch leaderboard');
    return [];
  }
  return res.json();
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const users = await getLeaderboard();
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-2">
      <div className="flex justify-end w-full max-w-2xl mb-4 space-x-2">
        {session ? (
          <>
            {session.user?.role === 'admin' && (
              <Link href="/admin/settings" className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg shadow hover:bg-yellow-500 transition-colors">Admin Settings</Link>
            )}
            <Link href="/dashboard" className="bg-slate-200 text-cyan-700 px-4 py-2 rounded-lg shadow hover:bg-slate-300 transition-colors">Dashboard</Link>
            <Link href="/users" className="bg-cyan-600 text-white px-4 py-2 rounded-lg shadow hover:bg-cyan-700 transition-colors">View & Challenge Players</Link>
            <Link href="/api/auth/signout" className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors">Sign Out</Link>
          </>
        ) : (
          <>
            <Link href="/login" className="bg-cyan-600 text-white px-4 py-2 rounded-lg shadow hover:bg-cyan-700 transition-colors mr-2">Sign In</Link>
            <Link href="/register" className="bg-slate-200 text-cyan-700 px-4 py-2 rounded-lg shadow hover:bg-slate-300 transition-colors">Sign Up</Link>
          </>
        )}
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 text-center">🏸 Badminton League Leaderboard</h1>
        <p className="text-slate-600 mb-6 text-center">Rankings are updated automatically as matches are played and results are recorded.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Player</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Points</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {users.map((user: any, idx: number) => (
                <tr key={user._id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{idx + 1}</td>
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4 font-bold text-cyan-700">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
