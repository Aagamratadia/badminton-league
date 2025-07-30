'use client';

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
      const team1Name = `${match.team1?.player1?.name} & ${match.team1?.player2?.name}`;
      const team2Name = `${match.team2?.player1?.name} & ${match.team2?.player2?.name}`;
      return (
        <>
          <option value="team1">{team1Name}</option>
          <option value="team2">{team2Name}</option>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Edit Match Result</h2>
        
        <div>
          <label htmlFor="winner-select" className="block text-sm font-medium text-slate-700 mb-1">Winner</label>
          <select 
            id="winner-select"
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="">-- Select Winner --</option>
            {renderWinnerOptions()}
          </select>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md bg-slate-200 hover:bg-slate-300 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
