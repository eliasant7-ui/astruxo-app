/**
 * PostCard Component
 * Display a single post with like and comment functionality
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Heart, MessageCircle, ArrowUpRight, MoreVertical, Trash2, Flag, Copy, Edit, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentsDialog from './CommentsDialog';
import AuthDialog from './AuthDialog';
import LikesDialog from './LikesDialog';
import LinkPreview from './LinkPreview';
import SignupPrompt from './SignupPrompt';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Helper function to extract URLs from text
function extractUrls(text: string): string[] {
  // Match URLs but strip trailing punctuation that's not part of the URL
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const matches = text.match(urlRegex) || [];
  return matches.map(url => url.replace(/[.,;:!?)]+$/, ''));
}

// Helper function to convert URLs in text to clickable links and hashtags
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
  
  // Split by both URLs and hashtags
  const combinedRegex = /(https?:\/\/[^\s<>"']+|#[a-zA-Z0-9_]+)/g;
  const parts = text.split(combinedRegex);
  
  return parts.map((part, index) => {
    // Check if it's a URL — strip trailing punctuation before rendering
    if (part.match(urlRegex)) {
      const cleanUrl = part.replace(/[.,;:!?)]+$/, '');
      const trailing = part.slice(cleanUrl.length);
      return (
        <>
          <a
            key={index}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium break-all transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {cleanUrl}
          </a>
          {trailing}
        </>
      );
    }
    // Check if it's a hashtag
    if (part.match(hashtagRegex)) {
      return (
        <span
          key={index}
          className="text-primary hover:text-primary/80 font-semibold cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Navigate to hashtag search page
            console.log('Clicked hashtag:', part);
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

interface Post {
  id: number;
  userId: number;
  content: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image: string | null;
    siteName: string;
  } | null;
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
    isLive?: boolean;
    currentStreamId?: number | null;
  } | null;
}

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: number) => void;
  onCommentAdded?: () => void;
  isVisitor?: boolean;
}

export default function PostCard({ post, onPostDeleted, onCommentAdded, isVisitor = false }: PostCardProps) {
  const { user, token, refreshToken } = useAuth();
  const navigate = useNavigate();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [signupTrigger, setSignupTrigger] = useState<'profile' | 'comments' | 'stream'>('profile');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPoster, setVideoPoster] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  
  // Edit post states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [isEditing, setIsEditing] = useState(false);

  const isOwnPost = user?.uid === post.user?.firebaseUid;

  // Generate video poster from first frame with error handling
  useEffect(() => {
    if (videoRef.current && post.mediaType === 'video' && post.mediaUrl) {
      const video = videoRef.current;
      setVideoLoading(true);
      setVideoError(null);
      
      const handleLoadedData = () => {
        setVideoLoading(false);
        // Create canvas to capture first frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg', 0.8);
          setVideoPoster(posterUrl);
        }
      };

      const handleError = (e: Event) => {
        setVideoLoading(false);
        console.error('Video loading error:', e);
        setVideoError('Failed to load video. Please try again later.');
      };

      const handleLoadStart = () => {
        setVideoLoading(true);
      };

      const handleCanPlay = () => {
        setVideoLoading(false);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);
      video.load();

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [post.mediaType, post.mediaUrl]);

  const handleLike = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    setIsLiking(true);

    try {
      // Get fresh token
      let authToken = token;
      if (!authToken) {
        toast.error('Authentication token not available');
        return;
      }

      const endpoint = `/api/posts/${post.id}/like`;
      const method = isLiked ? 'DELETE' : 'POST';

      // First attempt with current token
      let response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // If token expired, refresh and retry
      if (response.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        const newToken = await refreshToken();
        if (!newToken) {
          toast.error('Session expired. Please log in again.');
          return;
        }
        
        // Retry with fresh token
        response = await fetch(endpoint, {
          method,
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update like');
      }

      const data = await response.json();
      setIsLiked(!isLiked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);

    try {
      // Get fresh token
      let authToken = token;
      if (!authToken) {
        toast.error('Authentication token not available');
        return;
      }

      // First attempt with current token
      let response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // If token expired, refresh and retry
      if (response.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        const newToken = await refreshToken();
        if (!newToken) {
          toast.error('Session expired. Please log in again.');
          return;
        }
        
        // Retry with fresh token
        response = await fetch(`/api/posts/${post.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      toast.success('Post deleted successfully');
      
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsEditing(true);

    try {
      // Get fresh token
      let authToken = token;
      if (!authToken) {
        toast.error('Authentication token not available');
        return;
      }

      // First attempt with current token
      let response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      // If token expired, refresh and retry
      if (response.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        const newToken = await refreshToken();
        if (!newToken) {
          toast.error('Session expired. Please log in again.');
          return;
        }
        
        // Retry with fresh token
        response = await fetch(`/api/posts/${post.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({
            content: editContent,
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update post');
      }

      // Update local post content
      post.content = editContent;
      
      toast.success('Post updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update post');
    } finally {
      setIsEditing(false);
    }
  };

  const handleReport = async () => {
    if (!user || !token) {
      setAuthDialogOpen(true);
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    setIsReporting(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: 'post',
          targetId: post.id,
          reason: reportReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      toast.success('Report submitted successfully');
      setReportDialogOpen(false);
      setReportReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Card className="glass-card hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center gap-4">
        {/* Avatar with LIVE indicator */}
        <div className="relative">
          {post.user?.isLive && post.user?.currentStreamId ? (
            <div 
              className="cursor-pointer group"
              onClick={() => {
                if (isVisitor) {
                  setSignupTrigger('stream');
                  setShowSignupPrompt(true);
                } else {
                  navigate(`/stream/${post.user?.currentStreamId}`);
                }
              }}
            >
              <Avatar className="ring-4 ring-red-500 ring-offset-2 ring-offset-background transition-all group-hover:ring-red-600">
                <AvatarImage src={post.user?.avatarUrl || undefined} />
                <AvatarFallback>
                  {post.user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Pulsing animation */}
              <div className="absolute inset-0 rounded-full ring-4 ring-red-500 animate-pulse" />
              {/* LIVE badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg group-hover:bg-red-700 transition-colors">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            </div>
          ) : (
            <Avatar 
              className="cursor-pointer"
              onClick={() => {
                if (isVisitor) {
                  setSignupTrigger('profile');
                  setShowSignupPrompt(true);
                } else if (post.user) {
                  navigate(`/user/${post.user.username}`);
                }
              }}
            >
              <AvatarImage src={post.user?.avatarUrl || undefined} />
              <AvatarFallback>
                {post.user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p 
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => {
                    if (isVisitor) {
                      setSignupTrigger('profile');
                      setShowSignupPrompt(true);
                    } else if (post.user) {
                      navigate(`/user/${post.user.username}`);
                    }
                  }}
                >
                  {post.user?.displayName || 'Unknown User'}
                </p>
                {/* LIVE badge next to name */}
                {post.user?.isLive && post.user?.currentStreamId && (
                  <Badge 
                    variant="destructive" 
                    className="text-xs cursor-pointer animate-pulse hover:bg-red-700 transition-colors"
                    onClick={() => {
                      if (isVisitor) {
                        setSignupTrigger('stream');
                        setShowSignupPrompt(true);
                      } else {
                        navigate(`/stream/${post.user?.currentStreamId}`);
                      }
                    }}
                  >
                    <Radio className="h-2.5 w-2.5 mr-1" />
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
            {/* Post Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnPost ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditContent(post.content || '');
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Post'}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!user) {
                        setAuthDialogOpen(true);
                      } else {
                        setReportDialogOpen(true);
                      }
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Text Content — hide if the entire content is just a URL (shown in preview below) */}
        {post.content && (() => {
          const trimmed = post.content.trim();
          const urls = extractUrls(trimmed);
          // If the whole content is a single URL with no other text, skip the text line
          const isOnlyUrl = urls.length === 1 && urls[0] === trimmed;
          if (isOnlyUrl) return null;
          return <p className="whitespace-pre-wrap">{linkifyText(post.content)}</p>;
        })()}

        {/* Link Previews */}
        {post.content && !post.mediaUrl && (() => {
          // If we have cached metadata from when the post was created, use it directly
          if (post.linkPreview) {
            return (
              <LinkPreview
                url={post.linkPreview.url}
                cachedMetadata={post.linkPreview}
              />
            );
          }
          // Fallback: detect URL in content and fetch metadata
          const urls = extractUrls(post.content);
          if (urls.length > 0) {
            return <LinkPreview url={urls[0]} />;
          }
          return null;
        })()}

        {/* Media Content */}
        {post.mediaUrl && post.mediaType === 'image' && (
          <img
            src={post.mediaUrl}
            alt="Post media"
            className="w-full rounded-lg object-contain max-h-[600px] bg-black/5"
          />
        )}

        {post.mediaUrl && post.mediaType === 'video' && (
          <div className="relative w-full rounded-lg bg-black/5">
            {videoError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="text-destructive mb-2">⚠️</div>
                <p className="text-sm text-muted-foreground">{videoError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVideoError(null);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={post.mediaUrl}
                  controls
                  preload="metadata"
                  playsInline
                  poster={videoPoster || undefined}
                  className="w-full rounded-lg object-contain max-h-[600px]"
                  crossOrigin="anonymous"
                  controlsList="nodownload"
                />
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="bg-background/90 p-4 rounded-lg">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Livestream Preview */}
        {post.mediaType === 'livestream' && post.stream && (
          <div
            onClick={() => {
              const streamUrl = post.stream.slug 
                ? `/stream/${post.stream.slug}` 
                : `/stream/${post.stream.id}`;
              navigate(streamUrl);
            }}
            className="cursor-pointer"
          >
            <Card className="overflow-hidden border-2 border-red-500/50 hover:border-red-500 hover:shadow-lg transition-all bg-gradient-to-br from-red-500/5 to-transparent">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-32 h-32 flex-shrink-0 bg-muted relative">
                  {post.stream.thumbnailUrl ? (
                    <img
                      src={post.stream.thumbnailUrl}
                      alt={post.stream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-500/5">
                      <Radio className="h-12 w-12 text-red-500" />
                    </div>
                  )}
                  {post.stream.status === 'live' && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="destructive" className="bg-red-600 text-white font-semibold animate-pulse">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Stream Info */}
                <div className="flex-1 p-4 min-w-0">
                  <h3 className="font-bold text-base line-clamp-2 text-foreground mb-2">
                    {post.stream.title || 'Untitled Stream'}
                  </h3>

                  {post.stream.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {post.stream.description}
                    </p>
                  )}

                  {/* Viewer Count */}
                  {post.stream.status === 'live' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-red-500">{post.stream.viewerCount || 0}</span>
                      <span>watching now</span>
                    </div>
                  )}

                  {post.stream.status === 'ended' && (
                    <div className="text-xs text-muted-foreground">
                      Stream ended
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-4">
        {/* Like Button */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking || !user}
            className="gap-2"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLikesDialogOpen(true)}
            className="px-2 hover:underline"
          >
            <span>{likeCount}</span>
          </Button>
        </div>

        {/* Comment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!user) {
              if (isVisitor) {
                setSignupTrigger('comments');
                setShowSignupPrompt(true);
              } else {
                setAuthDialogOpen(true);
              }
            } else {
              setCommentsOpen(true);
            }
          }}
          className="gap-2 relative"
        >
          <MessageCircle className="h-4 w-4" />
          <span className={isVisitor ? 'blur-sm' : ''}>{commentCount}</span>
          {isVisitor && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>

        {/* Share Button with Popover Menu */}
        <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              <button
                onClick={async () => {
                  try {
                    const baseUrl = window.location.origin;
                    let shareUrl = `${baseUrl}/post/${post.id}`;
                    
                    if (user && token) {
                      try {
                        const response = await fetch('/api/auth/sync', {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          if (data.user?.username) {
                            shareUrl = `${baseUrl}/post/${post.id}?ref=${data.user.username}`;
                          }
                        }
                      } catch (err) {
                        console.error('Failed to get username:', err);
                      }
                    }
                    
                    // Try multiple clipboard methods for PWA compatibility
                    let copied = false;
                    
                    // Method 1: Modern Clipboard API
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        copied = true;
                      } catch (err) {
                        console.log('Clipboard API failed, trying fallback');
                      }
                    }
                    
                    // Method 2: execCommand fallback
                    if (!copied) {
                      const textArea = document.createElement('textarea');
                      textArea.value = shareUrl;
                      textArea.style.position = 'absolute';
                      textArea.style.left = '-9999px';
                      textArea.style.top = '0';
                      textArea.setAttribute('readonly', '');
                      document.body.appendChild(textArea);
                      
                      // iOS requires focus before select
                      textArea.focus();
                      textArea.setSelectionRange(0, shareUrl.length);
                      
                      try {
                        copied = document.execCommand('copy');
                      } catch (err) {
                        console.error('execCommand failed:', err);
                      }
                      
                      document.body.removeChild(textArea);
                    }
                    
                    if (copied) {
                      toast.success('Link copied!', {
                        description: shareUrl.includes('?ref=') 
                          ? 'Share and earn referrals!' 
                          : 'Share this post',
                      });
                    } else {
                      // Show the URL so user can manually copy
                      toast.info('Copy this link:', {
                        description: shareUrl,
                        duration: 10000,
                      });
                    }
                    
                    // Close popover after copying
                    setSharePopoverOpen(false);
                  } catch (err) {
                    toast.error('Failed to copy link');
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
              >
                <Copy className="h-4 w-4" />
                <span>Copy link</span>
              </button>
              
              <button
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const postUrl = `${baseUrl}/post/${post.id}`;
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`, '_blank');
                  setSharePopoverOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Share to X</span>
              </button>
              
              <button
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const postUrl = `${baseUrl}/post/${post.id}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
                  setSharePopoverOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Share to Facebook</span>
              </button>
              
              <button
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const postUrl = `${baseUrl}/post/${post.id}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(postUrl)}`, '_blank');
                  setSharePopoverOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Share to WhatsApp</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </CardFooter>

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post.id}
        commentCount={commentCount}
        onCommentAdded={() => {
          setCommentCount((prev) => prev + 1);
          if (onCommentAdded) {
            onCommentAdded();
          }
        }}
      />

      {/* Likes Dialog */}
      <LikesDialog
        open={likesDialogOpen}
        onOpenChange={setLikesDialogOpen}
        postId={post.id}
      />

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this post. Our moderation team will review it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe why you're reporting this post..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportDialogOpen(false);
                setReportReason('');
              }}
              disabled={isReporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={isReporting || !reportReason.trim()}
            >
              {isReporting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post. You can use hashtags like #example
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="What's on your mind?"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditContent(post.content || '');
              }}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isEditing || !editContent.trim()}
            >
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signup Prompt for Visitors */}
      <SignupPrompt
        open={showSignupPrompt}
        onOpenChange={setShowSignupPrompt}
        onSignup={() => {
          setShowSignupPrompt(false);
          setAuthDialogOpen(true);
        }}
        trigger={signupTrigger}
      />
    </Card>
  );
}
