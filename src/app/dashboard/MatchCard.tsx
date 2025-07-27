import { useState } from 'react';
import { toast } from 'react-hot-toast';

function getStatusChip(status: string) {
  switch (status) {
    case 'completed': return { text: 'Completed', className: 'bg-green-100 text-green-800' };
    case 'declined': return { text: 'Declined', className: 'bg-red-100 text-red-800' };
    case 'pending': return { text: 'Pending', className: 'bg-amber-100 text-amber-800' };
    case 'accepted': return { text: 'Accepted', className: 'bg-blue-100 text-blue-800' };
    default: return { text: status, className: 'bg-slate-100 text-slate-800' };
  }
}

export default function MatchCard({ match, userId, onUpdate }: { match: any, userId: string, onUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const opponent = match.playerOne._id === userId ? match.playerTwo : match.playerOne;
  const isPlayerOne = match.playerOne._id === userId;
  const { text: statusText, className: statusClassName } = getStatusChip(match.status);

  const updateMatch = async (body: Record<string, string>) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${match._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to update match');
      toast.success('Match updated successfully!');
      onUpdate();
    } catch (error) {
      toast.error('An error occurred while updating the match.');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSetResult = (winnerId: string) => updateMatch({ winnerId, status: 'completed' });

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* --- Top Section: Info & Status --- */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div>
          <p className="font-semibold text-slate-800">
            {isPlayerOne ? 'You' : match.playerOne.name} vs {isPlayerOne ? opponent.name : 'You'}
          </p>
          <p className="text-sm text-slate-500">
            {new Date(match.scheduledDate).toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${statusClassName}`}>
          {statusText}
        </span>
      </div>

      {/* --- Action: Set Result (for pending/accepted matches) --- */}
      {(match.status === 'accepted' || match.status === 'pending') && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-600 mb-2">Who won the match?</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleSetResult(match.playerOne._id)}
              disabled={isUpdating}
              className="flex-1 px-3 py-2 text-sm rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              {isPlayerOne ? 'I Won' : `${match.playerOne.name} Won`}
            </button>
            <button
              onClick={() => handleSetResult(match.playerTwo._id)}
              disabled={isUpdating}
              className="flex-1 px-3 py-2 text-sm rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              {!isPlayerOne ? 'I Won' : `${match.playerTwo.name} Won`}
            </button>
          </div>
        </div>
      )}

      {/* --- Info: Completed Match Result --- */}
      {match.status === 'completed' && match.winner && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
          <p className="font-medium text-slate-700">
            🏆 Winner: <span className="font-bold text-green-600">{match.winner._id === userId ? 'You' : match.winner.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}