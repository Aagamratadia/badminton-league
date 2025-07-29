import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Match from '@/models/Match';
import User from '@/models/User';
import Link from 'next/link';
import { Trophy, LayoutDashboard } from 'lucide-react';
import dynamic from 'next/dynamic';
const AdminMatchesTable = dynamic(() => import('./AdminMatchesTable'), { ssr: false });

export default async function AdminMatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="p-8 text-center bg-white rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-red-600">Access Denied</h2>
          <p className="mb-4">You must be an admin to view this page.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    );
  }

  await dbConnect();
  const matches = await Match.find({})
    .populate('playerOne')
    .populate('playerTwo')
    .populate('team1.player1')
    .populate('team1.player2')
    .populate('team2.player1')
    .populate('team2.player2')
    .sort({ scheduledDate: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-cyan-600" /> All Matches
          </h1>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
        <AdminMatchesTable matches={matches} />
      </div>
    </div>
  );
}
