'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Trophy } from 'lucide-react';

import MatchCard from './MatchCard'; 
import SignOutButton from '../../components/SignOutButton'; 

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<{count: number, users: Array<{name: string, email: string, _id: string}>}>({ count: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

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

  const fetchPendingApprovals = useCallback(async () => {
    if (session?.user?.role !== 'admin') return;
    
    try {
      setLoadingApprovals(true);
      const res = await fetch('/api/admin/pending-approvals');
      if (!res.ok) throw new Error('Failed to fetch pending approvals');
      const data = await res.json();
      setPendingApprovals(data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoadingApprovals(false);
    }
  }, [session?.user?.role]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMatches();
      fetchPendingApprovals();
    }
  }, [status, fetchMatches, fetchPendingApprovals]);

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
        <header className="flex flex-col items-start gap-2 mb-8">
          <div className="flex items-center gap-3 w-full">
            <span className="inline-flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 shadow w-12 h-12 mr-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">My Dashboard</h1>
              <Link
                href="/"
                className="inline-flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold text-base shadow-sm hover:bg-cyan-100 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
                title="Leaderboard"
                aria-label="Leaderboard"
              >
                <Trophy className="w-5 h-5 mr-1" />
                Leaderboard
              </Link>
            </div>
            {/* Spacer for right-aligned elements if needed */}
          </div>
          <p className="text-slate-500 mt-1 text-lg">Welcome back, {session.user?.name?.split(' ')[0]}!</p>
        </header>

        <div className="bg-white/90 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-12">
          {/* Admin Notification */}
          {session?.user?.role === 'admin' && pendingApprovals.count > 0 && (
            <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 via-amber-100 to-white border-l-4 border-amber-400 p-4 rounded-xl shadow">
              <div className="flex-shrink-0">
                <svg className="h-7 w-7 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-base text-amber-800 font-medium">
                  <span className="font-semibold">{pendingApprovals.count} user{pendingApprovals.count === 1 ? '' : 's'}</span> waiting for approval.{' '}
                  <Link href="/admin/settings" className="underline hover:text-amber-600">Review now</Link>
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-cyan-700 flex items-center gap-2 mb-2">
                <span className="inline-block bg-cyan-100 text-cyan-700 rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79V12A9 9 0 103 12v.79a2 2 0 00.55 1.41l7.45 7.45a2 2 0 002.83 0l7.45-7.45a2 2 0 00.55-1.41z" /></svg>
                </span>
                Schedule a Match
              </h2>
              <p className="text-slate-500 mb-4">Challenge your friends or rivals to a new match!</p>
            </div>
            <Link 
              href="/challenge" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-7 rounded-xl transition-colors shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 text-lg"
            >
              🏸 Schedule
            </Link>
          </div>

          <section className="pt-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 pb-2 border-b border-slate-200 mb-4">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m0-5V3" /></svg>
              Upcoming & Pending Matches
            </h2>
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
                    userId={session.user.id as string}
                    userRole={session.user.role as string} 
                    onUpdate={fetchMatches}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="pt-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 pb-2 border-b border-slate-200 mb-4">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h3l2-3h4l2 3h3a2 2 0 012 2v12a2 2 0 01-2 2z" /></svg>
              Match History
            </h2>
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
                    userId={session.user.id as string}
                    userRole={session.user.role as string} 
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