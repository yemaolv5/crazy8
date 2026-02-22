/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Diamond, 
  Club, 
  Spade, 
  RotateCcw, 
  Trophy, 
  User, 
  Cpu,
  Info,
  ChevronRight,
  Play,
  HelpCircle
} from 'lucide-react';
import { Card, Suit, Rank, GameState, GameStatus } from './types';
import { createDeck, isValidMove, SUITS } from './constants';

const SuitIcon = ({ suit, className = "w-6 h-6" }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'hearts': return <Heart className={`${className} text-red-500 fill-red-500`} />;
    case 'diamonds': return <Diamond className={`${className} text-red-500 fill-red-500`} />;
    case 'clubs': return <Club className={`${className} text-black fill-black`} />;
    case 'spades': return <Spade className={`${className} text-black fill-black`} />;
  }
};

const PlayingCard = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = "",
  style = {}
}: { 
  card: Card; 
  isFaceUp?: boolean; 
  onClick?: () => void; 
  isPlayable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  key?: React.Key;
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      style={style}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-lg card-shadow flex flex-col items-center justify-between cursor-pointer select-none
        ${isFaceUp ? 'p-2' : 'p-0'}
        ${isPlayable ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-felt' : ''}
        ${className}
      `}
    >
      {isFaceUp ? (
        <>
          <div className="self-start flex flex-col items-center">
            <span className={`text-lg font-bold leading-none ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center">
            <SuitIcon suit={card.suit} className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="self-end flex flex-col items-center rotate-180">
            <span className={`text-lg font-bold leading-none ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'}`}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit} className="w-4 h-4" />
          </div>
        </>
      ) : (
        <div className="w-full h-full rounded-md flex items-center justify-center relative overflow-hidden bg-indigo-900">
          {/* Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '8px 8px'
            }}
          />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(45deg, white 25%, transparent 25%, transparent 75%, white 75%, white), linear-gradient(45deg, white 25%, transparent 25%, transparent 75%, white 75%, white)`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px'
            }}
          />
          
          {/* Central Emblem */}
          <div className="relative z-10 w-14 h-20 sm:w-16 sm:h-24 border-2 border-white/20 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm shadow-inner">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/30 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
               <span className="text-white/40 font-serif italic text-2xl sm:text-3xl select-none">y</span>
            </div>
            {/* Corner Accents */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/30" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-white/30" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-white/30" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/30" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [pendingEightCard, setPendingEightCard] = useState<Card | null>(null);
  const [showRules, setShowRules] = useState(false);

  const initGame = useCallback(() => {
    const deck = createDeck();
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    const discardPile = [deck.pop()!];
    
    const initialCard = discardPile[0];
    
    setGameState({
      playerHand,
      aiHand,
      drawPile: deck,
      discardPile,
      currentSuit: initialCard.suit,
      currentRank: initialCard.rank,
      turn: 'player',
      status: 'playing',
      lastAction: '游戏开始！轮到你了。',
    });
    setShowSuitSelector(false);
    setPendingEightCard(null);
    setIsGameStarted(true);
  }, []);

  const handleDraw = () => {
    if (!gameState || gameState.turn !== 'player' || gameState.status !== 'playing') return;

    const { drawPile, playerHand } = gameState;
    if (drawPile.length === 0) {
      setGameState(prev => prev ? { ...prev, turn: 'ai', lastAction: '摸牌堆已空！跳过回合。' } : null);
      return;
    }

    const newDrawPile = [...drawPile];
    const drawnCard = newDrawPile.pop()!;
    
    setGameState(prev => prev ? {
      ...prev,
      playerHand: [...playerHand, drawnCard],
      drawPile: newDrawPile,
      lastAction: `你摸到了一张 ${getSuitName(drawnCard.suit)} ${drawnCard.rank}。`,
    } : null);
  };

  const getSuitName = (suit: Suit) => {
    switch(suit) {
      case 'hearts': return '红心';
      case 'diamonds': return '方块';
      case 'clubs': return '梅花';
      case 'spades': return '黑桃';
    }
  };

  const playCard = (card: Card, isPlayer: boolean) => {
    if (!gameState) return;

    if (card.rank === '8') {
      if (isPlayer) {
        setPendingEightCard(card);
        setShowSuitSelector(true);
        setGameState(prev => prev ? { ...prev, status: 'waiting_for_suit' } : null);
      } else {
        const aiSuits = gameState.aiHand.filter(c => c.id !== card.id).map(c => c.suit);
        const mostCommonSuit = aiSuits.length > 0 
          ? aiSuits.sort((a,b) => aiSuits.filter(v => v===a).length - aiSuits.filter(v => v===b).length).pop()!
          : SUITS[Math.floor(Math.random() * SUITS.length)];
        
        executeMove(card, mostCommonSuit, false);
      }
    } else {
      executeMove(card, card.suit, isPlayer);
    }
  };

  const executeMove = (card: Card, newSuit: Suit, isPlayer: boolean) => {
    setGameState(prev => {
      if (!prev) return null;

      const hand = isPlayer ? prev.playerHand : prev.aiHand;
      const newHand = hand.filter(c => c.id !== card.id);
      const newStatus: GameStatus = newHand.length === 0 
        ? (isPlayer ? 'player_won' : 'ai_won') 
        : 'playing';

      return {
        ...prev,
        playerHand: isPlayer ? newHand : prev.playerHand,
        aiHand: isPlayer ? prev.aiHand : newHand,
        discardPile: [...prev.discardPile, card],
        currentSuit: newSuit,
        currentRank: card.rank,
        turn: isPlayer ? 'ai' : 'player',
        status: newStatus,
        lastAction: `${isPlayer ? '你' : 'AI'} 打出了 ${getSuitName(card.suit)} ${card.rank}${card.rank === '8' ? `。新花色：${getSuitName(newSuit)}` : ''}。`,
      };
    });
    setShowSuitSelector(false);
    setPendingEightCard(null);
  };

  const handleSuitSelect = (suit: Suit) => {
    if (pendingEightCard) {
      executeMove(pendingEightCard, suit, true);
    }
  };

  useEffect(() => {
    if (gameState?.turn === 'ai' && gameState.status === 'playing') {
      const timer = setTimeout(() => {
        const { aiHand, currentSuit, currentRank, drawPile } = gameState;
        
        // 1. 尝试从现有手牌中出牌
        const playableCards = aiHand.filter(c => isValidMove(c, currentSuit, currentRank));
        const nonEight = playableCards.find(c => c.rank !== '8');
        const eight = playableCards.find(c => c.rank === '8');

        if (nonEight) {
          playCard(nonEight, false);
          return;
        } else if (eight) {
          playCard(eight, false);
          return;
        } 

        // 2. 无牌可出，尝试摸牌
        if (drawPile.length > 0) {
          const newDrawPile = [...drawPile];
          const drawnCard = newDrawPile.pop()!;
          
          // 检查摸到的牌是否可出
          if (isValidMove(drawnCard, currentSuit, currentRank)) {
            // 如果摸到的牌是 8
            if (drawnCard.rank === '8') {
              const aiSuits = aiHand.map(c => c.suit);
              const mostCommonSuit = aiSuits.length > 0 
                ? aiSuits.sort((a,b) => aiSuits.filter(v => v===a).length - aiSuits.filter(v => v===b).length).pop()!
                : SUITS[Math.floor(Math.random() * SUITS.length)];
              
              setGameState(prev => prev ? {
                ...prev,
                aiHand: prev.aiHand, // 牌还没进手牌就打出了，所以手牌不变
                discardPile: [...prev.discardPile, drawnCard],
                drawPile: newDrawPile,
                currentSuit: mostCommonSuit,
                currentRank: '8',
                turn: 'player',
                lastAction: `AI 摸到并打出了 ${getSuitName(drawnCard.suit)} 8。新花色：${getSuitName(mostCommonSuit)}。`,
              } : null);
            } else {
              // 打出摸到的普通牌
              setGameState(prev => prev ? {
                ...prev,
                aiHand: prev.aiHand,
                discardPile: [...prev.discardPile, drawnCard],
                drawPile: newDrawPile,
                currentSuit: drawnCard.suit,
                currentRank: drawnCard.rank,
                turn: 'player',
                lastAction: `AI 摸到并打出了 ${getSuitName(drawnCard.suit)} ${drawnCard.rank}。`,
              } : null);
            }
          } else {
            // 摸到的牌不可出，将牌加入手牌并换人
            setGameState(prev => prev ? {
              ...prev,
              aiHand: [...prev.aiHand, drawnCard],
              drawPile: newDrawPile,
              turn: 'player',
              lastAction: `AI 摸了一张牌并跳过了回合。`,
            } : null);
          }
        } else {
          // 3. 摸牌堆也空了，直接跳过
          setGameState(prev => prev ? {
            ...prev,
            turn: 'player',
            lastAction: 'AI 无牌可出且摸牌堆已空！AI 跳过。',
          } : null);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.turn, gameState?.status]);

  if (!isGameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20">
          <div className="absolute top-10 left-10 rotate-12"><PlayingCard card={{id:'1', suit:'hearts', rank:'A'}} /></div>
          <div className="absolute bottom-10 right-10 -rotate-12"><PlayingCard card={{id:'2', suit:'spades', rank:'8'}} /></div>
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -rotate-6 opacity-50"><PlayingCard card={{id:'3', suit:'diamonds', rank:'K'}} /></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl"
        >
          <div className="inline-block p-4 bg-white/10 rounded-3xl backdrop-blur-xl mb-8 border border-white/20 shadow-2xl">
            <Trophy className="w-16 h-16 text-yellow-400" />
          </div>
          <h1 className="text-6xl sm:text-7xl font-serif italic font-bold tracking-tighter mb-4 text-white drop-shadow-lg">
            yemaolv疯狂 8 点
          </h1>
          <p className="text-xl text-white/60 font-medium mb-12 max-w-md mx-auto leading-relaxed">
            经典的 Crazy Eights 扑克游戏。
            <br />
            运用策略，清空手牌，击败 AI！
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={initGame}
              className="px-12 py-5 bg-white text-zinc-900 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-zinc-100 transition-all hover:scale-105 shadow-xl group"
            >
              <Play className="w-6 h-6 fill-current" />
              开始游戏
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="px-8 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <HelpCircle className="w-6 h-6" />
              游戏规则
            </button>
          </div>
        </motion.div>

        {/* Rules Modal */}
        <AnimatePresence>
          {showRules && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
              >
                <h2 className="text-3xl font-serif italic font-bold mb-6 text-center">游戏规则</h2>
                <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
                  <p>• 初始状态玩家和 AI 各发 8 张牌。</p>
                  <p>• 玩家轮流出牌。所出的牌必须在“花色”或“点数”上与弃牌堆最顶部的牌匹配。</p>
                  <p>• <strong className="text-yellow-400">万能 8 点：</strong> 数字“8”是万用牌。可以在任何时候打出 8，并随后指定一个新的花色。</p>
                  <p>• 如果无牌可出，必须从摸牌堆摸一张牌。</p>
                  <p>• 最先清空手牌的一方获胜。</p>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="w-full mt-8 py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-all"
                >
                  我知道了
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-8 text-white/20 font-mono text-xs tracking-widest uppercase">
          Crafted with passion by yemaolv
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 max-w-5xl mx-auto relative">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-serif italic font-bold tracking-tight">yemaolv疯狂 8 点</h1>
        </div>
        <button 
          onClick={() => setIsGameStarted(false)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-sm font-medium backdrop-blur-sm"
        >
          <RotateCcw className="w-4 h-4" />
          退出游戏
        </button>
      </div>

      {/* AI Area */}
      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-xs font-mono uppercase tracking-widest text-white/60">
          <Cpu className="w-3 h-3" />
          对手手牌 ({gameState.aiHand.length})
        </div>
        <div className="flex -space-x-12 sm:-space-x-16 overflow-visible h-32 sm:h-40 items-center justify-center">
          {gameState.aiHand.map((card, idx) => (
            <PlayingCard 
              key={card.id} 
              card={card} 
              isFaceUp={false} 
              className="transition-transform hover:-translate-y-2"
              style={{ zIndex: idx }}
            />
          ))}
        </div>
      </div>

      {/* Center Table */}
      <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 my-8">
        {/* Draw Pile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {gameState.drawPile.length > 0 ? (
              <div onClick={handleDraw} className="cursor-pointer">
                <div className="absolute top-1 left-1 w-20 h-28 sm:w-24 sm:h-36 bg-white/10 rounded-lg -z-10" />
                <div className="absolute top-2 left-2 w-20 h-28 sm:w-24 sm:h-36 bg-white/10 rounded-lg -z-20" />
                <PlayingCard 
                  card={gameState.drawPile[0]} 
                  isFaceUp={false} 
                  className="hover:shadow-xl hover:scale-105 transition-all"
                />
              </div>
            ) : (
              <div className="w-20 h-28 sm:w-24 sm:h-36 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white/20 text-xs font-mono">空</span>
              </div>
            )}
          </div>
          <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">摸牌堆 ({gameState.drawPile.length})</span>
        </div>

        {/* Discard Pile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
             <AnimatePresence mode="popLayout">
                <PlayingCard 
                  key={gameState.discardPile[gameState.discardPile.length - 1].id}
                  card={gameState.discardPile[gameState.discardPile.length - 1]} 
                  className="z-10"
                />
             </AnimatePresence>
             {gameState.discardPile.length > 1 && (
               <div className="absolute -top-1 -left-1 w-20 h-28 sm:w-24 sm:h-36 bg-white/80 rounded-lg -z-10 rotate-3" />
             )}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
            <span className="text-xs font-mono text-white/60">当前：</span>
            <SuitIcon suit={gameState.currentSuit} className="w-4 h-4" />
            <span className="text-sm font-bold">{gameState.currentRank}</span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-4">
        <div className={`p-2 rounded-full ${gameState.turn === 'player' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {gameState.turn === 'player' ? <User className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1">
            {gameState.turn === 'player' ? '你的回合' : "AI 的回合"}
          </p>
          <p className="text-sm font-medium text-white/90 truncate">{gameState.lastAction}</p>
        </div>
        {gameState.turn === 'player' && gameState.status === 'playing' && gameState.playerHand.every(c => !isValidMove(c, gameState.currentSuit, gameState.currentRank)) && (
          <button 
            onClick={() => setGameState(prev => prev ? { ...prev, turn: 'ai', lastAction: '你跳过了回合。' } : null)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
          >
            跳过
          </button>
        )}
      </div>

      {/* Player Area */}
      <div className="w-full flex flex-col items-center gap-4 pb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-xs font-mono uppercase tracking-widest text-white/60">
          <User className="w-3 h-3" />
          你的手牌 ({gameState.playerHand.length})
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-full px-4">
          {gameState.playerHand.map((card) => (
            <PlayingCard 
              key={card.id} 
              card={card} 
              isPlayable={gameState.turn === 'player' && gameState.status === 'playing' && isValidMove(card, gameState.currentSuit, gameState.currentRank)}
              onClick={() => playCard(card, true)}
            />
          ))}
        </div>
      </div>

      {/* Suit Selector Modal */}
      <AnimatePresence>
        {showSuitSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <h2 className="text-2xl font-serif italic font-bold mb-2 text-center">万能 8 点！</h2>
              <p className="text-zinc-400 text-center mb-8">请选择接下来的花色。</p>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5 hover:border-white/20"
                  >
                    <SuitIcon suit={suit} className="w-10 h-10 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-mono uppercase tracking-widest text-white/60">{getSuitName(suit)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win/Loss Overlay */}
      <AnimatePresence>
        {(gameState.status === 'player_won' || gameState.status === 'ai_won') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white text-zinc-900 rounded-3xl p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />

              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${gameState.status === 'player_won' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {gameState.status === 'player_won' ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
              </div>
              
              <h2 className="text-4xl font-serif italic font-bold mb-2">
                {gameState.status === 'player_won' ? '胜利！' : '游戏结束'}
              </h2>
              <p className="text-zinc-500 mb-8">
                {gameState.status === 'player_won' 
                  ? "你清空了所有手牌，赢得了比赛！" 
                  : "AI 先清空了手牌。下次好运！"}
              </p>

              <button
                onClick={initGame}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all group"
              >
                再玩一局
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Button */}
      <div className="fixed bottom-4 right-4 z-40">
         <button 
          onClick={() => setShowRules(true)}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/60 hover:text-white transition-colors"
         >
            <Info className="w-6 h-6" />
         </button>
      </div>

      {/* Rules Modal (In Game) */}
      <AnimatePresence>
          {showRules && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
              >
                <h2 className="text-3xl font-serif italic font-bold mb-6 text-center">游戏规则</h2>
                <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
                  <p>• 初始状态玩家和 AI 各发 8 张牌。</p>
                  <p>• 玩家轮流出牌。所出的牌必须在“花色”或“点数”上与弃牌堆最顶部的牌匹配。</p>
                  <p>• <strong className="text-yellow-400">万能 8 点：</strong> 数字“8”是万用牌。可以在任何时候打出 8，并随后指定一个新的花色。</p>
                  <p>• 如果无牌可出，必须从摸牌堆摸一张牌。</p>
                  <p>• 最先清空手牌的一方获胜。</p>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="w-full mt-8 py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 transition-all"
                >
                  返回游戏
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
