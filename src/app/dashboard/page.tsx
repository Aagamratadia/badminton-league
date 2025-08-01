'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatToINR } from '@/utils/currency';
import { Trophy, Table, DollarSign, Feather } from 'lucide-react';
import { User } from '@/types';

import MatchCard from './MatchCard';  
import SignOutButton from '../../components/SignOutButton'; 

export default function DashboardPage() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<{count: number, users: Array<{name: string, email: string, _id: string}>}>({ count: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [totalShuttles, setTotalShuttles] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [fundContributions, setFundContributions] = useState<any[]>([]);

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
    const fetchCurrentUser = async () => {
      if (session?.user) {
        try {
          const res = await fetch('/api/users/me');
          if (!res.ok) throw new Error('Failed to fetch user data');
          const userData = await res.json();
          setCurrentUser({ ...session.user, ...userData });
        } catch (error) {
          console.error(error);
          toast.error('Failed to load your balance.');
        }
      }
    };

    fetchCurrentUser();
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMatches();
      fetchPendingApprovals();
      
      fetch('/api/inventory')
        .then(res => res.json())
        .then(data => {
          setTotalShuttles(data.totalShuttles);
          setPurchases(data.purchases || []);
        })
        .catch(() => setTotalShuttles(null));

      fetch('/api/funds')
        .then(res => res.json())
        .then(data => setFundContributions(data || []))
        .catch(() => setFundContributions([]));
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
  
  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Authenticating...</p>
      </div>
    );
  }

  const upcoming = matches.filter(m => m.status === 'pending' || m.status === 'accepted');
  const completed = matches.filter(m => m.status === 'completed' || m.status === 'declined');

  const userFundTotal = fundContributions.reduce((sum, c) => {
    const userInContribution = c.userIds.some((u: any) => u._id === currentUser.id);
    return userInContribution ? sum + c.amountPerPerson : sum;
  }, 0);

  const netBalance = (currentUser.outstandingBalance || 0) - userFundTotal;

  const buttonBaseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors shadow-sm px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">My Dashboard</h1>
            <p className="text-slate-500 mt-1 text-lg">Welcome back, {session.user?.name?.split(' ')[0]}!</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold text-sm shadow-sm hover:bg-cyan-100 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              title="Leaderboard"
              aria-label="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
            <Link
              href="/performance"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold text-sm shadow-sm hover:bg-cyan-100 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              title="Performance"
              aria-label="Performance"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V5a4 4 0 00-8 0v2m8 0a4 4 0 01-8 0M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2" /></svg>
              Performance
            </Link>
            {session.user?.role === 'admin' && (
              <Link
                href="/admin/matches"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold text-sm shadow-sm hover:bg-cyan-100 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
                title="All Matches"
                aria-label="All Matches"
              >
                <Table className="w-4 h-4" />
                All Matches
              </Link>
            )}
          </div>
        </header>

        <div className="bg-white/90 p-4 sm:p-8 rounded-2xl shadow-2xl border border-slate-200/80 space-y-10">
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

          {currentUser && currentUser.role === 'user' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200/80">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-cyan-500 rounded-full p-3 shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700">Net Balance</h3>
                    <p className={`text-3xl font-bold ${netBalance < 0 ? 'text-green-600' : 'text-red-600'}`}>{formatToINR(netBalance)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200/80">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-full p-3 shadow-md">
                    <Feather className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700">Shuttles in Stock</h3>
                    <p className="text-3xl font-bold text-slate-800">{totalShuttles ?? 'N/A'}</p>
                    {purchases.length > 0 && (
                      <p className="text-sm text-slate-500">Latest: {purchases[0].companyName}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Match Schedule</h2>
              <p className="text-slate-500 mt-1">View and manage your upcoming and completed matches.</p>
            </div>
          </div>

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
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-7 rounded-xl transition-colors shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 text-lg"
            >
              🏸 Schedule
            </button>

            {/* Schedule Modal */}
            {showScheduleModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl p-8 shadow-xl w-80 flex flex-col items-center">
                  <h3 className="text-xl font-bold mb-6 text-slate-800">Select Match Type</h3>
                  <button
                    className="w-full mb-4 py-3 rounded-lg bg-cyan-600 text-white font-semibold text-lg hover:bg-cyan-700 transition-colors"
                    onClick={() => { setShowScheduleModal(false); router.push('/users'); }}
                  >
                    1v1 Match
                  </button>
                  <button
                    className="w-full py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold text-lg hover:bg-cyan-200 transition-colors"
                    onClick={() => { setShowScheduleModal(false); router.push('/challenge?type=2v2'); }}
                  >
                    2v2 Match
                  </button>
                  <button
                    className="absolute top-3 right-4 text-slate-400 hover:text-slate-700 text-2xl"
                    onClick={() => setShowScheduleModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
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