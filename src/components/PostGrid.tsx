/**
 * PostGrid Component
 * Display posts in a grid layout (Instagram-style)
 */

import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Play } from 'lucide-react';

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

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  const navigate = useNavigate();

  // Filter posts with media only
  const mediaPosts = posts.filter((post) => post.mediaUrl);

  if (mediaPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No media posts yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {mediaPosts.map((post) => (
        <div
          key={post.id}
          onClick={() => navigate(`/post/${post.id}`)}
          className="relative aspect-square cursor-pointer group overflow-hidden rounded-sm"
        >
          {/* Media */}
          {post.mediaType === 'image' && (
            <img
              src={post.mediaUrl!}
              alt="Post"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          )}

          {post.mediaType === 'video' && (
            <div className="relative w-full h-full">
              <img
                src={post.thumbnailUrl || post.mediaUrl!}
                alt="Video thumbnail"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-12 w-12 text-white drop-shadow-lg" fill="white" />
              </div>
            </div>
          )}

          {/* Overlay with stats */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-white">
              <Heart className="h-5 w-5" fill="white" />
              <span className="font-semibold">{post.likeCount}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="h-5 w-5" fill="white" />
              <span className="font-semibold">{post.commentCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
