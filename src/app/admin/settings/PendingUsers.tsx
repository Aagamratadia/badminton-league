"use client";
import { useEffect, useState } from "react";

export default function PendingUsers() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<{id: string | null, action: 'approve' | 'reject' | null}>({ id: null, action: null });

  useEffect(() => {
    async function fetchPending() {
      setLoading(true);
      const res = await fetch("/api/admin/pending-users");
      if (res.ok) {
        setPending(await res.json());
      } else {
        setError("Failed to fetch pending users");
      }
      setLoading(false);
    }
    fetchPending();
  }, []);

  async function updateUserStatus(userId: string, action: 'approve' | 'reject') {
    setProcessing({ id: userId, action });
    setError("");
    try {
      const res = await fetch("/api/admin/pending-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      
      if (res.ok) {
        setPending(pending.filter(u => u._id !== userId));
      } else {
        const errorData = await res.json();
        setError(errorData.message || `Failed to ${action} user`);
      }
    } catch (err) {
      setError(`Error ${action === 'approve' ? 'approving' : 'rejecting'} user`);
    } finally {
      setProcessing({ id: null, action: null });
    }
  }

  return (
    <div className="mt-10 bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4 text-center text-cyan-700">Pending User Approvals</h2>
      {loading ? (
        <div className="text-center py-6">Loading...</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-6 text-green-600">No pending users.</div>
      ) : (
        <ul className="space-y-4">
          {pending.map(user => (
            <li key={user._id} className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-slate-500 text-sm">{user.email}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-60 text-sm"
                  disabled={!!processing.id}
                  onClick={() => updateUserStatus(user._id, 'approve')}
                >
                  {processing.id === user._id && processing.action === 'approve' ? (
                    'Approving...'
                  ) : 'Approve'}
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-60 text-sm"
                  disabled={!!processing.id}
                  onClick={() => updateUserStatus(user._id, 'reject')}
                >
                  {processing.id === user._id && processing.action === 'reject' ? (
                    'Rejecting...'
                  ) : 'Reject'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="text-red-600 text-sm mt-4 text-center">{error}</div>}
    </div>
  );
}
