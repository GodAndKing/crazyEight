import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, GameState, Suit, Turn } from './types';
import { createDeck, shuffle, canPlayCard, getSuitSymbol, getSuitColor } from './lib/game-logic';
import { PlayingCard } from './components/PlayingCard';
import { SuitSelector } from './components/SuitSelector';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { cn } from './lib/utils';
import { Trophy, RotateCcw, Info, Play } from 'lucide-react';

export default function App() {
  const [game, setGame] = useState<GameState>({
    playerHand: [],
    aiHand: [],
    drawPile: [],
    discardPile: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    wildSuit: null,
  });

  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const getSuitName = (suit: Suit) => {
    const names: Record<Suit, string> = {
      hearts: '红心',
      diamonds: '方块',
      clubs: '梅花',
      spades: '黑桃'
    };
    return names[suit];
  };

  const startNewGame = useCallback(() => {
    setStatusMessage("游戏开始！轮到你了。");
    const deck = shuffle(createDeck());
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    const firstDiscard = deck.splice(0, 1);
    
    // If the first discard is an 8, reshuffle or just pick another
    // For simplicity, we'll just ensure it's not an 8 for the very first card
    if (firstDiscard[0].rank === '8') {
      deck.push(firstDiscard[0]);
      const newFirstDiscard = deck.splice(0, 1);
      setGame({
        playerHand,
        aiHand,
        drawPile: deck,
        discardPile: newFirstDiscard,
        currentTurn: 'player',
        status: 'playing',
        winner: null,
        wildSuit: null,
      });
    } else {
      setGame({
        playerHand,
        aiHand,
        drawPile: deck,
        discardPile: firstDiscard,
        currentTurn: 'player',
        status: 'playing',
        winner: null,
        wildSuit: null,
      });
    }
  }, []);

  const checkWinner = (gameState: GameState) => {
    if (gameState.playerHand.length === 0) return 'player';
    if (gameState.aiHand.length === 0) return 'ai';
    return null;
  };

  const handlePlayCard = (card: Card, isPlayer: boolean) => {
    if (game.status !== 'playing') return;
    if (isPlayer && game.currentTurn !== 'player') return;
    if (!isPlayer && game.currentTurn !== 'ai') return;

    const topCard = game.discardPile[game.discardPile.length - 1];
    if (!canPlayCard(card, topCard, game.wildSuit)) return;

    if (card.rank === '8') {
      if (isPlayer) {
        setPendingCard(card);
        setShowSuitSelector(true);
        return;
      } else {
        // AI logic for 8: pick the suit it has most of
        const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
        game.aiHand.forEach(c => {
          if (c.id !== card.id) suitCounts[c.suit]++;
        });
        const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
        executePlay(card, isPlayer, bestSuit);
        return;
      }
    }

    executePlay(card, isPlayer, null);
  };

  const executePlay = (card: Card, isPlayer: boolean, newWildSuit: Suit | null) => {
    if (newWildSuit) {
      setStatusMessage(`${isPlayer ? '你' : 'AI'} 打出了 8，并选择了 ${getSuitName(newWildSuit)}！`);
    } else {
      setStatusMessage("");
    }
    setGame(prev => {
      const handKey = isPlayer ? 'playerHand' : 'aiHand';
      const newHand = prev[handKey].filter(c => c.id !== card.id);
      const newDiscardPile = [...prev.discardPile, card];
      
      const nextTurn: Turn = isPlayer ? 'ai' : 'player';
      
      const newState: GameState = {
        ...prev,
        [handKey]: newHand,
        discardPile: newDiscardPile,
        currentTurn: nextTurn,
        wildSuit: newWildSuit,
      };

      const winner = checkWinner(newState);
      if (winner) {
        newState.status = 'gameover';
        newState.winner = winner;
      }

      return newState;
    });
  };

  const handleDrawCard = (isPlayer: boolean) => {
    if (game.status !== 'playing') return;
    if (isPlayer && game.currentTurn !== 'player') return;
    if (!isPlayer && game.currentTurn !== 'ai') return;

    if (game.drawPile.length === 0) {
      setStatusMessage(isPlayer ? "牌堆已空！跳过你的回合。" : "牌堆已空！跳过 AI 的回合。");
      setGame(prev => ({ ...prev, currentTurn: isPlayer ? 'ai' : 'player' }));
      return;
    }

    setStatusMessage(isPlayer ? "你摸了一张牌。" : "AI 摸了一张牌。");
    setGame(prev => {
      const newDrawPile = [...prev.drawPile];
      const drawnCard = newDrawPile.pop()!;
      const handKey = isPlayer ? 'playerHand' : 'aiHand';
      const newHand = [...prev[handKey], drawnCard];
      
      return {
        ...prev,
        drawPile: newDrawPile,
        [handKey]: newHand,
        currentTurn: isPlayer ? 'ai' : 'player',
      };
    });
  };

  const handleSuitSelect = (suit: Suit) => {
    if (pendingCard) {
      executePlay(pendingCard, true, suit);
      setPendingCard(null);
      setShowSuitSelector(false);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (game.status === 'playing' && game.currentTurn === 'ai') {
      const timer = setTimeout(() => {
        const topCard = game.discardPile[game.discardPile.length - 1];
        
        // 1. Try to play a normal card
        const playableNormal = game.aiHand.find(c => c.rank !== '8' && canPlayCard(c, topCard, game.wildSuit));
        if (playableNormal) {
          handlePlayCard(playableNormal, false);
          return;
        }

        // 2. Try to play an 8
        const playableEight = game.aiHand.find(c => c.rank === '8');
        if (playableEight) {
          handlePlayCard(playableEight, false);
          return;
        }

        // 3. Draw a card
        handleDrawCard(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [game.status, game.currentTurn, game.aiHand, game.discardPile, game.wildSuit]);

  const topDiscard = game.discardPile[game.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-[#0B3D2E] text-[#F5F5F0] font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#082E23] border-r-2 border-[#E6B325] p-10 flex flex-col justify-between shrink-0">
        <div>
          <h1 className="text-3xl italic text-[#E6B325] leading-tight mb-5">Tina's<br />Crazy 8s</h1>
          
          <div className="mt-10 space-y-6">
            <div className="stat-item">
              <div className="text-[12px] uppercase tracking-[2px] opacity-60">你的手牌</div>
              <div className="text-2xl font-light">{game.playerHand.length}</div>
            </div>
            <div className="stat-item">
              <div className="text-[12px] uppercase tracking-[2px] opacity-60">AI 手牌</div>
              <div className="text-2xl font-light">{game.aiHand.length}</div>
            </div>
            <div className="stat-item">
              <div className="text-[12px] uppercase tracking-[2px] opacity-60">牌堆</div>
              <div className="text-2xl font-light">{game.drawPile.length}</div>
            </div>
          </div>

          {game.wildSuit && (
            <div className="bg-white/5 p-5 rounded-xl border border-[#E6B325]/30 mt-10">
              <span className={cn("text-5xl block text-center mb-2", getSuitColor(game.wildSuit))}>
                {getSuitSymbol(game.wildSuit)}
              </span>
              <div className="text-center text-sm uppercase tracking-widest">
                当前花色:<br /><strong className="text-[#E6B325]">{getSuitName(game.wildSuit)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-[#082E23] rounded-none uppercase tracking-widest text-xs"
            onClick={() => startNewGame()}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> 重新开始
          </Button>
        </div>
      </aside>

      {/* Game Board */}
      <main className="flex-grow relative flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]">
        {game.status === 'waiting' ? (
          <div className="flex-grow flex flex-col items-center justify-center gap-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <h2 className="text-7xl font-black italic text-[#E6B325] drop-shadow-2xl">疯狂 8 点</h2>
              <p className="text-emerald-100/60 text-xl max-w-md mx-auto">经典的策略与运气纸牌游戏。率先清空你的手牌！</p>
            </motion.div>
            <Button 
              size="lg" 
              className="bg-[#E6B325] hover:bg-[#E6B325]/80 text-[#0B3D2E] font-bold text-xl px-12 py-8 rounded-none shadow-2xl" 
              onClick={startNewGame}
            >
              <Play className="w-6 h-6 mr-2 fill-current" /> 开始游戏
            </Button>
          </div>
        ) : (
          <>
            {/* AI Hand */}
            <div className="flex flex-col items-center gap-4">
              {game.currentTurn === 'ai' && (
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-[#E6B325] text-sm font-bold tracking-widest uppercase"
                >
                  AI 正在思考...
                </motion.div>
              )}
              <div className="flex justify-center gap-3">
                <AnimatePresence>
                  {game.aiHand.map((card) => (
                    <PlayingCard 
                      key={card.id} 
                      card={card} 
                      isFaceUp={false} 
                      className="scale-90"
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Center Area: Deck and Discard */}
            <div className="flex flex-col items-center gap-10">
              <AnimatePresence mode="wait">
                {statusMessage && (
                  <motion.div
                    key={statusMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-black/40 px-6 py-2 rounded-full text-sm font-medium text-[#E6B325] border border-[#E6B325]/30 backdrop-blur-sm"
                  >
                    {statusMessage}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center gap-20">
                {/* Draw Pile */}
                <div className="relative group cursor-pointer" onClick={() => handleDrawCard(true)}>
                  <div className="absolute -inset-2 bg-[#E6B325] rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative">
                    <PlayingCard card={{} as Card} isFaceUp={false} className="shadow-2xl" />
                    <div className="absolute -top-3 -right-3 bg-[#E6B325] text-[#0B3D2E] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-[#0B3D2E]">
                      {game.drawPile.length}
                    </div>
                  </div>
                  <p className="absolute -bottom-8 w-full text-center text-[10px] uppercase tracking-[2px] opacity-50">摸牌堆</p>
                </div>

                {/* Discard Pile */}
                <div className="relative">
                  <AnimatePresence mode="popLayout">
                    <PlayingCard 
                      key={topDiscard.id} 
                      card={topDiscard} 
                      className="shadow-2xl"
                    />
                  </AnimatePresence>
                  <p className="absolute -bottom-8 w-full text-center text-[10px] uppercase tracking-[2px] opacity-50">弃牌堆</p>
                </div>
              </div>
            </div>

            {/* Turn Indicator */}
            <div className={cn(
              "absolute bottom-[200px] left-1/2 -translate-x-1/2 px-6 py-1 rounded-full font-bold text-sm uppercase tracking-widest transition-all duration-500",
              game.currentTurn === 'player' ? "bg-[#E6B325] text-[#0B3D2E] scale-110" : "bg-white/10 text-white/40"
            )}>
              {game.currentTurn === 'player' ? "你的回合" : "AI 的回合"}
            </div>

            {/* Player Hand */}
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
              <AnimatePresence>
                {game.playerHand.map((card) => (
                  <PlayingCard 
                    key={card.id} 
                    card={card} 
                    isPlayable={game.currentTurn === 'player' && canPlayCard(card, topDiscard, game.wildSuit)}
                    onClick={() => handlePlayCard(card, true)}
                    className="hover:-translate-y-5 transition-transform"
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Suit Selector Modal */}
      <SuitSelector 
        isOpen={showSuitSelector} 
        onSelect={handleSuitSelect} 
      />

      {/* Game Over Modal */}
      <AnimatePresence>
        {game.status === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#082E23] border-2 border-[#E6B325] rounded-none p-10 max-w-sm w-full text-center shadow-[0_0_50px_rgba(230,179,37,0.2)]"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-[#E6B325] rounded-full flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-[#0B3D2E]" />
                </div>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 italic">
                {game.winner === 'player' ? "胜利！" : "失败！"}
              </h2>
              <p className="text-emerald-200/60 mb-8">
                {game.winner === 'player' 
                  ? "恭喜！你已经清空了所有手牌，赢得了比赛。" 
                  : "这次 AI 更快一步。下次好运！"}
              </p>
              <Button 
                size="lg" 
                className="w-full bg-[#E6B325] hover:bg-[#E6B325]/80 text-[#0B3D2E] font-bold text-xl py-6 rounded-none"
                onClick={startNewGame}
              >
                再玩一次
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
