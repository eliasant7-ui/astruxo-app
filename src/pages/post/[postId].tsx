/**
 * Post Detail Page
 * View a single post with all comments
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import PostCard from '@/components/PostCard';
import CommentList from '@/components/CommentList';
import Spinner from '@/components/Spinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: number;
  userId: number;
  content: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  createdAt: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    followerCount?: number;
    firebaseUid: string;
  };
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const headers: HeadersInit = {};
        if (user && token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/posts/${postId}`, { headers });

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Post not found');
            navigate('/');
            return;
          }
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        setPost(data.post);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, user, token, navigate]);

  const handlePostDeleted = () => {
    toast.success('Post deleted');
    navigate('/');
  };

  const handleCommentAdded = () => {
    if (post) {
      setPost({ ...post, commentCount: post.commentCount + 1 });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <title>{`Post by ${post.user.displayName} - astruXo`}</title>
      <meta
        name="description"
        content={post.content || `Post by ${post.user.displayName}`}
      />

      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Button>

      {/* Post */}
      <PostCard
        post={post}
        onPostDeleted={handlePostDeleted}
        onCommentAdded={handleCommentAdded}
      />

      {/* Comments Section */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-bold mb-4">
          Comments {post.commentCount > 0 && `(${post.commentCount})`}
        </h2>
        <CommentList
          postId={post.id}
          commentCount={post.commentCount}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </div>
  );
}
