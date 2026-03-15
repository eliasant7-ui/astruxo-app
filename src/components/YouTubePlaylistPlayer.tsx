/**
 * YouTube Playlist Player
 * Embeds YouTube videos from a playlist and auto-advances to next video
 * Saves playlist progress to continue from last watched video
 */

import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';

interface YouTubePlaylistPlayerProps {
  playlistId: string;
  streamId: number;
  currentIndex?: number;
  autoplay?: boolean;
  className?: string;
}

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlaylistPlayer({ 
  playlistId, 
  streamId,
  currentIndex = 0,
  autoplay = true,
  className = '' 
}: YouTubePlaylistPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(currentIndex);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load the API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };
  }, []);

  // Update player when playlist or index changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadPlaylist) {
      playerRef.current.loadPlaylist({
        list: playlistId,
        listType: 'playlist',
        index: currentVideoIndex,
        startSeconds: 0,
      });
    }
  }, [playlistId, currentVideoIndex]);

  const initializePlayer = () => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        index: currentVideoIndex,
        autoplay: autoplay ? 1 : 0,
        loop: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    setIsLoading(false);
    console.log('✅ YouTube player ready');
  };

  const onPlayerStateChange = (event: any) => {
    // YT.PlayerState.ENDED = 0
    // YT.PlayerState.PLAYING = 1
    // YT.PlayerState.CUED = 5
    
    console.log('🎬 Player state changed:', {
      state: event.data,
      stateName: event.data === 0 ? 'ENDED' : event.data === 1 ? 'PLAYING' : event.data === 5 ? 'CUED' : 'OTHER',
    });
    
    if (event.data === window.YT.PlayerState.PLAYING) {
      // Get current video index
      const playlistIndex = event.target.getPlaylistIndex();
      
      console.log('📹 Video playing:', {
        currentVideoIndex,
        playlistIndex,
        changed: playlistIndex !== currentVideoIndex,
      });
      
      if (playlistIndex !== currentVideoIndex) {
        console.log(`📹 Video changed: ${currentVideoIndex} → ${playlistIndex}`);
        setCurrentVideoIndex(playlistIndex);
        
        // Debounce save to avoid too many API calls
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          savePlaylistProgress(playlistIndex);
        }, 2000);
      }
    }
  };

  const savePlaylistProgress = async (index: number) => {
    try {
      console.log(`💾 Saving playlist progress for stream ${streamId}: video ${index}`);
      
      const response = await fetch(`/api/streams/${streamId}/playlist-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentIndex: index }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to save playlist progress:', errorData);
      } else {
        const data = await response.json();
        console.log('✅ Playlist progress saved:', data);
      }
    } catch (error) {
      console.error('❌ Error saving playlist progress:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading playlist...</p>
          </div>
        </div>
      )}
      
      <Card className="overflow-hidden bg-black border-border/50">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </Card>

      <div className="mt-4 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>Playing from YouTube playlist</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Videos will automatically advance and progress is saved
        </p>
      </div>
    </div>
  );
}
