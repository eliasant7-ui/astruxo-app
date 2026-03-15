/**
 * Live Reactions Component
 * Floating emoji reactions during livestreams
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, Laugh, Flame, Star, Sparkles } from 'lucide-react';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  timestamp: number;
}

interface LiveReactionsProps {
  streamId: string;
  onReactionSent?: (emoji: string) => void;
  socket?: any;
}

const reactionEmojis = [
  { emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
  { emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
  { emoji: '🔥', icon: Flame, color: 'text-orange-500' },
  { emoji: '⭐', icon: Star, color: 'text-yellow-400' },
  { emoji: '✨', icon: Sparkles, color: 'text-purple-500' },
];

export default function LiveReactions({ streamId, onReactionSent, socket }: LiveReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for reactions from other users
    socket.on('reaction', (data: { emoji: string; userId: number }) => {
      addReaction(data.emoji);
    });

    return () => {
      socket.off('reaction');
    };
  }, [socket]);

  const addReaction = (emoji: string) => {
    const reaction: Reaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: Math.random() * 80 + 10, // Random position between 10% and 90%
      timestamp: Date.now(),
    };

    setReactions(prev => [...prev, reaction]);

    // Remove reaction after animation completes
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  const sendReaction = (emoji: string) => {
    // Add locally
    addReaction(emoji);

    // Send to server
    if (socket) {
      socket.emit('reaction', { streamId, emoji });
    }

    onReactionSent?.(emoji);
  };

  return (
    <>
      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {reactions.map(reaction => (
            <motion.div
              key={reaction.id}
              initial={{ y: '100vh', opacity: 1, scale: 0 }}
              animate={{
                y: '-20vh',
                opacity: [1, 1, 0],
                scale: [0, 1.5, 1],
                rotate: [0, 10, -10, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                left: `${reaction.x}%`,
                bottom: 0,
              }}
              className="text-4xl"
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction Picker - Horizontal Layout */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card px-4 py-3 rounded-full flex items-center gap-2 shadow-2xl"
        >
          {reactionEmojis.map(({ emoji, icon: Icon, color }) => (
            <motion.div
              key={emoji}
              whileHover={{ scale: 1.3, y: -8 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sendReaction(emoji)}
                className="h-12 w-12 p-0 hover:bg-white/20 transition-all rounded-full"
              >
                <span className="text-2xl">{emoji}</span>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
