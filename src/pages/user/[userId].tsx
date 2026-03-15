/**
 * User Profile Page
 * Display user information, followers, and follow/unfollow button
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UserPlus, UserMinus, Radio, Eye, Clock, TrendingUp, Settings, Grid, Video, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import PostCard from '@/components/PostCard';
import PostGrid from '@/components/PostGrid';
import Spinner from '@/components/Spinner';
import { ReportButton } from '@/components/ReportButton';

interface User {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  postCount?: number;
  streamCount?: number;
  isLive: boolean;
  isFollowing: boolean;
  currentStreamId?: number | null;
}

interface Stream {
  id: number;
  title: string;
  description: string | null;
  status: string;
  viewerCount: number;
  peakViewerCount: number;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
}

interface StreamStats {
  totalStreams: number;
  totalViewers: number;
  totalDuration: number;
  averageViewers: number;
}

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

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsOffset, setPostsOffset] = useState(0);
  const [postsViewMode, setPostsViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const postsLimit = 12;
  
  // Check if viewing own profile
  const isOwnProfile = currentUser?.uid === userId;

  // Debug logging
  console.log('🔍 UserProfilePage:', {
    urlUserId: userId,
    currentUserUid: currentUser?.uid,
    currentUserEmail: currentUser?.email,
    isOwnProfile,
    loadedUserUsername: user?.username,
    loadedUserDisplayName: user?.displayName
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserStreams();
      fetchUserPosts(true);
    }
  }, [userId, currentUser]);

  const fetchUser = async () => {
    try {
      console.log('📡 Fetching user profile for userId:', userId);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      console.log('📥 User profile response:', {
        success: data.success,
        username: data.user?.username,
        displayName: data.user?.displayName,
        firebaseUid: data.user?.firebaseUid,
        id: data.user?.id
      });

      if (data.success) {
        setUser(data.user);
        setError(null);
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError('Failed to load user');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStreams = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/streams`);
      const data = await response.json();

      if (data.success) {
        setStreams(data.streams);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching user streams:', err);
    }
  };

  const fetchUserPosts = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : postsOffset;
      const headers: HeadersInit = {};
      if (currentUser && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('🔍 Fetching user posts:', { userId, currentOffset, reset });

      const response = await fetch(
        `/api/users/${userId}/posts?limit=${postsLimit}&offset=${currentOffset}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      console.log('📦 Posts data received:', data);

      if (reset) {
        setPosts(data.posts);
        setPostsOffset(postsLimit);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
        setPostsOffset((prev) => prev + postsLimit);
      }

      setPostsHasMore(data.pagination.hasMore);
      console.log('✅ Posts state updated:', { postsCount: data.posts.length, hasMore: data.pagination.hasMore });
    } catch (err) {
      console.error('❌ Error fetching user posts:', err);
    } finally {
      setPostsLoading(false);
      setPostsLoadingMore(false);
    }
  };

  const handleLoadMorePosts = () => {
    setPostsLoadingMore(true);
    fetchUserPosts(false);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFollow = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        alert('Please login to follow users');
        return;
      }

      const endpoint = user.isFollowing
        ? `/api/users/${user.id}/unfollow`
        : `/api/users/${user.id}/follow`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUser({
          ...user,
          isFollowing: !user.isFollowing,
          followerCount: user.isFollowing ? user.followerCount - 1 : user.followerCount + 1,
        });
      } else {
        alert(data.message || 'Failed to update follow status');
      }
    } catch (err) {
      console.error('Follow error:', err);
      alert('Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground">{error || 'This user does not exist'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <title>{user.displayName || user.username} - astruXo</title>
      <meta name="description" content={user.bio || `Profile of ${user.displayName || user.username}`} />

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Avatar with LIVE indicator */}
              <div className="relative">
                {user.isLive && user.currentStreamId ? (
                  <Link to={`/stream/${user.currentStreamId}`} className="block">
                    <div className="relative group cursor-pointer">
                      <Avatar className="h-32 w-32 ring-4 ring-red-500 ring-offset-2 ring-offset-background">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="text-4xl">
                          {user.displayName?.[0] || user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* LIVE badge on avatar */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg group-hover:bg-red-700 transition-colors">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    className="cursor-pointer group"
                    onClick={() => setAvatarDialogOpen(true)}
                  >
                    <Avatar className="h-32 w-32 transition-transform group-hover:scale-105">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-4xl">
                        {user.displayName?.[0] || user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-colors flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Ver foto
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.displayName || user.username}</h1>
                  {user.isLive && user.currentStreamId && (
                    <Link to={`/stream/${user.currentStreamId}`}>
                      <Badge variant="destructive" className="animate-pulse cursor-pointer hover:bg-red-700 transition-colors">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE - Click to Watch
                      </Badge>
                    </Link>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">@{user.username}</p>

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <p className="text-2xl font-bold">{user.postCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.followerCount}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.followingCount}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button
                      onClick={() => navigate('/profile/edit')}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleFollow}
                        disabled={actionLoading}
                        variant={user.isFollowing ? 'outline' : 'default'}
                        className="w-full md:w-auto"
                      >
                        {actionLoading ? (
                          'Loading...'
                        ) : user.isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                      <ReportButton targetType="user" targetId={user.id} variant="outline" showLabel />
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {user.bio && (
            <CardContent>
              <h2 className="font-semibold mb-2">About</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
            </CardContent>
          )}
        </Card>

        {/* Statistics */}
        {stats && stats.totalStreams > 0 && (
          <Card className="max-w-4xl mx-auto mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Channel Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">{stats.totalStreams}</p>
                  <p className="text-sm text-muted-foreground">Total Streams</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">{stats.totalViewers}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">{stats.averageViewers}</p>
                  <p className="text-sm text-muted-foreground">Avg Viewers</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">{formatDuration(stats.totalDuration)}</p>
                  <p className="text-sm text-muted-foreground">Total Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Section */}
        <Card className="max-w-4xl mx-auto mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                Publicaciones
              </CardTitle>
              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={postsViewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPostsViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={postsViewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPostsViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {(() => {
              console.log('🎨 Rendering posts section:', { postsLoading, postsLength: posts.length, posts });
              return null;
            })()}
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No hay publicaciones aún</p>
              </div>
            ) : (
              <>
                {/* List View */}
                {postsViewMode === 'list' && (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onPostDeleted={handlePostDeleted}
                      />
                    ))}
                  </div>
                )}

                {/* Grid View */}
                {postsViewMode === 'grid' && <PostGrid posts={posts} />}

                {/* Load More Button */}
                {postsHasMore && (
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={handleLoadMorePosts}
                      disabled={postsLoadingMore}
                      variant="outline"
                    >
                      {postsLoadingMore ? (
                        <>
                          <Spinner />
                          <span className="ml-2">Cargando...</span>
                        </>
                      ) : (
                        'Cargar más'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Avatar Expanded Dialog */}
        <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
          <DialogContent className="max-w-2xl p-0 bg-black/95 border-none">
            <div className="relative w-full aspect-square">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || user.username}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <span className="text-9xl font-bold text-muted-foreground">
                    {user.displayName?.[0] || user.username[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
