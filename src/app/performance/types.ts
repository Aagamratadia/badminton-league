// Type definitions
export interface Player {
  _id: string;
  name: string;
  role?: string;
}

export interface Team {
  player1: Player | null;
  player2: Player | null;
}

export interface Match {
  _id: string;
  matchType: '1v1' | '2v2';
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  playerOne?: Player | null;
  playerTwo?: Player | null;
  team1?: Team | null;
  team2?: Team | null;
  winner?: Player | null;
  winnerTeam?: 'team1' | 'team2';
}

export interface OpponentStats {
  id: string;
  name: string;
  wonWith: number;
  wonAgainst: number;
  lostAgainst: number;
}
