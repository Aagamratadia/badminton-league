"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Player, Match } from './types';
import { calculatePerformanceStats } from './calculateStats';

export default function PerformancePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<Player[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const isAdmin = session?.user?.role === 'admin';

  // Set the initial user ID from the session, but only once
  useEffect(() => {
    if (session?.user?.id && !selectedUserId) {
      setSelectedUserId(session.user.id);
    }
  }, [session?.user?.id, selectedUserId]);

  // Fetch all users and matches once
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [usersRes, matchesRes] = await Promise.all([
          fetch('/api/users/list'),
          fetch('/api/matches/details'),
        ]);
        if (!usersRes.ok || !matchesRes.ok) throw new Error('Failed to fetch data');
        const usersData = await usersRes.json();
        const matchesData = await matchesRes.json();
        setAllUsers(usersData);
        setMatches(matchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []); // Runs only once

  // Calculate stats using the refactored helper function
  const stats = useMemo(() => {
    if (!selectedUserId) return [];
    return calculatePerformanceStats(selectedUserId, allUsers, matches);
  }, [selectedUserId, allUsers, matches]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
  };

  const displayedUser = allUsers.find(u => u._id === selectedUserId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Performance Stats
            {displayedUser ? (
              <span className="ml-2 text-lg font-normal text-slate-500">for {displayedUser.name}</span>
            ) : null}
          </h1>
          {isAdmin && (
            <select
              className="border border-slate-300 rounded-lg px-4 py-2 text-base bg-white shadow-sm"
              value={selectedUserId || ''}
              onChange={handleUserChange}
            >
              {allUsers.map((user: Player) => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <p>Loading stats...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-slate-200 text-slate-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Opponent</th>
                  <th className="py-3 px-6 text-center">Won With (Partner)</th>
                  <th className="py-3 px-6 text-center">Won Against</th>
                  <th className="py-3 px-6 text-center">Lost Against</th>
                  <th className="py-3 px-6 text-center">Win % Against</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 text-sm font-light">
                {stats.map(stat => {
                  const totalGamesAgainst = stat.wonAgainst + stat.lostAgainst;
                  const winPercentage = totalGamesAgainst > 0 ? ((stat.wonAgainst / totalGamesAgainst) * 100).toFixed(0) : 'N/A';
                  return (
                    <tr key={stat.id} className="border-b border-slate-200 hover:bg-slate-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{stat.name}</td>
                      <td className="py-3 px-6 text-center">{stat.wonWith}</td>
                      <td className="py-3 px-6 text-center">{stat.wonAgainst}</td>
                      <td className="py-3 px-6 text-center">{stat.lostAgainst}</td>
                      <td className="py-3 px-6 text-center">{winPercentage}{winPercentage !== 'N/A' && '%'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}