"use client";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  match: any;
  userRole?: string;
}

export default function EditMatchModal({ isOpen, onClose, onUpdate, match, userRole }: EditMatchModalProps) {
  const [winner, setWinner] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (match) {
      if (match.matchType === '1v1') {
        setWinner(match.winner?._id || '');
      } else {
        setWinner(match.winnerTeam || '');
      }
    }
  }, [match]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body = match.matchType === '1v1'
        ? { winnerId: winner, status: 'completed' }
        : { winnerTeam: winner, status: 'completed' };

      const response = await fetch(`/api/matches/${match._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update match');
      }

      toast.success('Match updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('An error occurred while updating the match.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderWinnerOptions = () => {
    if (match.matchType === '1v1') {
      return [
        { id: match.playerOne?._id, name: match.playerOne?.name },
        { id: match.playerTwo?._id, name: match.playerTwo?.name },
      ].map(player => (
        player.id && <option key={player.id} value={player.id}>{player.name}</option>
      ));
    } else {
      return (
        <>
          <option value="team1">Team 1</option>
          <option value="team2">Team 2</option>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Match Result</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Winner</label>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={winner}
            onChange={e => setWinner(e.target.value)}
            disabled={isSaving}
          >
            <option value="">Select winner...</option>
            {renderWinnerOptions()}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
            onClick={handleSave}
            disabled={isSaving || !winner}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
