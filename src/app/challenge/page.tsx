'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ChevronRight } from 'lucide-react';

type User = {
  _id: string;
  name: string;
  email: string;
};

// Admin-specific component for scheduling for others
const AdminScheduleForOthers = ({ users, onSuccess }: { users: User[], onSuccess: () => void }) => {
  const [team1Player1, setTeam1Player1] = useState('');
  const [team1Player2, setTeam1Player2] = useState('');
  const [team2Player1, setTeam2Player1] = useState('');
  const [team2Player2, setTeam2Player2] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const selectedPlayers = [team1Player1, team1Player2, team2Player1, team2Player2];
    if (selectedPlayers.some(p => !p)) {
      setError('Please select all 4 players.');
      return;
    }

    const uniquePlayers = new Set(selectedPlayers);
    if (uniquePlayers.size !== 4) {
      setError('All selected players must be unique.');
      return;
    }

    if (!matchDate) {
      setError('Please select a match date.');
      return;
    }

    setIsSubmitting(true);
    try {
      let time = matchTime;
      if (!time) {
        const now = new Date();
        const istOffset = 5.5 * 60; // in minutes
        const ist = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000);
        const hh = ist.getHours().toString().padStart(2, '0');
        const mm = ist.getMinutes().toString().padStart(2, '0');
        time = `${hh}:${mm}`;
      }

      const response = await fetch('/api/matches/2v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: { player1: team1Player1, player2: team1Player2 },
          team2: { player1: team2Player1, player2: team2Player2 },
          scheduledDate: matchDate,
          matchTime: time,
          scheduledByAdmin: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule match.');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailablePlayers = (exclude: string[] = []) => {
    return users.filter(u => !exclude.includes(u._id));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset className="border p-4 rounded-lg">
          <legend className="text-lg font-semibold px-2">Team 1</legend>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Player 1</label>
              <select value={team1Player1} onChange={e => setTeam1Player1(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md">
                <option value="">Select Player</option>
                {getAvailablePlayers([team1Player2, team2Player1, team2Player2]).map(u => <option key={u._id} value={u._id}>{u.name}</option>)}              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Player 2</label>
              <select value={team1Player2} onChange={e => setTeam1Player2(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md">
                <option value="">Select Player</option>
                {getAvailablePlayers([team1Player1, team2Player1, team2Player2]).map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border p-4 rounded-lg">
          <legend className="text-lg font-semibold px-2">Team 2</legend>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Player 1</label>
              <select value={team2Player1} onChange={e => setTeam2Player1(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md">
                <option value="">Select Player</option>
                {getAvailablePlayers([team1Player1, team1Player2, team2Player2]).map(u => <option key={u._id} value={u._id}>{u.name}</option>)}              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Player 2</label>
              <select value={team2Player2} onChange={e => setTeam2Player2(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md">
                <option value="">Select Player</option>
                {getAvailablePlayers([team1Player1, team1Player2, team2Player1]).map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Match Date</label>
          <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Match Time (Optional)</label>
          <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md" />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700">
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Schedule Match'}
      </Button>
    </form>
  );
};

function ChallengePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [adminMode, setAdminMode] = useState<'me' | 'others'>('me');
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session) return;
      try {
        setIsLoading(true);
        const response = await fetch('/api/users/list');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError('Failed to load user list.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [session]);

  const [formData, setFormData] = useState({
    partnerId: '',
    opponent1Id: '',
    opponent2Id: '',
    matchDate: '',
    matchTime: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let matchTime = formData.matchTime;
      if (!matchTime) {
        const now = new Date();
        const istOffset = 5.5 * 60;
        const ist = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000);
        matchTime = `${ist.getHours().toString().padStart(2, '0')}:${ist.getMinutes().toString().padStart(2, '0')}`;
      }
      const response = await fetch('/api/matches/2v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team1: { player1: formData.partnerId, player2: session?.user?.id },
          team2: { player1: formData.opponent1Id, player2: formData.opponent2Id },
          scheduledDate: formData.matchDate,
          matchTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create match');

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create challenge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const availablePartners = users.filter(user => user._id !== session?.user?.id);
  const availableOpponents = availablePartners.filter(user => user._id !== formData.partnerId);
  const availableSecondOpponents = availableOpponents.filter(user => user._id !== formData.opponent1Id);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to create a 2v2 challenge.</p>
          <Button onClick={() => router.push('/login')} className="bg-cyan-600 hover:bg-cyan-700 text-white">Sign In</Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading players...</p>
        </div>
      </div>
    );
  }
  
  if (users.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No Players Available</h2>
          <p className="text-slate-600 mb-6">There are no other players to challenge.</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          {session?.user?.role === 'admin' && (
            <div className="mb-8 flex justify-center gap-4">
              <button
                className={`px-4 py-2 rounded-lg font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${adminMode === 'me' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-slate-100 text-cyan-700 border-cyan-300 hover:bg-cyan-50'}`}
                onClick={() => setAdminMode('me')}
              >
                Schedule for Me
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  adminMode === 'others' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-slate-100 text-cyan-700 border-cyan-300 hover:bg-cyan-50'
                }`}
                onClick={() => setAdminMode('others')}
              >
                Schedule for Others
              </button>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Create 2v2 Challenge</h1>
            <p className="mt-2 text-slate-600">
              {adminMode === 'me'
                ? step === 1
                  ? 'Select your partner'
                  : step === 2
                  ? 'Select your opponents'
                  : 'Schedule your match'
                : 'Schedule a match for 4 other players'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Challenge Created!</h3>
              <p className="text-gray-600 mb-6">Your match has been scheduled successfully.</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              {session?.user?.role === 'admin' && adminMode === 'others' ? (
                <AdminScheduleForOthers
                  users={users.filter(u => u._id !== session.user.id)}
                  onSuccess={() => setSuccess(true)}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between items-center mb-8">
                {[1, 2, 3].map((stepNum, index, arr) => (
                  <React.Fragment key={stepNum}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          step === stepNum
                            ? 'bg-cyan-600'
                            : step > stepNum
                            ? 'bg-green-500'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step > stepNum ? '✓' : stepNum}
                      </div>
                      <div
                        className={`text-xs mt-2 font-medium ${
                          step >= stepNum ? 'text-cyan-700' : 'text-slate-400'
                        }`}
                      >
                        {stepNum === 1 ? 'Partner' : stepNum === 2 ? 'Opponents' : 'Schedule'}
                      </div>
                    </div>
                    {index < arr.length - 1 && (
                      <div className="flex-1 h-1 mx-2 bg-slate-200" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">Select Your Partner</label>
                  <select
                    name="partnerId"
                    value={formData.partnerId}
                    onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    required
                  >
                    <option value="">Choose a partner</option>
                    {availablePartners.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">First Opponent</label>
                    <select
                      name="opponent1Id"
                      value={formData.opponent1Id}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md"
                      required
                    >
                      <option value="">Choose first opponent</option>
                      {availableOpponents.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Second Opponent</label>
                    <select
                      name="opponent2Id"
                      value={formData.opponent2Id}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md"
                      required
                      disabled={!formData.opponent1Id}
                    >
                      <option value="">Choose second opponent</option>
                      {availableSecondOpponents
                        .filter((user) => user._id !== formData.opponent1Id)
                        .map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Match Date</label>
                    <input
                      type="date"
                      name="matchDate"
                      value={formData.matchDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-slate-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Match Time (Optional)</label>
                    <input
                      type="time"
                      name="matchTime"
                      value={formData.matchTime}
                      onChange={handleChange}
                      className="w-full p-2 border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={step === 1 ? () => router.back() : prevStep}
                  disabled={isSubmitting}
                  className="text-slate-700 border-slate-300 hover:bg-slate-50"
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      step === 1 && !formData.partnerId
                        ? true
                        : step === 2 && (!formData.opponent1Id || !formData.opponent2Id)
                        ? true
                        : false
                    }
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Challenge...
                      </>
                    ) : (
                      'Create Challenge'
                    )}
                  </Button>
                )}
              </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChallengePage;
