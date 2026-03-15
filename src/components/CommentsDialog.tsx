/**
 * CommentsDialog Component
 * Modal dialog to view and add comments on a post
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CommentList from './CommentList';

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  commentCount: number;
  onCommentAdded?: () => void;
}

export default function CommentsDialog({
  open,
  onOpenChange,
  postId,
  commentCount,
  onCommentAdded,
}: CommentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Comments {commentCount > 0 && `(${commentCount})`}
          </DialogTitle>
        </DialogHeader>
        <CommentList
          postId={postId}
          commentCount={commentCount}
          onCommentAdded={onCommentAdded}
        />
      </DialogContent>
    </Dialog>
  );
}
