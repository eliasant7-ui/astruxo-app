/**
 * Home page - Live Streams Feed
 * Displays all currently live streams
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Eye, Users, Radio, Search, TrendingUp, Clock, Share2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

interface Stream {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  viewerCount: number;
  startedAt: string;
  isSystemStream?: boolean;
  youtubePlaylistId?: string | null;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    followerCount: number;
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'viewers' | 'recent'>('viewers');

  useEffect(() => {
    fetchLiveStreams();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort streams
  useEffect(() => {
    let result = [...streams];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (stream) =>
          stream.title.toLowerCase().includes(query) ||
          stream.user.displayName?.toLowerCase().includes(query) ||
          stream.user.username.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === 'viewers') {
      result.sort((a, b) => b.viewerCount - a.viewerCount);
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }

    setFilteredStreams(result);
  }, [streams, searchQuery, sortBy]);

  const fetchLiveStreams = async () => {
    try {
      const response = await fetch('/api/streams/live');
      const data = await response.json();

      if (data.success) {
        setStreams(data.streams);
        setError(null);
      } else {
        setError('Failed to load streams');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching streams:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading live streams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <title>Live Streams - LiveStream Platform</title>
      <meta name="description" content="Watch live streams from creators around the world" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-8 w-8 text-red-500 animate-pulse" />
            <h1 className="text-4xl font-bold">Live Now</h1>
          </div>
          <p className="text-muted-foreground">
            {filteredStreams.length} {filteredStreams.length === 1 ? 'stream' : 'streams'} 
            {searchQuery ? ' found' : ' currently live'}
          </p>
        </div>

        {/* Search and Filters */}
        {streams.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search streams or streamers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'viewers' ? 'default' : 'outline'}
                onClick={() => setSortBy('viewers')}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Most Viewers
              </Button>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                onClick={() => setSortBy('recent')}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Recently Started
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State - No Streams */}
        {!loading && streams.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Radio className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Live Streams</h2>
              <p className="text-muted-foreground mb-6">
                There are no live streams at the moment. Check back soon!
              </p>
              <Button asChild>
                <Link to="/go-live">Start Your First Stream</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No Search Results */}
        {!loading && streams.length > 0 && filteredStreams.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Streams Grid */}
        {filteredStreams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStreams.map((stream) => {
              // Use thumbnail if available, otherwise use broadcaster's avatar
              const thumbnailSrc = stream.thumbnailUrl || stream.user.avatarUrl;
              
              return (
                <div key={stream.id} className="relative">
                  <Link to={`/stream/${stream.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50">
                      {/* Thumbnail - Full width, larger aspect ratio */}
                      <div className="relative aspect-[16/10] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                        {thumbnailSrc ? (
                          <>
                            <img
                              src={thumbnailSrc}
                              alt={stream.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Gradient overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <Radio className="h-20 w-20 text-primary/40 animate-pulse" />
                          </div>
                        )}
                        
                        {/* Live Badge - Enhanced */}
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                          <Badge variant="destructive" className="animate-pulse shadow-lg backdrop-blur-sm bg-red-600/90 px-3 py-1">
                            <Radio className="h-3 w-3 mr-1.5" />
                            <span className="font-bold">LIVE</span>
                          </Badge>
                          {stream.isSystemStream && (
                            <Badge className="shadow-lg backdrop-blur-sm bg-primary/90 px-3 py-1">
                              <span className="font-bold">24/7</span>
                            </Badge>
                          )}
                        </div>

                        {/* Viewer Count - Enhanced */}
                        <div className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg">
                          <Eye className="h-4 w-4" />
                          {stream.viewerCount.toLocaleString()}
                        </div>

                        {/* Stream Title Overlay - On hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                            {stream.title}
                          </h3>
                        </div>
                      </div>

                      {/* Content - Streamer Info */}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={stream.user.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {stream.user.displayName?.[0] || stream.user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate group-hover:text-primary transition-colors">
                              {stream.user.displayName || stream.user.username}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {stream.user.followerCount.toLocaleString()} followers
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  {/* Share Button - Positioned absolutely */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-4 right-4 z-10 shadow-lg hover:scale-110 transition-transform"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        const baseUrl = window.location.origin;
                        let shareUrl = `${baseUrl}/stream/${stream.id}`;
                        
                        if (user) {
                          try {
                            const token = await user.getIdToken();
                            const response = await fetch('/api/auth/sync', {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              if (data.user?.username) {
                                shareUrl = `${baseUrl}/stream/${stream.id}?ref=${data.user.username}`;
                              }
                            }
                          } catch (err) {
                            console.error('Failed to get username:', err);
                          }
                        }
                        
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success('Stream link copied!', {
                          description: shareUrl.includes('?ref=') 
                            ? 'Share and earn referrals!' 
                            : 'Share this stream with others',
                        });
                      } catch (err) {
                        toast.error('Failed to copy link');
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Go Live Button - Mobile & Tablet */}
      {user && (
        <Link to="/go-live" className="lg:hidden">
          <Button
            size="lg"
            variant="destructive"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform animate-pulse"
          >
            <Video className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </>
  );
}
