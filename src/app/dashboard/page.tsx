'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import MatchCard from './MatchCard'; 
import SignOutButton from '../../components/SignOutButton'; 

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('Server responded with an error');
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMatches();
    }
  }, [status, fetchMatches]);

  // Loading and Unauthenticated States
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          Please{' '}
          <Link href="/login" className="font-bold text-cyan-600 hover:underline">
            sign in
          </Link>{' '}
          to view your dashboard.
        </p>
      </div>
    );
  }
  
  // FIX: Add a guard clause to ensure session is not null.
  // This satisfies TypeScript for the rest of the component.
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Authenticating...</p>
      </div>
    );
  }

  const upcoming = matches.filter(m => m.status === 'pending' || m.status === 'accepted');
  const completed = matches.filter(m => m.status === 'completed' || m.status === 'declined');

  const buttonBaseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors shadow-sm px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {session.user?.name?.split(' ')[0]}!</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {session.user?.role === 'admin' && (
              <Link href="/admin/settings" className={`${buttonBaseStyle} bg-amber-400 text-amber-900 hover:bg-amber-500`}>Admin</Link>
            )}
            <Link href="/" className={`${buttonBaseStyle} bg-white text-slate-800 border border-slate-200 hover:bg-slate-100`}>Leaderboard</Link>
            <SignOutButton className={`${buttonBaseStyle} bg-red-600 text-white hover:bg-red-700`} />
          </div>
        </header>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200/80 space-y-10">
          <Link 
            href="/users" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          >
            🏸 View & Challenge Players
          </Link>
          
          <section>
            <h2 className="text-xl font-bold text-slate-800 pb-2 border-b border-slate-200 mb-4">Upcoming & Pending Matches</h2>
            {loading ? (
              <p className="text-slate-500">Loading matches...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">You have no upcoming matches.</p>
            ) : (
              <div className="space-y-4">
                {upcoming.map((match: any) => (
                  <MatchCard 
                    key={match._id} 
                    match={match} 
                    // FIX: No longer 'possibly null' because of the check above
                    userId={session.user.id as string} 
                    onUpdate={fetchMatches}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 pb-2 border-b border-slate-200 mb-4">Match History</h2>
            {loading ? (
              <p className="text-slate-500">Loading history...</p>
            ) : completed.length === 0 ? (
              <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No past matches found.</p>
            ) : (
              <div className="space-y-4">
                {completed.map((match: any) => (
                  <MatchCard 
                    key={match._id} 
                    match={match} 
                    // FIX: No longer 'possibly null'
                    userId={session.user.id as string} 
                    onUpdate={fetchMatches}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}