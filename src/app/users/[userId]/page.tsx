'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProfileCard } from '@/components/ui/ProfileCard';
import { StatCard } from '@/components/ui/StatCard';
import SignOutButton from '@/components/SignOutButton';
import { Trophy, Target, Calendar, User, ArrowLeft, Users, Edit3, Save, X, LayoutDashboard } from 'lucide-react';

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDatesMode, setEditDatesMode] = useState(false);
  const [editNameMode, setEditNameMode] = useState(false);
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [name, setName] = useState('');
  const [savingDates, setSavingDates] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState('');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUser(data);
          setDob(data.dob ? data.dob.slice(0, 10) : '');
          setAnniversary(data.anniversary ? data.anniversary.slice(0, 10) : '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDates(true);
    setMessage('');
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob, anniversary })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setEditDatesMode(false);
        setMessage('Profile updated successfully!');
      } else {
        throw new Error('Failed to save changes.');
      }
    } catch (error) {
      setMessage('Failed to save. Please try again.');
    } finally {
      setSavingDates(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ProfileCard className="text-center p-8">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The requested profile could not be found.</p>
          <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-cyan-600 text-white hover:bg-cyan-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </ProfileCard>
      </div>
    );
  }

  const winPercentage = user.matchesPlayed ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <ProfileCard className="p-6 mb-8 relative">
          {isOwnProfile && !editNameMode && (
            <button
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 bg-transparent border border-slate-200 hover:bg-slate-100 z-10"
              onClick={() => { setEditNameMode(true); setName(user.name); }}
            >
              <Edit3 className="w-4 h-4 mr-1" /> Edit Name
            </button>
          )}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              {isOwnProfile && editNameMode ? (
                <>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="text-4xl font-bold text-slate-800 w-full text-center bg-slate-50 border-b-2 border-cyan-200 focus:outline-none focus:border-cyan-500 py-2 transition-all"
                    maxLength={40}
                    required
                  />
                  <button
                    className="ml-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 bg-green-600 text-white hover:bg-green-700"
                    disabled={savingName}
                    onClick={async () => {
                      if (!name.trim()) return;
                      setSavingName(true);
                      setMessage('');
                      try {
                        const res = await fetch(`/api/users/${userId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name })
                        });
                        if (res.ok) {
                          const updatedUser = await res.json();
                          setUser(updatedUser);
                          setEditNameMode(false);
                          setMessage('Name updated successfully!');
                        } else {
                          setMessage('Failed to update name.');
                        }
                      } catch {
                        setMessage('Failed to update name.');
                      } finally {
                        setSavingName(false);
                      }
                    }}
                  >
                    <Save className="w-4 h-4 mr-1" /> Save
                  </button>
                  <button
                    className="ml-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 bg-transparent border border-slate-200 hover:bg-slate-100"
                    onClick={() => { setEditNameMode(false); setName(user.name); }}
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </button>
                </>
              ) : (
                <h1 className="text-4xl font-bold text-slate-800">
                  {user.name}
                </h1>
              )}
            </div>
            <p className="text-slate-500 text-lg">{user.email}</p>
          </div>
        </ProfileCard> 



        <ProfileCard className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5" />
              Important Dates
            </h3>
            {isOwnProfile && !editDatesMode && (
              <button
                onClick={() => setEditDatesMode(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 bg-transparent border border-slate-200 hover:bg-slate-100"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Dates
              </button>
            )}
          </div>

          {editDatesMode && isOwnProfile ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingDates(true);
                setMessage('');
                try {
                  const res = await fetch(`/api/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dob, anniversary })
                  });
                  if (res.ok) {
                    const updatedUser = await res.json();
                    setUser(updatedUser);
                    setEditDatesMode(false);
                    setMessage('Dates updated successfully!');
                  } else {
                    setMessage('Failed to update dates.');
                  }
                } catch {
                  setMessage('Failed to update dates.');
                } finally {
                  setSavingDates(false);
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-medium text-slate-700">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="anniversary" className="text-sm font-medium text-slate-700">Anniversary</label>
                  <input
                    id="anniversary"
                    type="date"
                    value={anniversary}
                    onChange={(e) => setAnniversary(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditDatesMode(false)}
                  disabled={savingDates}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-transparent border border-slate-200 hover:bg-slate-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDates}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {savingDates ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {savingDates ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard 
                value={formatDate(user.dob)}
                label="Date of Birth"
                icon={<Calendar className="w-6 h-6"/>}
              />
              <StatCard 
                value={formatDate(user.anniversary)}
                label="Anniversary"
                icon={<Calendar className="w-6 h-6"/>}
              />
            </div>
          )}
        </ProfileCard>

        {isOwnProfile && (
          <>
            {showPasswordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
                  <button
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                    onClick={() => { setShowPasswordModal(false); setPwMessage(''); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold mb-4 text-slate-800">Change Password</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setPwMessage('');
                      if (!oldPassword || !newPassword || !confirmPassword) {
                        setPwMessage('All fields are required.');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPwMessage('New passwords do not match.');
                        return;
                      }
                      setPwLoading(true);
                      try {
                        const res = await fetch(`/api/users/${userId}/change-password`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ oldPassword, newPassword })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setPwMessage('Password changed successfully!');
                          setTimeout(() => { setShowPasswordModal(false); setPwMessage(''); }, 1500);
                        } else {
                          setPwMessage(data.message || 'Failed to change password.');
                        }
                      } catch (err) {
                        setPwMessage('Failed to change password.');
                      } finally {
                        setPwLoading(false);
                        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="old-password" className="block mb-1 text-sm font-medium text-slate-700">Current Password</label>
                      <input
                        id="old-password"
                        type="password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block mb-1 text-sm font-medium text-slate-700">New Password</label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block mb-1 text-sm font-medium text-slate-700">Confirm New Password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                    </div>
                    {pwMessage && (
                      <div className={`text-center text-sm font-medium ${pwMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwMessage}</div>
                    )}
                    <div className="flex gap-3 justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => { setShowPasswordModal(false); setPwMessage(''); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-transparent border border-slate-200 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={pwLoading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {pwLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        {pwLoading ? 'Saving...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <ProfileCard className="p-6 mt-8 flex flex-col items-center gap-6">
              <button
                className="w-full max-w-xs inline-flex items-center justify-center rounded-md text-base font-semibold transition-colors h-11 px-6 py-2 bg-cyan-600 text-white shadow hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
              <SignOutButton className="w-full max-w-xs bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-red-700 transition-colors" />
            </ProfileCard>
          </>
        )}
      </div>
    </div>
  );
}
