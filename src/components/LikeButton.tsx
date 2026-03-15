/**
 * Enhanced Like Button with Animations
 * Smooth heart animation with scale and color transitions
 */

import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onLike: () => void;
  onShowLikes: () => void;
  disabled?: boolean;
}

export default function LikeButton({
  isLiked,
  likeCount,
  onLike,
  onShowLikes,
  disabled = false,
}: LikeButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLike}
        disabled={disabled}
        className="group relative"
      >
        <motion.div
          animate={{
            scale: isLiked ? [1, 1.3, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${
              isLiked
                ? 'fill-red-500 text-red-500'
                : 'text-muted-foreground group-hover:text-red-500 group-hover:scale-110'
            }`}
          />
        </motion.div>

        {/* Particle effect on like */}
        {isLiked && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-red-500/20"
            />
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 3) * 20,
                  y: Math.sin((i * Math.PI) / 3) * 20,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full"
              />
            ))}
          </>
        )}
      </Button>

      <button
        onClick={onShowLikes}
        className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
      >
        {likeCount === 0 ? (
          <span>Be the first to like</span>
        ) : (
          <span>
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        )}
      </button>
    </div>
  );
}
