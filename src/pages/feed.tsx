/**
 * Feed Page
 * Main social feed with posts
 * Auto-refreshes every 15 seconds and on app focus
 * Infinite scroll for seamless browsing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useVisitorGate } from '@/lib/useVisitorGate';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import Spinner from '@/components/Spinner';
import AuthDialog from '@/components/AuthDialog';
import SignupPrompt from '@/components/SignupPrompt';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserPlus, Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
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

export default function FeedPage() {
  const { user, token } = useAuth();
  const { 
    postsViewed, 
    remainingPosts, 
    hasReachedLimit, 
    shouldShowSignupPrompt,
    hasUsedContinue,
    maxAllowedPosts,
    incrementPostsViewed,
    continueExploring,
    setShouldShowSignupPrompt 
  } = useVisitorGate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const justCreatedPost = useRef(false);
  const limit = 20;
  
  // Ref for infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPosts = async (reset = false, silent = false, smartRefresh = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const authToken = user && token ? token : null;

      const headers: HeadersInit = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/feed?limit=${limit}&offset=${currentOffset}&t=${Date.now()}`, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json();

      if (smartRefresh) {
        setPosts((prevPosts) => {
          const newPostsMap = new Map(data.posts.map((p: Post) => [p.id, p]));
          const existingPostsMap = new Map(prevPosts.map((p) => [p.id, p]));
          const newPosts = data.posts.filter((p: Post) => !existingPostsMap.has(p.id));
          const updatedPosts = prevPosts.map((post) => {
            const newData = newPostsMap.get(post.id);
            return newData || post;
          });
          const combined = [...newPosts, ...updatedPosts];
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return combined;
        });
      } else if (reset) {
        setPosts(data.posts);
        setOffset(limit);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
        setOffset((prev) => prev + limit);
      }

      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching feed:', error);
      if (!silent) {
        toast.error('Failed to load feed');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(true);
  }, [user]);

  // Smart auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!justCreatedPost.current) {
        fetchPosts(false, true, true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Smart re-fetch on app focus/visibility — skip during post creation window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !justCreatedPost.current) {
        fetchPosts(false, true, true);
      }
    };
    const handleFocus = () => {
      if (!justCreatedPost.current) {
        fetchPosts(false, true, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, token]);

  const handlePostCreated = (newPost?: Post) => {
    console.log('📝 Nuevo post recibido:', newPost);

    // Validar que el post sea válido
    if (!newPost || typeof newPost !== 'object') {
      console.error('❌ Post inválido:', newPost);
      // Hacer refresh del feed de todas formas
      justCreatedPost.current = true;
      fetchPosts(true);
      setTimeout(() => { justCreatedPost.current = false; }, 5000);
      return;
    }

    // Validar campos mínimos
    if (!newPost.id || !newPost.userId) {
      console.error('❌ Post incompleto:', newPost);
      justCreatedPost.current = true;
      fetchPosts(true);
      setTimeout(() => { justCreatedPost.current = false; }, 5000);
      return;
    }

    // Block visibility/focus refreshes
    justCreatedPost.current = true;

    // Agregar al feed optimísticamente
    setPosts(prev => {
      if (!Array.isArray(prev)) return [newPost];
      return [newPost, ...prev.filter(p => p.id !== newPost.id)];
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('✅ Post agregado al feed');

    // Refresh real después de 1s para sincronizar con servidor
    setTimeout(() => {
      fetchPosts(true);
      setTimeout(() => { justCreatedPost.current = false; }, 4000);
    }, 1000);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(false);
  }, [loadingMore, hasMore, offset]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [loadMore, hasMore, loadingMore]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-4 md:py-8 px-4 space-y-6">
      <title>astruXo - Feed</title>
      <meta name="description" content="Discover and share content with the community" />

      {/* Welcome Banner for Non-Authenticated Users */}
      {!user && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
          <div className="p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
          
                <h2 className="text-xl font-bold">Welcome to astruXo!</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Join our community to like, comment, share posts, and connect with others.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Like posts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span>Comment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Share2 className="h-4 w-4 text-green-500" />
                  <span>Share content</span>
                </div>
              </div>
              <Button onClick={() => setAuthDialogOpen(true)} className="w-full md:w-auto" size="lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up / Log In
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {user ? "No posts yet. Be the first to share something!" : "No posts yet. Sign in to start sharing!"}
            </p>
          </div>
        ) : (
          <>
            {(user ? posts : posts.slice(0, maxAllowedPosts)).map((post, index) => {
              if (!user && index < maxAllowedPosts && index === postsViewed) {
                setTimeout(() => incrementPostsViewed(), 100);
              }
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  isVisitor={!user}
                />
              );
            })}

            {/* Signup Gate for Visitors */}
            {!user && posts.length > maxAllowedPosts && hasReachedLimit && (
              <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4">
                    <img src="/logo.png" alt="astruXo" className="h-full w-full object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold">¡Hay más contenido esperándote!</h3>
                  <p className="text-muted-foreground">
                    Crea una cuenta gratuita para seguir explorando contenido ilimitado.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button onClick={() => setAuthDialogOpen(true)} size="lg" className="gap-2">
                      Crear cuenta gratis
                    </Button>
                    {!hasUsedContinue && (
                      <Button onClick={continueExploring} variant="outline" size="lg" className="gap-2">
                        Continuar explorando
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <button onClick={() => setAuthDialogOpen(true)} className="font-semibold text-primary hover:underline">
                      Inicia sesión aquí
                    </button>
                  </p>
                </div>
              </Card>
            )}

            {/* Infinite Scroll */}
            {user && (
              <div ref={observerTarget} className="py-8">
                {loadingMore && (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Spinner />
                    <p className="text-sm text-muted-foreground">Loading more posts...</p>
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      🎉 You're all caught up! No more posts to show.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Signup Prompt Modal */}
      <SignupPrompt
        open={shouldShowSignupPrompt && !user}
        onOpenChange={setShouldShowSignupPrompt}
        onSignup={() => { setShouldShowSignupPrompt(false); setAuthDialogOpen(true); }}
        onContinue={continueExploring}
        canContinue={!hasUsedContinue}
        trigger="posts"
      />

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
