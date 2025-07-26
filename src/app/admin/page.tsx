'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<any>(null);
  const [pointsForPlay, setPointsForPlay] = useState(1);
  const [pointsForWin, setPointsForWin] = useState(3);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'admin') {
      fetch('/api/admin/settings').then(res => res.json()).then(data => {
        setSettings(data);
        setPointsForPlay(data.pointsForPlay);
        setPointsForWin(data.pointsForWin);
      });
    }
  }, [status, session]);

  const handleSave = async () => {
    setMessage('');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsForPlay, pointsForWin }),
    });
    if (res.ok) {
      setMessage('Settings updated!');
    } else {
      setMessage('Failed to update settings');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (status !== 'authenticated' || session?.user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Not authorized. <Link href="/login" className="text-cyan-600 font-semibold">Login as admin</Link></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-2">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Points for Playing a Match</label>
          <input type="number" value={pointsForPlay} onChange={e => setPointsForPlay(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Additional Points for Winning</label>
          <input type="number" value={pointsForWin} onChange={e => setPointsForWin(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg" />
        </div>
        <button onClick={handleSave} className="w-full bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-cyan-700 transition-colors">Save Settings</button>
        {message && <div className="mt-4 text-center text-green-600">{message}</div>}
      </div>
    </main>
  );
}
