import React from 'react';
import { Suit } from '../types';
import { getSuitSymbol, getSuitColor } from '../lib/game-logic';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface SuitSelectorProps {
  isOpen: boolean;
  onSelect: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ isOpen, onSelect }) => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-[#082E23] border-2 border-[#E6B325] rounded-none text-[#F5F5F0]">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl italic text-[#E6B325]">选择新花色</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-6">
          {suits.map((suit) => {
            const suitNames: Record<Suit, string> = {
              hearts: '红心',
              diamonds: '方块',
              clubs: '梅花',
              spades: '黑桃'
            };
            return (
              <Button
                key={suit}
                variant="outline"
                className="h-32 text-5xl flex flex-col gap-2 bg-white/5 border-[#E6B325]/30 hover:bg-[#E6B325] hover:text-[#0B3D2E] rounded-none transition-all duration-300"
                onClick={() => onSelect(suit)}
              >
                <span className={getSuitColor(suit)}>{getSuitSymbol(suit)}</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">{suitNames[suit]}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
