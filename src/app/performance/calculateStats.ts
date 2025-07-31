import { OpponentStats, Match, Player } from './types';

export function calculatePerformanceStats(
  selectedUserId: string,
  allUsers: Player[],
  matches: Match[]
): OpponentStats[] {
  if (!selectedUserId || allUsers.length === 0) {
    return [];
  }

  const finalStatsMap: Map<string, OpponentStats> = new Map(
    allUsers
      .filter((user) => user._id !== selectedUserId)
      .map((user) => [
        user._id,
        { id: user._id, name: user.name, wonWith: 0, wonAgainst: 0, lostAgainst: 0 },
      ])
  );

  for (const match of matches) {
    const isUserInMatch =
      (match.matchType === '1v1' && (match.playerOne?._id === selectedUserId || match.playerTwo?._id === selectedUserId)) ||
      (match.matchType === '2v2' &&
        (match.team1?.player1?._id === selectedUserId ||
          match.team1?.player2?._id === selectedUserId ||
          match.team2?.player1?._id === selectedUserId ||
          match.team2?.player2?._id === selectedUserId));

    if (!isUserInMatch) continue;

    if (match.matchType === '1v1' && match.playerOne && match.playerTwo && match.winner) {
      const opponent = match.playerOne._id === selectedUserId ? match.playerTwo : match.playerOne;
      const stat = finalStatsMap.get(opponent._id);
      if (stat) {
        if (match.winner._id === selectedUserId) {
          stat.wonAgainst++;
        } else {
          stat.lostAgainst++;
        }
      }
    } else if (match.matchType === '2v2' && match.team1 && match.team2 && match.winnerTeam) {
      let userTeam;
      if (match.team1?.player1?._id === selectedUserId || match.team1?.player2?._id === selectedUserId) {
        userTeam = match.team1;
      } else if (match.team2?.player1?._id === selectedUserId || match.team2?.player2?._id === selectedUserId) {
        userTeam = match.team2;
      }

      if (!userTeam) continue;

      const opponentTeam = userTeam === match.team1 ? match.team2 : match.team1;
      const userTeamName = userTeam === match.team1 ? 'team1' : 'team2';
      const isWinner = match.winnerTeam === userTeamName;

      if (isWinner) {
        let partner: Player | null | undefined = null;
        if (userTeam.player1?._id === selectedUserId) partner = userTeam.player2;
        else if (userTeam.player2?._id === selectedUserId) partner = userTeam.player1;

        if (partner) {
          const stat = finalStatsMap.get(partner._id);
          if (stat) {
            stat.wonWith++;
          }
        }

        [opponentTeam.player1, opponentTeam.player2].forEach(opp => {
          if (opp) {
            const stat = finalStatsMap.get(opp._id);
            if (stat) {
              stat.wonAgainst++;
            }
          }
        });
      } else {
        [opponentTeam.player1, opponentTeam.player2].forEach(opp => {
          if (opp) {
            const stat = finalStatsMap.get(opp._id);
            if (stat) {
              stat.lostAgainst++;
            }
          }
        });
      }
    }
  }

  return Array.from(finalStatsMap.values());
}
