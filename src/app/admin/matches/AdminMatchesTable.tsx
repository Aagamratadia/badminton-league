"use client";
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import EditMatchModal from './EditMatchModal';

interface AdminMatchesTableProps {
  matches: any[];
  onUpdate?: () => void;
}

function MatchRow({ match, onUpdate }: { match: any; onUpdate?: () => void }) {
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this match? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/matches/${match._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete match');
      toast.success('Match deleted');
      onUpdate?.();
    } catch (err) {
      toast.error('Failed to delete match');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-slate-50">
      <td className="px-4 py-2 whitespace-nowrap">{new Date(match.scheduledDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</td>
      <td className="px-4 py-2 whitespace-nowrap">
        {match.matchType === '2v2' ? (
          <div>
            <span className="font-semibold">Team 1:</span> {match.team1?.player1?.name || '-'} & {match.team1?.player2?.name || '-'}<br />
            <span className="font-semibold">Team 2:</span> {match.team2?.player1?.name || '-'} & {match.team2?.player2?.name || '-'}
          </div>
        ) : (
          <>{match.playerOne?.name || '-'} vs {match.playerTwo?.name || '-'}</>
        )}
      </td>
      <td className="px-4 py-2 whitespace-nowrap capitalize">{match.status}</td>
      <td className="px-4 py-2 whitespace-nowrap">
        {match.matchType === '2v2'
          ? match.winnerTeam === 'team1'
            ? 'Team 1'
            : match.winnerTeam === 'team2'
              ? 'Team 2'
              : '-'
          : match.winner?.name || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap flex gap-2">
        <button className="text-cyan-600 hover:text-cyan-800" title="Edit" onClick={() => setEditOpen(true)}>
          <Pencil className="w-4 h-4" />
        </button>
        <button className="text-red-500 hover:text-red-700" title="Delete" onClick={handleDelete} disabled={isDeleting}>
          <Trash2 className="w-4 h-4" />
        </button>
        <EditMatchModal
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          onUpdate={onUpdate || (() => {})}
          match={match}
          userRole="admin"
        />
      </td>
    </tr>
  );
}

export default function AdminMatchesTable({ matches, onUpdate }: AdminMatchesTableProps) {
  return (
    <section className="bg-white/90 rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10">

      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Date/Time</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Players / Teams</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Winner</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-12">No matches found.</td>
              </tr>
            ) : (
              matches.map((match: any, idx: number) => (
                <>
                  <MatchRow key={match._id} match={match} onUpdate={onUpdate} />
                  {idx < matches.length - 1 && (
                    <tr key={match._id + '-divider'}>
                      <td colSpan={5} className="py-0">
                        <div className="border-t border-slate-200 mx-2" />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
