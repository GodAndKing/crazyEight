export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export type GameStatus = 'waiting' | 'playing' | 'gameover';
export type Turn = 'player' | 'ai';

export interface GameState {
  playerHand: Card[];
  aiHand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: Turn;
  status: GameStatus;
  winner: Turn | null;
  wildSuit: Suit | null; // For when an 8 is played
}
