/**
 * Floating Gifts Component
 * Displays gifts floating from bottom to top like in classic streaming platforms
 * Inspired by technology from 10+ years ago (Periscope, early live streaming)
 */

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  Heart,
  ThumbsUp,
  Star,
  Flame,
  Flower2,
  Trophy,
  Crown,
  Gem,
  Rocket,
  Gift,
  Sparkles,
  PartyPopper,
  Zap,
  Sparkle,
} from 'lucide-react';

interface FloatingGift {
  id: string;
  giftIcon: string;
  giftName: string;
  coinAmount: number;
  x: number; // Random X position (0-100%)
  delay: number; // Stagger delay
}

interface FloatingGiftsProps {
  gifts: Array<{
    id: string;
    giftIcon: string;
    giftName: string;
    coinAmount: number;
  }>;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Heart,
  ThumbsUp,
  Star,
  Flame,
  Flower2,
  Trophy,
  Crown,
  Gem,
  Rocket,
  Gift,
  Sparkles,
  PartyPopper,
  Zap,
  Sparkle,
};

export default function FloatingGifts({ gifts }: FloatingGiftsProps) {
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);

  useEffect(() => {
    if (gifts.length === 0) return;

    // Add new gifts with random positions
    const newFloatingGifts = gifts.map((gift, index) => ({
      ...gift,
      x: Math.random() * 80 + 10, // Random X between 10% and 90%
      delay: index * 0.1, // Stagger by 100ms
    }));

    setFloatingGifts((prev) => [...prev, ...newFloatingGifts]);

    // Remove gifts after animation completes (5 seconds)
    const timeout = setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => !gifts.find((ng) => ng.id === g.id)));
    }, 5000);

    return () => clearTimeout(timeout);
  }, [gifts]);

  const getGiftIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Gift;
    return IconComponent;
  };

  const getTierColor = (price: number) => {
    if (price >= 1000) return 'text-purple-400';
    if (price >= 100) return 'text-blue-400';
    if (price >= 25) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getTierGlow = (price: number) => {
    if (price >= 1000) return 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]';
    if (price >= 100) return 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]';
    if (price >= 25) return 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]';
    return 'drop-shadow-[0_0_4px_rgba(156,163,175,0.6)]';
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {floatingGifts.map((gift) => {
          const IconComponent = getGiftIcon(gift.giftIcon);
          const colorClass = getTierColor(gift.coinAmount);
          const glowClass = getTierGlow(gift.coinAmount);

          return (
            <motion.div
              key={gift.id}
              initial={{
                y: '100vh', // Start from bottom
                x: `${gift.x}vw`, // Random X position
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                y: '-20vh', // Float to above screen
                opacity: [0, 1, 1, 1, 0], // Fade in, stay visible, fade out
                scale: [0.5, 1.2, 1, 1, 0.8], // Grow slightly then normalize
                rotate: [0, 10, -10, 5, 0], // Gentle rotation
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 4.5,
                delay: gift.delay,
                ease: 'easeOut',
                opacity: {
                  times: [0, 0.1, 0.8, 0.9, 1],
                  duration: 4.5,
                },
              }}
              className="absolute"
              style={{
                left: 0,
                bottom: 0,
              }}
            >
              <div className={`${colorClass} ${glowClass}`}>
                <IconComponent className="h-12 w-12 md:h-16 md:w-16" strokeWidth={1.5} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
