/**
 * Enhanced Comment List with Nested Replies
 * Supports threaded conversations and reactions
 */

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Heart, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    firebaseUid: string;
  };
  likeCount?: number;
  isLiked?: boolean;
  replyCount?: number;
  parentId?: number | null;
}

interface EnhancedCommentListProps {
  postId: number;
  comments: Comment[];
  onCommentAdded: () => void;
  onCommentDeleted: (commentId: number) => void;
}

function CommentItem({
  comment,
  postId,
  onReply,
  onDelete,
  level = 0,
}: {
  comment: Comment;
  postId: number;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  level?: number;
}) {
  const { user, token } = useAuth();
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwnComment = user?.uid === comment.user.firebaseUid;
  const maxNestingLevel = 3; // Limit nesting to 3 levels

  const handleLikeComment = async () => {
    if (!user || !token) {
      toast.error('Please login to like comments');
      return;
    }

    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${comment.id}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to like comment');
    } catch (error) {
      console.error('Error liking comment:', error);
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      toast.error('Failed to like comment');
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !token || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parentId: comment.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to post reply');

      setReplyText('');
      setShowReplyBox(false);
      onReply(comment.id);
      toast.success('Reply posted!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex gap-3 ${level > 0 ? 'ml-12 mt-3' : 'mt-4'}`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user.avatarUrl || undefined} />
        <AvatarFallback>
          {comment.user.displayName?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="glass-card p-3 rounded-2xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{comment.user.displayName}</p>
              <p className="text-xs text-muted-foreground">@{comment.user.username}</p>
            </div>
            {isOwnComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mt-2 text-sm break-words">{comment.content}</p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 mt-2 ml-3">
          <button
            onClick={handleLikeComment}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Heart
              className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {level < maxNestingLevel && (
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Reply
            </button>
          )}

          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Reply Box */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 ml-3"
            >
              <div className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.user.displayName}...`}
                  className="min-h-[60px] text-sm"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyBox(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function EnhancedCommentList({
  postId,
  comments,
  onCommentAdded,
  onCommentDeleted,
}: EnhancedCommentListProps) {
  // Organize comments into threads
  const topLevelComments = comments.filter(c => !c.parentId);
  const repliesMap = new Map<number, Comment[]>();
  
  comments.forEach(comment => {
    if (comment.parentId) {
      const replies = repliesMap.get(comment.parentId) || [];
      replies.push(comment);
      repliesMap.set(comment.parentId, replies);
    }
  });

  const renderCommentThread = (comment: Comment, level = 0): React.ReactElement => {
    const replies = repliesMap.get(comment.id) || [];
    
    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          postId={postId}
          onReply={onCommentAdded}
          onDelete={onCommentDeleted}
          level={level}
        />
        {replies.map(reply => renderCommentThread(reply, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <AnimatePresence>
        {topLevelComments.map(comment => renderCommentThread(comment))}
      </AnimatePresence>
    </div>
  );
}
