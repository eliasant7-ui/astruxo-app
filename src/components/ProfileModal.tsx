/**
 * Profile Modal Component
 * Quick profile view in a modal - used during streams
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import FollowButton from './FollowButton';
import { MapPin, Calendar, Video, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

interface ProfileModalProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  streamCount: number;
  isFollowing: boolean;
  createdAt: string;
}

export default function ProfileModal({ userId, open, onOpenChange }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('firebaseToken');
      const response = await fetch(`/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, user: {...} }
        if (data.user) {
          setProfile(data.user);
        } else {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowing,
        followerCount: isFollowing
          ? profile.followerCount + 1
          : profile.followerCount - 1,
      });
    }
  };

  const handleViewFullProfile = () => {
    window.open(`/user/${userId}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : profile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div>
                <DialogTitle className="text-2xl font-bold">
                  {profile.displayName}
                </DialogTitle>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {/* Follow Button */}
              <FollowButton
                userId={profile.id}
                isFollowing={profile.isFollowing}
                onFollowChange={handleFollowChange}
                size="lg"
              />
            </div>

            <Separator />

            {/* Bio */}
            {profile.bio && (
              <div>
                <p className="text-sm text-center">{profile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{profile.postCount}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{profile.followerCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{profile.followingCount}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>

            <Separator />

            {/* Additional Info */}
            <div className="space-y-2 text-sm">
              {profile.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                  </span>
                </div>
              )}
              {profile.streamCount > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Video className="h-4 w-4" />
                  <span>{profile.streamCount} streams</span>
                </div>
              )}
            </div>

            {/* View Full Profile Button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleViewFullProfile}
            >
              <ExternalLink className="h-4 w-4" />
              View Full Profile
            </Button>
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
