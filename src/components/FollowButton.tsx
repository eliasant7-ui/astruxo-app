/**
 * Follow Button Component
 * Reusable follow/unfollow button with loading states
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-fetch';

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please login to follow users');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isFollowing
        ? `/api/users/${userId}/unfollow`
        : `/api/users/${userId}/follow`;

      console.log('🔄 Follow request:', { 
        endpoint, 
        userId, 
        isFollowing,
        userUid: user.uid,
        userEmail: user.email,
      });

      // Use apiFetch which automatically gets fresh token and has detailed logging
      const response = await apiFetch(endpoint, {
        method: 'POST',
      });

      const data = await response.json();
      console.log('📥 Follow response:', { status: response.status, data });

      if (response.ok && data.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);
        toast.success(
          newFollowState ? 'Successfully followed!' : 'Unfollowed'
        );
      } else {
        console.error('❌ Follow failed:', data);
        toast.error(data.message || 'Failed to update follow status');
      }
    } catch (error: any) {
      console.error('❌ Follow error:', error);
      
      // Show specific error message
      if (error.message === 'User not authenticated') {
        toast.error('Please login again to follow users');
      } else if (error.message === 'Firebase auth not initialized') {
        toast.error('Authentication system not ready. Please refresh the page.');
      } else {
        toast.error('Failed to update follow status. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant={isFollowing ? 'outline' : variant}
        size={size}
        onClick={handleFollow}
        disabled={isLoading}
        className={`gap-2 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showIcon ? (
          isFollowing ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )
        ) : null}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    </motion.div>
  );
}
