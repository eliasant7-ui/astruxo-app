/**
 * Gift Animation Component
 * Displays animated gift notifications when gifts are sent
 */

import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Coins,
} from 'lucide-react';

interface GiftNotification {
  id: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar: string | null;
  giftName: string;
  giftIcon: string;
  coinAmount: number;
  message?: string;
}

interface GiftAnimationProps {
  notifications: GiftNotification[];
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

export default function GiftAnimation({ notifications }: GiftAnimationProps) {
  const getGiftIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Gift;
    return IconComponent;
  };

  const getTierColor = (price: number) => {
    if (price >= 1000) return 'from-purple-500 to-pink-500';
    if (price >= 100) return 'from-blue-500 to-cyan-500';
    if (price >= 25) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="fixed bottom-24 left-4 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const IconComponent = getGiftIcon(notification.giftIcon);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="mb-2"
            >
              <div className={`
                bg-gradient-to-r ${getTierColor(notification.coinAmount)}
                rounded-lg p-4 shadow-2xl backdrop-blur-sm
                border-2 border-white/20
                max-w-sm
              `}>
                <div className="flex items-center gap-3">
                  {/* Sender Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={notification.senderAvatar || undefined} />
                    <AvatarFallback className="bg-white text-black">
                      {notification.senderDisplayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Gift Info */}
                  <div className="flex-1 text-white">
                    <p className="font-bold text-sm">
                      {notification.senderDisplayName}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span>sent</span>
                      <IconComponent className="h-4 w-4" />
                      <span className="font-semibold">{notification.giftName}</span>
                    </div>
                    {notification.message && (
                      <p className="text-xs mt-1 italic opacity-90">
                        "{notification.message}"
                      </p>
                    )}
                  </div>

                  {/* Coin Amount */}
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                    <Coins className="h-4 w-4 text-white" />
                    <span className="text-white font-bold text-sm">
                      {notification.coinAmount}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
