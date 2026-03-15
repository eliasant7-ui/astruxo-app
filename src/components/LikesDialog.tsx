/**
 * LikesDialog Component
 * Shows list of users who liked a post
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Like {
  id: number;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    followerCount: number;
  };
}

interface LikesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
}

export default function LikesDialog({ open, onOpenChange, postId }: LikesDialogProps) {
  const navigate = useNavigate();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchLikes();
    }
  }, [open, postId]);

  const fetchLikes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch likes');
      }

      const data = await response.json();
      setLikes(data.likes || []);
    } catch (err) {
      console.error('Error fetching likes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username: string) => {
    onOpenChange(false);
    navigate(`/user/${username}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Likes
          </DialogTitle>
          <DialogDescription>
            {likes.length === 0 && !loading
              ? 'No likes yet'
              : `${likes.length} ${likes.length === 1 ? 'person' : 'people'} liked this post`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLikes}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : likes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No likes yet</p>
            <p className="text-sm mt-1">Be the first to like this post!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {likes.map((like) => (
                <div
                  key={like.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleUserClick(like.user.username)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={like.user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {like.user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {like.user.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{like.user.username}
                      {like.user.followerCount > 0 && (
                        <span className="ml-2">
                          · {like.user.followerCount} {like.user.followerCount === 1 ? 'follower' : 'followers'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(like.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
