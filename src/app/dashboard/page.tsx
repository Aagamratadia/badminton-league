'use client';
import React, { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import SignOutButton from '../../components/SignOutButton';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (status === 'authenticated') {
      try {
        const res = await fetch('/api/matches');
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    }
  }, [status]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return <div className="min-h-screen flex items-center justify-center">Please <Link href="/login" className="text-cyan-600 font-semibold">login</Link> to view your dashboard.</div>;
  }

  const upcoming = matches.filter(m => m.status === 'pending' || m.status === 'accepted');
  const completed = matches.filter(m => m.status === 'completed' || m.status === 'declined');

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-2">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <div className="flex space-x-2">
            {session?.user?.role === 'admin' && (
              <Link href="/admin/settings" className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg shadow hover:bg-yellow-500 transition-colors">Admin Settings</Link>
            )}
            <Link href="/" className="bg-slate-200 text-cyan-700 px-4 py-2 rounded-lg shadow hover:bg-slate-300 transition-colors">Leaderboard</Link>
            <SignOutButton />
          </div>
        </div>
        <div className="mb-8 flex space-x-2">
          <Link 
            href="/users" 
            className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            View & Challenge Players
          </Link>
        </div>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Upcoming & Pending Matches</h2>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-3">
              {upcoming.length === 0 && <div className="text-slate-500">No upcoming matches.</div>}
              {upcoming.map((match: any) => (
                <MatchCard 
                  key={match._id} 
                  match={match} 
                  userId={typeof session?.user?.id === 'string' ? session.user.id : ''} 
                  onUpdate={fetchMatches}
                />
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Match History</h2>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-3">
              {completed.length === 0 && <div className="text-slate-500">No past matches.</div>}
              {completed.map((match: any) => (
                <MatchCard 
                  key={match._id} 
                  match={match} 
                  userId={typeof session?.user?.id === 'string' ? session.user.id : ''} 
                  onUpdate={fetchMatches}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MatchCard({ match, userId, onUpdate }: { match: any, userId: string, onUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const opponent = match.playerOne._id === userId ? match.playerTwo : match.playerOne;
  const isPlayerOne = match.playerOne._id === userId;
  const playerName = isPlayerOne ? 'You' : match.playerOne.name;
  const opponentName = isPlayerOne ? match.playerTwo.name : 'You';

  const updateMatchResult = async (winnerId: string) => {
    if (match.status === 'completed' && match.winner?._id === winnerId) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${match._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, status: 'completed' })
      });
      
      if (!response.ok) throw new Error('Failed to update match');
      
      toast.success('Match result updated!');
      onUpdate();
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match result');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium text-gray-900">
            {playerName} vs {opponentName}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(match.scheduledDate).toLocaleString()}
          </div>
        </div>
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${getStatusColor(match.status)}`}>
          {match.status}
        </span>
      </div>

      {(match.status === 'accepted' || match.status === 'pending') && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Set match result:</p>
          <div className="flex space-x-2">
            <button
              onClick={() => updateMatchResult(match.playerOne._id)}
              disabled={isUpdating}
              className={`flex-1 px-3 py-1 text-sm rounded ${isUpdating ? 'bg-gray-200' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
            >
              {isPlayerOne ? 'I won' : `${match.playerOne.name.split(' ')[0]} won`}
            </button>
            <button
              onClick={() => updateMatchResult(match.playerTwo._id)}
              disabled={isUpdating}
              className={`flex-1 px-3 py-1 text-sm rounded ${isUpdating ? 'bg-gray-200' : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
            >
              {!isPlayerOne ? 'I won' : `${match.playerTwo.name.split(' ')[0]} won`}
            </button>
          </div>
        </div>
      )}

      {match.status === 'completed' && match.winner && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700">
            Winner: <span className="font-semibold text-green-700">{match.winner.name}</span>
          </p>
          {match.winner._id === userId && (
            <p className="text-xs text-green-600 mt-1">You won this match!</p>
          )}
        </div>
      )}
    </div>
  );
}
