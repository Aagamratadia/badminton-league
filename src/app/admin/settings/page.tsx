"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import PendingUsers from "./PendingUsers";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const [pointsForWin, setPointsForWin] = useState(3);
  const [pointsForPlay, setPointsForPlay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setPointsForWin(data.pointsForWin);
        setPointsForPlay(data.pointsForPlay);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  if (status === "loading" || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status === "unauthenticated") return <div className="min-h-screen flex items-center justify-center">Please login as admin.</div>;
  if (session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center">Access denied. Admins only.</div>;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointsForWin, pointsForPlay })
    });
    if (!res.ok) {
      setError("Failed to update settings");
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-2">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Settings</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block font-medium mb-1">Points for Win</label>
            <input
              type="number"
              value={pointsForWin}
              onChange={e => setPointsForWin(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-2"
              min={0}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Points for Participation</label>
            <input
              type="number"
              value={pointsForPlay}
              onChange={e => setPointsForPlay(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-2"
              min={0}
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
      <PendingUsers />
    </main>
  );
}
