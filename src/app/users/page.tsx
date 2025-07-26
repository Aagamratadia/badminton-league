'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/users/list')
        .then(res => res.json())
        .then(data => { setUsers(data); setLoading(false); });
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return <div className="min-h-screen flex items-center justify-center">Please <Link href="/login" className="text-cyan-600 font-semibold">login</Link> to view users.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-2">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">All Players</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.filter(u => u._id !== session?.user.id).map(user => (
            <div key={user._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-slate-500">{user.points} Points</p>
              </div>
              <Link href={`/schedule/${user._id}`} className="bg-cyan-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-sm hover:bg-cyan-700 transition-colors">Challenge</Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
