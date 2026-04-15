import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../types';
import { getSuitSymbol, getSuitColor } from '../lib/game-logic';
import { cn } from '../lib/utils';

interface PlayingCardProps {
  card: Card;
  isFaceUp?: boolean;
  onClick?: () => void;
  className?: string;
  isPlayable?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceUp = true,
  onClick,
  className,
  isPlayable = false,
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColor = isRed ? 'text-[#E94F37]' : 'text-[#2D3047]';

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={isPlayable ? { y: -20, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={cn(
        "relative w-[100px] h-[145px] rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.3)] cursor-pointer transition-transform duration-200 overflow-hidden",
        isFaceUp ? "bg-white" : "card-back-pattern border-4 border-white",
        isPlayable && "ring-4 ring-[#E6B325] shadow-[#E6B325]/50",
        !isPlayable && isFaceUp && "opacity-90 grayscale-[0.2]",
        className
      )}
    >
      {isFaceUp ? (
        <div className={cn("flex flex-col h-full p-2 select-none font-sans", suitColor)}>
          {/* Corner marks */}
          <div className="absolute top-2 left-2 flex flex-col items-center leading-none">
            <span className="text-sm font-bold">{card.rank}</span>
            <span className="text-xs">{getSuitSymbol(card.suit)}</span>
          </div>
          
          <div className="absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180">
            <span className="text-sm font-bold">{card.rank}</span>
            <span className="text-xs">{getSuitSymbol(card.suit)}</span>
          </div>

          {/* Center content */}
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="text-4xl font-bold leading-none mb-1">{card.rank}</div>
            <div className="text-3xl leading-none">{getSuitSymbol(card.suit)}</div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-16 h-24 border-2 border-white/20 rounded-lg flex items-center justify-center">
            <div className="text-white/20 text-2xl font-bold italic tracking-tighter">TINA</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
