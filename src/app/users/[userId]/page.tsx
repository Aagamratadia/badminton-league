'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProfileCard } from '@/components/ui/ProfileCard';
import { StatCard } from '@/components/ui/StatCard';
import SignOutButton from '@/components/SignOutButton';
import { Trophy, Target, Calendar, User, ArrowLeft, Users, Edit3, Save, X } from 'lucide-react';

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
  const [editMode, setEditMode] = useState(false);
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
    setSaving(true);
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
        setEditMode(false);
        setMessage('Profile updated successfully!');
      } else {
        throw new Error('Failed to save changes.');
      }
    } catch (error) {
      setMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
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
          <Link href="/users" className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
            <Users className="w-4 h-4" />
            All Players
          </Link>
        </div>

        <ProfileCard className="p-6 mb-8">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg">
              {user.name.charAt(0)}
            </div>
            <h1 className="text-4xl font-bold mb-2 text-slate-800">
              {user.name}
            </h1>
            <p className="text-slate-500 text-lg">{user.email}</p>
          </div>
        </ProfileCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard 
            value={user.points}
            label="Total Points"
            icon={<Trophy className="w-6 h-6"/>}
            variant="sport"
          />
          <StatCard 
            value={`${winPercentage}%`}
            label="Win Rate"
            icon={<Target className="w-6 h-6"/>}
            variant="primary"
          />
        </div>

        <ProfileCard className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5" />
              Important Dates
            </h3>
            {isOwnProfile && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3 bg-transparent border border-slate-200 hover:bg-slate-100"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
          </div>

          {editMode && isOwnProfile ? (
            <form onSubmit={handleSave} className="space-y-6">
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
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-transparent border border-slate-200 hover:bg-slate-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
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
          <div className="text-center">
            <SignOutButton className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-red-700 transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
}
