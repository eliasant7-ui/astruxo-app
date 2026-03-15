/**
 * CommentList Component
 * Display list of comments for a post
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send, LogIn } from 'lucide-react';
import AuthDialog from './AuthDialog';

// Helper function to convert URLs in text to clickable links
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium break-all transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface CommentListProps {
  postId: number;
  commentCount: number;
  onCommentAdded?: () => void;
}

export default function CommentList({ postId, commentCount, onCommentAdded }: CommentListProps) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const limit = 20;

  const fetchComments = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;

      const response = await fetch(
        `/api/posts/${postId}/comments?limit=${limit}&offset=${currentOffset}&t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();

      if (reset) {
        setComments(data.comments);
        setOffset(limit);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
        setOffset((prev) => prev + limit);
      }

      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComments(true);
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be signed in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    if (newComment.length > 1000) {
      toast.error('Comment is too long (max 1000 characters)');
      return;
    }

    if (!token) {
      toast.error('Authentication token not available');
      return;
    }

    setSubmitting(true);

    // Create optimistic comment (shows immediately)
    const optimisticComment: Comment = {
      id: Date.now(), // Temporary ID
      postId,
      userId: user.uid ? parseInt(user.uid) : 0,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: user.uid ? parseInt(user.uid) : 0,
        username: user.email?.split('@')[0] || 'user',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        avatarUrl: user.photoURL || null,
      },
    };

    // Add optimistic comment immediately
    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment('');

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: optimisticComment.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      const data = await response.json();

      // Replace optimistic comment with real one from server
      setComments((prev) =>
        prev.map((c) => (c.id === optimisticComment.id ? data.comment : c))
      );

      toast.success('Comment posted!');

      // Notify parent component (for comment count update)
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      
      // Restore comment text so user can try again
      setNewComment(optimisticComment.content);
      
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchComments(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
                disabled={submitting}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/1000
                </span>
                <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Sign in prompt for guests */}
      {!user && (
        <div className="text-center py-6 glass-dark rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to join the conversation
          </p>
          <Button 
            onClick={() => setAuthDialogOpen(true)}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar 
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => navigate(`/user/${comment.user.username}`)}
                >
                  <AvatarImage src={comment.user.avatarUrl || undefined} />
                  <AvatarFallback>
                    {comment.user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-semibold text-sm cursor-pointer hover:underline"
                      onClick={() => navigate(`/user/${comment.user.username}`)}
                    >
                      {comment.user.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      •
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{linkifyText(comment.content)}</p>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="sm"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Comments'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
