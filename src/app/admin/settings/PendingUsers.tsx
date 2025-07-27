"use client";
import { useEffect, useState } from "react";

export default function PendingUsers() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

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

  async function approveUser(userId: string) {
    setApproving(userId);
    setError("");
    const res = await fetch("/api/admin/pending-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      setPending(pending.filter(u => u._id !== userId));
    } else {
      setError("Failed to approve user");
    }
    setApproving(null);
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
            <li key={user._id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-slate-500 text-sm">{user.email}</div>
              </div>
              <button
                className="bg-cyan-600 text-white px-4 py-1 rounded hover:bg-cyan-700 disabled:opacity-60"
                disabled={approving === user._id}
                onClick={() => approveUser(user._id)}
              >
                {approving === user._id ? "Approving..." : "Approve"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="text-red-600 text-sm mt-4 text-center">{error}</div>}
    </div>
  );
}
