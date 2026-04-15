import { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank, index) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: index + 1,
      });
    });
  });
  return deck;
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const canPlayCard = (card: Card, topCard: Card, wildSuit: Suit | null): boolean => {
  // 8 is always playable
  if (card.rank === '8') return true;

  // If wild suit is set (after an 8), check against that
  if (wildSuit) {
    return card.suit === wildSuit;
  }

  // Otherwise check suit or rank match
  return card.suit === topCard.suit || card.rank === topCard.rank;
};

export const getSuitSymbol = (suit: Suit): string => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
};

export const getSuitColor = (suit: Suit): string => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-500' : 'text-slate-900';
};
