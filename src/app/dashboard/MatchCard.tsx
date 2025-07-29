import { useState } from 'react';
import { toast } from 'react-hot-toast';
import EditMatchModal from './EditMatchModal';

type Player = {
  _id: string;
  name: string;
  email?: string;
};

type Team = {
  player1: Player | null;
  player2: Player | null;
};

type Match = {
  _id: string;
  matchType: '1v1' | '2v2';
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  scheduledDate: string;
  playerOne?: Player | null;
  playerTwo?: Player | null;
  team1?: Team | null;
  team2?: Team | null;
  winnerTeam?: 'team1' | 'team2';
  winner?: Player | null;
};

function getStatusChip(status: string) {
  switch (status) {
    case 'completed': return { text: 'Completed', className: 'bg-green-100 text-green-800' };
    case 'declined': return { text: 'Declined', className: 'bg-red-100 text-red-800' };
    case 'pending': return { text: 'Pending', className: 'bg-amber-100 text-amber-800' };
    case 'accepted': return { text: 'Accepted', className: 'bg-blue-100 text-blue-800' };
    default: return { text: status, className: 'bg-slate-100 text-slate-800' };
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  // Always show in IST (Asia/Kolkata)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  };
  return date.toLocaleString('en-IN', options) + ' IST';
}

export default function MatchCard({ match, userId, userRole, onUpdate }: { match: Match; userId: string; userRole?: string; onUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const { text: statusText, className: statusClassName } = getStatusChip(match.status);
  const is2v2 = match.matchType === '2v2';

  // Determine if current user is in team1 or team2 for 2v2 matches
  let userTeam: Team | null = null;
  let opponentTeam: Team | null = null;
  let isInTeam1 = false;
  
  if (is2v2) {
    isInTeam1 = match.team1?.player1?._id === userId || 
                match.team1?.player2?._id === userId;
    userTeam = isInTeam1 ? match.team1 || null : match.team2 || null;
    opponentTeam = isInTeam1 ? match.team2 || null : match.team1 || null;
  } else {
    // For 1v1 matches
    const isPlayerOne = match.playerOne?._id === userId;
    userTeam = {
      player1: isPlayerOne ? match.playerOne || null : match.playerTwo || null,
      player2: null
    };
    opponentTeam = {
      player1: isPlayerOne ? match.playerTwo || null : match.playerOne || null,
      player2: null
    };
  }

  const updateMatch = async (body: Record<string, any>) => {
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${match._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete match');
      }
      toast.success('Match deleted successfully!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetResult = (winnerTeam: 'team1' | 'team2') => {
    // For 2v2 matches, we need to determine the winner's ID based on the team
    if (is2v2) {
      const winningTeam = winnerTeam === 'team1' ? match.team1 : match.team2;
      // Send the first player's ID as the winner for now
      // You might want to update this to handle both players in the team
      const winnerId = winningTeam?.player1?._id;
      updateMatch({ winnerId, status: 'completed', winnerTeam });
    } else {
      // For 1v1 matches, use the player ID directly
      const winnerId = winnerTeam === 'team1' ? match.playerOne?._id : match.playerTwo?._id;
      updateMatch({ winnerId, status: 'completed' });
    }
  };

  const renderPlayer = (player: Player | null | undefined, isCurrentUser: boolean) => (
    <span className={isCurrentUser ? 'font-bold text-cyan-700' : ''}>
      {player?.name || 'Unknown Player'}
      {isCurrentUser && ' (You)'}
    </span>
  );

  // Debug log to check match data
  console.log('Match data:', {
    matchId: match._id,
    winnerTeam: match.winnerTeam,
    isInTeam1,
    team1: match.team1,
    team2: match.team2,
    userId,
    is2v2
  });

  const renderTeam = (team: Team | null | undefined, isUserTeam = false) => {
    if (!team) return null;
    return (
      <div className={`p-2 rounded ${isUserTeam ? 'bg-cyan-50' : 'bg-slate-50'}`}>
        {team.player1 && renderPlayer(team.player1, team.player1?._id === userId)}
        {team.player2 && (
          <>
            <span className="mx-2 text-slate-400">+</span>
            {renderPlayer(team.player2, team.player2?._id === userId)}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <EditMatchModal 
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        match={match}
        onUpdate={() => {
          onUpdate();
          setEditModalOpen(false);
        }}
        userRole={userRole}
      />
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        {/* --- Top Section: Match Type & Status --- */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">
              {is2v2 ? '2v2 Match' : '1v1 Match'}
            </p>
            <p className="text-sm text-slate-500">
              {formatDate(match.scheduledDate)}
            </p>
        </div>
        <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${statusClassName}`}>
          {statusText}
        </span>
      </div>

      {/* --- Teams Section --- */}
      <div className="space-y-2 my-4">
        {is2v2 ? (
          <>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">Your Team</p>
              {renderTeam(userTeam, true)}
            </div>
            <div className="text-center text-lg font-bold text-slate-500">VS</div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">Opponent Team</p>
              {renderTeam(opponentTeam)}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              {renderTeam(userTeam, true)}
              <span className="text-slate-400">vs</span>
              {renderTeam(opponentTeam)}
            </div>
          </div>
        )}
      </div>

      {/* --- Action Buttons --- */}
      {(match.status === 'accepted' || match.status === 'pending') && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-600 mb-2">
            {is2v2 ? 'Which team won?' : 'Who won the match?'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleSetResult(isInTeam1 ? 'team1' : 'team2')}
              disabled={isUpdating}
              className="flex-1 px-3 py-2 text-sm rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              {is2v2 ? 'Your Team Won' : `${match.playerOne?._id === userId ? 'I' : match.playerOne?.name} Won`}
            </button>
            <button
              onClick={() => handleSetResult(isInTeam1 ? 'team2' : 'team1')}
              disabled={isUpdating}
              className="flex-1 px-3 py-2 text-sm rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              {is2v2 ? 'Opponent Team Won' : `${match.playerTwo?._id === userId ? 'I' : match.playerTwo?.name} Won`}
            </button>
          </div>
        </div>
      )}

      {/* --- Match Result --- */}
      {/* --- Admin & Edit Actions --- */}
      {(userRole === 'admin' || match.status === 'completed') && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button 
            onClick={() => setEditModalOpen(true)} 
            className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
            disabled={isUpdating}>
              Edit
          </button>
          {userRole === 'admin' && (
              <button 
                onClick={handleDelete} 
                className="px-3 py-1 text-xs font-semibold rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors disabled:opacity-50"
                disabled={isUpdating}>
                  Delete
              </button>
          )}
        </div>
      )}

      {/* --- Match Result --- */}
      {match.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
          <p className="font-medium text-slate-700">
            🏆 Winner: <span className="font-bold text-green-600">
              {is2v2 
                ? (match.winnerTeam === 'team1' 
                    ? (isInTeam1 ? 'Your Team' : 'Opponent Team')
                    : match.winnerTeam === 'team2'
                      ? (isInTeam1 ? 'Opponent Team' : 'Your Team')
                      : 'Unknown Team')
                : (match.winner?._id === userId ? 'You' : match.winner?.name || 'Unknown')
              }
            </span>
            {is2v2 && match.winnerTeam && (
              <span className="ml-2 text-xs text-slate-500">
                (Team {match.winnerTeam === 'team1' ? '1' : '2'})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
    </>
  );
}