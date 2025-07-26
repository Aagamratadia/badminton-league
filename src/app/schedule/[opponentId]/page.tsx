'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Opponent {
  _id: string;
  name: string;
}

export default function ScheduleMatchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const opponentId = params?.opponentId as string;

  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [matchDate, setMatchDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opponentId) {
      fetch(`/api/users/${opponentId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch opponent details');
            return res.json();
        })
        .then(data => setOpponent(data))
        .catch(err => setError(err.message));
    }
  }, [opponentId]);

  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchDate) {
      setError('Please select a date and time for the match.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponentId, matchDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to schedule match');
      }

      alert('Match scheduled successfully!');
      router.push('/'); // Redirect to dashboard
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
      return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>
  }

  if (!opponent) {
    return <div className="min-h-screen flex items-center justify-center">Loading opponent details...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Schedule Match</h1>
        <p className="text-gray-600 mb-6">You are challenging <span className="font-semibold text-cyan-600">{opponent.name}</span>.</p>
        
        <form onSubmit={handleScheduleMatch}>
          <div className="mb-4">
            <label htmlFor="matchDate" className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
            <input
              type="datetime-local"
              id="matchDate"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? 'Scheduling...' : 'Confirm Match'}
          </button>
        </form>
      </div>
    </main>
  );
}
