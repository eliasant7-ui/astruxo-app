/**
 * Stream Viewer Page
 * Watch live stream with Agora player and real-time chat
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Radio, Send, Eye, Gift, Sparkles, Lock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import ViewerView from './viewer-view';
import GiftSelector from '@/components/GiftSelector';
import GiftAnimation from '@/components/GiftAnimation';
import FloatingGifts from '@/components/FloatingGifts';
import FollowButton from '@/components/FollowButton';
import ProfileModal from '@/components/ProfileModal';
import SignupPrompt from '@/components/SignupPrompt';
import AuthDialog from '@/components/AuthDialog';
import { YouTubePlaylistPlayer } from '@/components/YouTubePlaylistPlayer';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-fetch';

interface Stream {
  id: number;
  title: string;
  description: string | null;
  status: string;
  viewerCount: number;
  peakViewerCount: number;
  startedAt: string;
  isPrivate: boolean;
  requiredGiftId: number | null;
  goalAmount: number | null;
  currentGoalProgress: number;
  entryPrice: number | null;
  isSystemStream?: boolean;
  youtubePlaylistId?: string | null;
  currentPlaylistIndex?: number;
  userId: number;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    followerCount: number;
    isFollowing?: boolean;
    firebaseUid?: string;
  };
}

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  message: string;
  createdAt: string;
  type?: 'message' | 'join' | 'leave'; // Add type for system messages
  isHost?: boolean;
  isModerator?: boolean;
}

// Helper function to convert URLs in text to clickable links
function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline font-medium break-all transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function StreamViewerPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Real-time stats
  const [liveViewerCount, setLiveViewerCount] = useState(0);
  
  // Gift selector
  const [giftSelectorOpen, setGiftSelectorOpen] = useState(false);
  
  // Gift notifications
  const [giftNotifications, setGiftNotifications] = useState<any[]>([]);
  const [floatingGifts, setFloatingGifts] = useState<any[]>([]); // For floating animation
  
  // Profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Auth dialogs
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signupPromptOpen, setSignupPromptOpen] = useState(false);
  
  // Chat visibility
  const [showChat, setShowChat] = useState(true);
  
  // Reactions
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  
  // Private stream access
  const [hasPrivateAccess, setHasPrivateAccess] = useState(false);
  const [requiredGift, setRequiredGift] = useState<any>(null);
  
  // Entry price access
  const [hasEntryAccess, setHasEntryAccess] = useState(false);
  const [isPayingEntry, setIsPayingEntry] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);

  // Watch for goal completion
  useEffect(() => {
    if (stream?.goalAmount && stream.currentGoalProgress >= stream.goalAmount && !goalReached) {
      setGoalReached(true);
      setShowGoalCelebration(true);
      toast.success('🎉 Goal Reached!', {
        description: `The stream goal of ${stream.goalAmount} coins has been reached!`,
      });
      
      // Hide celebration after 5 seconds
      setTimeout(() => {
        setShowGoalCelebration(false);
      }, 5000);
    }
  }, [stream?.currentGoalProgress, stream?.goalAmount, goalReached]);

  useEffect(() => {
    if (streamId) {
      fetchStream();
    }
  }, [streamId]);

  useEffect(() => {
    if (!stream || stream.status !== 'live') return;

    // Initialize Socket.IO
    // Use current origin for connection (works in both preview and production)
    const socketUrl = window.location.origin;
    console.log('🔌 Connecting to Socket.IO at:', socketUrl);
    
    const newSocket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);

      // Authenticate (if user is logged in)
      const token = localStorage.getItem('firebaseToken');
      if (token) {
        console.log('🔐 Authenticating with token...');
        newSocket.emit('authenticate', { token });
      } else {
        console.log('⚠️ No token found, connecting as guest');
      }

      // Join stream room
      console.log('📺 Joining stream room:', streamId);
      newSocket.emit('join_stream', { streamId: parseInt(streamId!) });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    newSocket.on('joined_stream', (data: any) => {
      console.log('✅ Joined stream:', data);
    });

    newSocket.on('chat_history', (history: ChatMessage[]) => {
      console.log('📜 Received chat history:', history.length, 'messages');
      setMessages(history);
    });

    newSocket.on('viewer_count', (data: { count: number }) => {
      console.log('👥 Viewer count updated:', data.count);
      setLiveViewerCount(data.count);
    });

    newSocket.on('privacy_changed', (data: { isPrivate: boolean; requiredGiftId: number | null; entryPrice?: number }) => {
      console.log('🔒 Privacy changed:', data);
      if (stream) {
        const wasPublicAndFree = !stream.isPrivate && (!stream.entryPrice || stream.entryPrice === 0);
        const isNowPrivateOrPaid = data.isPrivate || (data.entryPrice && data.entryPrice > 0);
        
        setStream({
          ...stream,
          isPrivate: data.isPrivate,
          requiredGiftId: data.requiredGiftId,
          entryPrice: data.entryPrice !== undefined ? data.entryPrice : stream.entryPrice,
        });
        
        // ONLY reload if stream CHANGED FROM public/free TO private/paid
        const streamBecameRestricted = wasPublicAndFree && isNowPrivateOrPaid;
        
        if (streamBecameRestricted) {
          // Check if user is broadcaster
          const isBroadcaster = user && stream.user.firebaseUid === user.uid;
          
          if (!isBroadcaster) {
            // Immediately clear credentials and set access to false
            // This prevents infinite loading state during the 2-second delay
            setCredentials(null);
            setHasPrivateAccess(false);
            setHasEntryAccess(false);
            
            console.log('🔄 Stream became restricted - reloading page...');
            toast.info('Stream privacy settings changed. Reloading...', { duration: 2000 });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } else {
          // Stream didn't become restricted, update access normally
          if (data.isPrivate && data.requiredGiftId) {
            checkPrivateAccess(stream.id, data.requiredGiftId);
          } else if (data.entryPrice && data.entryPrice > 0) {
            checkEntryAccess(stream.id);
          } else if (!data.isPrivate && (!data.entryPrice || data.entryPrice === 0)) {
            // Stream is now public and free, grant access
            setHasPrivateAccess(true);
            setHasEntryAccess(true);
          }
        }
      }
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      setMessages((prev) => {
        const newMessages = [...prev, { ...message, type: 'message' as const }];
        // Keep only last 100 messages to prevent memory issues
        return newMessages.slice(-100);
      });
    });

    newSocket.on('user_joined', (data: { username: string; displayName: string }) => {
      const systemMessage: ChatMessage = {
        id: Date.now(),
        userId: 0,
        username: 'System',
        displayName: 'System',
        avatarUrl: null,
        message: `${data.displayName} joined the stream`,
        createdAt: new Date().toISOString(),
        type: 'join',
      };
      setMessages((prev) => {
        const newMessages = [...prev, systemMessage];
        return newMessages.slice(-100);
      });
    });

    newSocket.on('user_left', (data: { username: string; displayName: string }) => {
      const systemMessage: ChatMessage = {
        id: Date.now(),
        userId: 0,
        username: 'System',
        displayName: 'System',
        avatarUrl: null,
        message: `${data.displayName} left the stream`,
        createdAt: new Date().toISOString(),
        type: 'leave',
      };
      setMessages((prev) => {
        const newMessages = [...prev, systemMessage];
        return newMessages.slice(-100);
      });
    });

    newSocket.on('gift_sent', (data: any) => {
      console.log('🎁 Gift received:', data);
      
      // Update goal progress if goal is set
      if (stream && stream.goalAmount) {
        setStream((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentGoalProgress: prev.currentGoalProgress + data.coinAmount,
          };
        });
      }
      
      // Check if this gift grants access (for entry price or private streams)
      if (data.grantedPrivateAccess || data.grantedEntryAccess) {
        console.log('✅ Gift granted access to stream');
        setHasPrivateAccess(true);
        setHasEntryAccess(true);
        toast.success('Access granted! You can now watch the stream.', {
          duration: 5000,
        });
        // Refresh stream data to get updated access status
        fetchStream();
      }
      
      // Show toast notification
      toast.success(`${data.senderDisplayName} sent ${data.giftName}!`, {
        description: `${data.coinAmount} coins${data.message ? ` - "${data.message}"` : ''}`,
        duration: 4000,
      });
      
      // Add to gift notifications (show for 5 seconds)
      const notificationId = `gift-${Date.now()}`;
      setGiftNotifications((prev) => [...prev, { ...data, id: notificationId }]);
      
      // Add to floating gifts (classic floating animation)
      setFloatingGifts((prev) => [...prev, {
        id: notificationId,
        giftIcon: data.giftIcon,
        giftName: data.giftName,
        coinAmount: data.coinAmount,
      }]);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        setGiftNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setFloatingGifts((prev) => prev.filter((g) => g.id !== notificationId));
      }, 5000);
      
      // Add system message to chat
      const giftMessage: ChatMessage = {
        id: Date.now(),
        userId: 0,
        username: 'System',
        displayName: 'System',
        avatarUrl: null,
        message: `${data.senderDisplayName} sent ${data.giftName} (${data.coinAmount} coins)${data.message ? `: "${data.message}"` : ''}`,
        createdAt: new Date().toISOString(),
        type: 'join', // Use 'join' type for special styling
      };
      setMessages((prev) => {
        const newMessages = [...prev, giftMessage];
        return newMessages.slice(-100);
      });
    });

    // Handle goal updates in real-time
    newSocket.on('goal_updated', (data: { goalAmount: number; currentGoalProgress: number }) => {
      console.log('🎯 [VIEWER] Goal updated event received:', data);
      setStream((prev) => {
        if (!prev) {
          console.log('🎯 [VIEWER] No stream state, skipping update');
          return prev;
        }
        console.log('🎯 [VIEWER] Updating stream state with new goal:', {
          oldGoalAmount: prev.goalAmount,
          newGoalAmount: data.goalAmount,
          oldProgress: prev.currentGoalProgress,
          newProgress: data.currentGoalProgress,
        });
        return {
          ...prev,
          goalAmount: data.goalAmount,
          currentGoalProgress: data.currentGoalProgress,
        };
      });
      toast.success('Stream goal updated!', {
        description: `New goal: ${data.goalAmount} coins`,
        duration: 3000,
      });
    });

    // Handle goal removal in real-time
    newSocket.on('goal_removed', () => {
      console.log('🎯 [VIEWER] Goal removed event received');
      setStream((prev) => {
        if (!prev) {
          console.log('🎯 [VIEWER] No stream state, skipping removal');
          return prev;
        }
        console.log('🎯 [VIEWER] Removing goal from stream state');
        return {
          ...prev,
          goalAmount: null,
          currentGoalProgress: 0,
        };
      });
      toast.info('Stream goal removed', {
        duration: 3000,
      });
    });

    newSocket.on('reaction', (data: { emoji: string; userId: number }) => {
      console.log('💫 Reaction received:', data);
      
      // Add reaction to display
      const reactionId = `reaction-${Date.now()}-${Math.random()}`;
      const randomX = Math.random() * 80 + 10; // 10% to 90% of screen width
      
      setReactions((prev) => [...prev, { id: reactionId, emoji: data.emoji, x: randomX }]);
      
      // Remove reaction after animation (3 seconds)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reactionId));
      }, 3000);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });

    // Handle message deletion
    newSocket.on('message_deleted', (data: { messageId: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    // Handle being kicked
    newSocket.on('kicked', (data: { message: string }) => {
      toast.error(data.message);
      setTimeout(() => {
        navigate('/streams');
      }, 2000);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave_stream', { streamId: parseInt(streamId!) });
        newSocket.disconnect();
      }
    };
  }, [stream, streamId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkPrivateAccess = async (streamId: number, requiredGiftId: number | null) => {
    if (!user || !requiredGiftId) return;
    
    try {
      const response = await apiFetch(`/api/streams/${streamId}/private-access`);
      const data = await response.json();
      
      if (data.success) {
        setHasPrivateAccess(data.hasAccess);
        setRequiredGift(data.requiredGift);
      }
    } catch (error) {
      console.error('Error checking private access:', error);
    }
  };

  const checkEntryAccess = async (streamId: number) => {
    if (!user) {
      console.log('⚠️ Cannot check entry access - no user logged in');
      return;
    }
    
    try {
      console.log('🔍 Checking entry access for stream:', streamId);
      const response = await apiFetch(`/api/streams/${streamId}/entry-access`);
      const data = await response.json();
      
      console.log('📊 Entry access response:', data);
      
      if (data.hasAccess) {
        console.log('✅ User HAS entry access, reason:', data.reason);
        setHasEntryAccess(true);
        // Entry price streams are automatically private, so grant private access too
        setHasPrivateAccess(true);
      } else {
        console.log('❌ User DOES NOT have entry access');
        console.log('   - Entry price:', data.entryPrice);
        console.log('   - Total gifts sent:', data.totalGiftsSent);
        console.log('   - Remaining:', data.remaining);
        setHasEntryAccess(false);
      }
    } catch (error) {
      console.error('❌ Error checking entry access:', error);
    }
  };

  const handlePayEntry = async () => {
    if (!user || !stream?.entryPrice) return;
    
    // Open gift selector to let user choose how to pay
    setGiftSelectorOpen(true);
  };

  const fetchStream = async () => {
    try {
      console.log('🔄 Fetching stream data for streamId:', streamId);
      
      // Use apiFetch if user is logged in, otherwise use regular fetch
      let response;
      if (user) {
        console.log('✅ User logged in, using apiFetch with fresh token');
        response = await apiFetch(`/api/streams/${streamId}`);
      } else {
        console.log('ℹ️ No user, using regular fetch');
        response = await fetch(`/api/streams/${streamId}`);
      }
      
      const data = await response.json();
      console.log('📥 Stream data received:', { 
        success: data.success, 
        hasStream: !!data.stream,
        isFollowing: data.stream?.user?.isFollowing 
      });

      if (data.success) {
        console.log('✅ Stream loaded successfully:', {
          streamId: data.stream.id,
          title: data.stream.title,
          isPrivate: data.stream.isPrivate,
          entryPrice: data.stream.entryPrice,
          isSystemStream: data.stream.isSystemStream,
          hasCredentials: !!data.credentials,
          credentials: data.credentials,
        });
        
        setStream(data.stream);
        
        // Check if stream is private and user has access
        if (data.stream.isPrivate && user) {
          await checkPrivateAccess(data.stream.id, data.stream.requiredGiftId);
        }
        
        // Check if stream has entry price and user has access
        if (data.stream.entryPrice && user) {
          await checkEntryAccess(data.stream.id);
        }
        
        // Check if goal is reached
        if (data.stream.goalAmount && data.stream.currentGoalProgress >= data.stream.goalAmount) {
          setGoalReached(true);
        }
        
        // Set Agora credentials if available
        if (data.credentials) {
          console.log('✅ Setting credentials:', data.credentials);
          setCredentials(data.credentials);
        } else {
          console.warn('⚠️ No credentials provided by backend');
        }
        
        setError(null);
      } else {
        setError('Stream not found');
      }
    } catch (err) {
      setError('Failed to load stream');
      console.error('Error fetching stream:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !socket || !isConnected) return;

    socket.emit('send_message', {
      streamId: parseInt(streamId!),
      message: messageInput.trim(),
    });

    setMessageInput('');
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (stream) {
      setStream({
        ...stream,
        user: {
          ...stream.user,
          isFollowing,
          followerCount: isFollowing
            ? stream.user.followerCount + 1
            : stream.user.followerCount - 1,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stream...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-2">Stream Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This stream does not exist'}</p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stream.status === 'ended') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Radio className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Stream Ended</h2>
            <p className="text-muted-foreground mb-6">This stream has ended.</p>
            <Button asChild>
              <Link to="/">Browse Live Streams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <title>{stream.title} - LiveStream Platform</title>
      <meta name="description" content={stream.description || `Watch ${stream.user.displayName || stream.user.username} live`} />

      {/* Fullscreen Video Background - Below controls */}
      <div className="fixed inset-0 bg-black" style={{ zIndex: 0 }}>
        {/* System streams show YouTube playlist player */}
        {stream.isSystemStream && stream.youtubePlaylistId ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
              <YouTubePlaylistPlayer 
                playlistId={stream.youtubePlaylistId}
                streamId={stream.id}
                currentIndex={stream.currentPlaylistIndex || 0}
                autoplay={true}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Regular Agora streams */}
            
            {/* Guest user trying to watch private/entry price stream */}
            {!user && (stream.isPrivate || stream.entryPrice) && !credentials && (
              <div className="w-full h-full flex items-center justify-center">
                <Card className="max-w-md mx-4 bg-black/80 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
                      <p className="text-white/70 mb-6">
                        {stream.entryPrice 
                          ? `This stream requires a ${stream.entryPrice} coin entry payment.`
                          : 'This is a private stream.'
                        }
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/')}
                      className="w-full"
                      size="lg"
                    >
                      Sign In to Watch
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Loading state for authenticated users or public streams */}
            {!credentials && !stream.isSystemStream && !((!user && (stream.isPrivate || stream.entryPrice))) && (
              <div className="w-full h-full flex items-center justify-center">
                <Card className="max-w-md mx-4 bg-black/80 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-white">Connecting to stream...</p>
                    <p className="text-white/60 text-sm mt-2">Please wait</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {credentials && (
              <>
                {/* Only render video if user has access */}
                {/* For entry price streams: MUST be logged in AND have paid */}
                {/* For private streams: MUST have private access OR be broadcaster */}
                {/* For public streams: Anyone can watch */}
                {(() => {
                  const isBroadcaster = stream.user.firebaseUid === user?.uid;
                  
                  // Broadcaster always has access
                  if (isBroadcaster) return true;
                  
                  // Entry price streams require login AND payment
                  if (stream.entryPrice) {
                    return user && hasEntryAccess;
                  }
                  
                  // Private streams (gift-gated) require private access
                  if (stream.isPrivate) {
                    return hasPrivateAccess;
                  }
                  
                  // Public streams - require login to watch
                  return user !== null;
                })() && (
                  <ViewerView
                    credentials={credentials}
                    onError={(err) => setError(err)}
                  />
                )}
              </>
            )}
          </>
        )}
        
        {/* Entry Price Overlay - Takes priority, shows first - ALWAYS VISIBLE */}
        {stream.entryPrice && !hasEntryAccess && stream.user.firebaseUid !== user?.uid && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
            <Card className="max-w-md mx-4 bg-black/80 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Paid Stream</h2>
                  <p className="text-white/70 mb-6">
                    This stream requires an entry payment to watch.
                  </p>
                </div>
                
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-white/60 mb-2">Entry Price</p>
                  <p className="text-3xl font-bold text-primary">{stream.entryPrice} coins</p>
                </div>
                
                {user ? (
                  <Button 
                    onClick={handlePayEntry}
                    className="w-full"
                    size="lg"
                  >
                    Pay Entry & Watch
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/')}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    Sign In to Watch
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Private Stream Overlay - Only for gift-gated streams (no entry price) - ALWAYS VISIBLE */}
        {stream.isPrivate && !stream.entryPrice && !hasPrivateAccess && stream.user.firebaseUid !== user?.uid && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
            <Card className="max-w-md mx-4 bg-black/80 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Private Stream</h2>
                  <p className="text-white/70 mb-6">
                    This is a private stream. Send the required gift to unlock access.
                  </p>
                </div>
                
                {requiredGift && (
                  <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-white/60 mb-2">Required Gift</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl">{requiredGift.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-white">{requiredGift.name}</p>
                        <p className="text-sm text-primary">{requiredGift.coinPrice} coins</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {user ? (
                  <Button 
                    onClick={() => setGiftSelectorOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    Send Gift to Unlock
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setAuthDialogOpen(true)}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    Sign In to Watch
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Visitor Gate Overlay - For non-registered users on public streams */}
        {!user && !stream.isPrivate && !stream.entryPrice && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-20">
            <Card className="max-w-md mx-4 bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/30 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    ¡Crea una cuenta para ver este stream!
                  </h2>
                  <p className="text-white/70 mb-6">
                    Regístrate gratis para ver transmisiones en vivo, chatear con broadcasters y mucho más.
                  </p>
                </div>
                
                {/* Benefits */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 text-left">
                  <p className="text-sm font-semibold text-white mb-3">Con una cuenta gratuita puedes:</p>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Ver streams en vivo ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Chatear en tiempo real
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Enviar regalos a broadcasters
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Seguir a tus creadores favoritos
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => setAuthDialogOpen(true)}
                    size="lg"
                    className="w-full gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    Crear cuenta gratis
                  </Button>
                  
                  <p className="text-xs text-white/60">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => setAuthDialogOpen(true)}
                      className="font-semibold text-primary hover:underline"
                    >
                      Inicia sesión aquí
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {credentials && (
          <>
            {/* Goal Reached Celebration */}
            {showGoalCelebration && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                    <h2 className="text-4xl font-bold text-white mb-2">Goal Reached!</h2>
                    <p className="text-xl text-white/90">{stream.goalAmount} coins achieved</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {!credentials && (
          <>
            {/* Only show loading spinner if NO overlays are visible */}
            {/* If entry price or private overlay is showing, don't show loading */}
            {!((stream.entryPrice && !hasEntryAccess && stream.user.firebaseUid !== user?.uid) ||
               (stream.isPrivate && !stream.entryPrice && !hasPrivateAccess && stream.user.firebaseUid !== user?.uid)) && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading stream...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Overlay UI - Above video */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div className="h-full flex flex-col pointer-events-none safe-area-inset">
          {/* Top Bar - Fixed Controls with Safe Area */}
          <div className="p-3 md:p-4 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <div className="flex items-center justify-between gap-2 md:gap-3">
              {/* Left: Streamer Info & Stats */}
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <button
                  onClick={() => handleUserClick(stream.user.id)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 cursor-pointer"
                >
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-white/30 shadow-lg flex-shrink-0">
                    <AvatarImage src={stream.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                      {stream.user.displayName?.[0] || stream.user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs md:text-sm drop-shadow-lg truncate">{stream.user.displayName || stream.user.username}</p>
                    <p className="text-white/80 text-[10px] md:text-xs drop-shadow-lg flex items-center gap-1">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      {stream.user.followerCount}
                    </p>
                  </div>
                </button>
                
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Badge variant="destructive" className="animate-pulse shadow-lg text-[10px] md:text-xs">
                    <Radio className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                  <div className="flex items-center gap-1 text-white/90 text-[10px] md:text-xs drop-shadow-lg">
                    <Eye className="h-3 w-3" />
                    <span className="font-medium">{liveViewerCount || stream.viewerCount}</span>
                  </div>
                  
                  {/* Goal Progress Badge - Mobile */}
                  {stream.goalAmount && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg text-[10px] md:hidden">
                      <svg className="h-2.5 w-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      {stream.currentGoalProgress}/{stream.goalAmount}
                    </Badge>
                  )}
                </div>
                
                {/* Goal Progress */}
                {stream.goalAmount && (
                  <div className="hidden md:block ml-2">
                    <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <div>
                          <p className="text-[10px] text-white/60">Goal</p>
                          <p className="text-xs font-semibold text-white">
                            {stream.currentGoalProgress} / {stream.goalAmount}
                            {goalReached && <span className="ml-1 text-primary">✓</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Actions - ALWAYS VISIBLE */}
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {user && (
                  <div className="hidden sm:block">
                    <FollowButton
                      userId={stream.user.id}
                      isFollowing={stream.user.isFollowing || false}
                      onFollowChange={handleFollowChange}
                      size="sm"
                      className="h-7 md:h-8 text-[10px] md:text-xs shadow-lg"
                    />
                  </div>
                )}
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 shadow-xl flex-shrink-0"
                  style={{ zIndex: 50 }}
                  title="Back to streams"
                >
                  <Link to="/streams">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Right - Floating Chat with Safe Area */}
          {/* Hide chat for entry price streams if user hasn't paid */}
          {/* Hide chat for private streams without access */}
          {/* Hide chat for guest users on private/entry price streams */}
          {(() => {
            // Check if current user is the broadcaster
            // IMPORTANT: Must verify user exists first to avoid false positives
            const isBroadcaster = user && stream.user.firebaseUid === user.uid;
            
            // Determine if chat should be visible
            let shouldShowChat = false;
            
            console.log('🔍 Chat visibility check:', {
              hasUser: !!user,
              userUid: user?.uid,
              broadcasterUid: stream.user.firebaseUid,
              isBroadcaster,
              isPrivate: stream.isPrivate,
              entryPrice: stream.entryPrice,
            });
            
            // Broadcaster always sees chat
            if (isBroadcaster) {
              shouldShowChat = true;
              console.log('✅ Chat visible: Broadcaster');
            }
            // Guest users cannot see chat on private or entry price streams
            else if (!user && (stream.isPrivate || stream.entryPrice)) {
              shouldShowChat = false;
              console.log('❌ Chat hidden: Guest user on private/entry price stream', {
                isPrivate: stream.isPrivate,
                entryPrice: stream.entryPrice,
              });
            }
            // Entry price streams: must be logged in AND have paid
            else if (stream.entryPrice) {
              shouldShowChat = user && hasEntryAccess;
              console.log(`${shouldShowChat ? '✅' : '❌'} Entry price stream: user=${!!user}, hasEntryAccess=${hasEntryAccess}`);
            }
            // Private streams: must have private access
            else if (stream.isPrivate) {
              shouldShowChat = user && hasPrivateAccess;
              console.log(`${shouldShowChat ? '✅' : '❌'} Private stream: user=${!!user}, hasPrivateAccess=${hasPrivateAccess}`);
            }
            // Public streams: anyone can see chat
            else {
              shouldShowChat = true;
              console.log('✅ Public stream: chat visible to all');
            }
            
            return shouldShowChat;
          })() && (
            <div className="flex-1 flex items-end justify-end p-3 md:p-4 pointer-events-none" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              <div className="w-full md:w-80 flex flex-col pointer-events-auto gap-2">
                {/* Chat Toggle Button - Always visible with better mobile styling */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowChat(!showChat)}
                    size="sm"
                    variant="ghost"
                    className="bg-black/70 hover:bg-black/80 backdrop-blur-sm text-white shadow-2xl h-9 md:h-8 px-4 md:px-3 font-semibold border border-white/20"
                  >
                    {showChat ? (
                      <>
                        <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="hidden sm:inline">Hide Chat</span>
                        <span className="sm:hidden">Hide</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="hidden sm:inline">Show Chat</span>
                        <span className="sm:hidden">Show</span>
                      </>
                    )}
                  </Button>
                </div>

              {/* Chat Container - Collapsible */}
              {showChat && (
                <div className="max-h-[50vh] md:max-h-[55vh] flex flex-col">
                  {/* Messages - Scrollable */}
                  <div className="flex-1 overflow-y-auto mb-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="space-y-2 px-2">
                      {messages.length === 0 && (
                        <p className="text-center text-white/60 text-sm py-8 drop-shadow-lg">
                          No messages yet
                        </p>
                      )}
                      {messages.map((msg) => {
                        // System messages (join/leave notifications)
                        if (msg.type === 'join' || msg.type === 'leave') {
                          return (
                            <div key={msg.id} className="text-center py-1">
                              <p className="text-xs text-white/60 italic drop-shadow-lg">
                                {msg.message}
                              </p>
                            </div>
                          );
                        }

                        // Regular chat messages - Floating style
                        return (
                          <div key={msg.id} className="flex gap-2 items-start">
                            <button
                              onClick={() => handleUserClick(msg.userId)}
                              className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Avatar className="h-7 w-7 border-2 border-white/40 shadow-lg">
                                <AvatarImage src={msg.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs bg-primary/90">
                                  {msg.displayName[0] || msg.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleUserClick(msg.userId)}
                                  className={`text-sm font-bold ${msg.isHost ? 'text-primary' : 'text-white'} drop-shadow-lg leading-tight hover:underline cursor-pointer`}
                                >
                                  {msg.displayName}
                                </button>
                                {msg.isHost && (
                                  <Badge variant="default" className="text-[10px] px-1 py-0 bg-primary/90 shadow-lg">
                                    HOST
                                  </Badge>
                                )}
                                {!msg.isHost && msg.isModerator && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-purple-500/90 shadow-lg">
                                    MOD
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-white drop-shadow-lg break-words leading-snug">
                                {linkifyText(msg.message)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input with Emojis & Gift - Only for authenticated users */}
                  {user && (
                    <div className="flex items-center gap-2">
                      {/* Compact Message Input */}
                      <form onSubmit={handleSendMessage} className="flex gap-2 flex-1">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Message..."
                          maxLength={500}
                          disabled={!isConnected}
                          className="bg-black/60 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50 shadow-lg h-8 text-base"
                          style={{ fontSize: '16px' }}
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          disabled={!messageInput.trim() || !isConnected}
                          className="bg-primary/90 hover:bg-primary shadow-lg h-8 w-8 flex-shrink-0"
                        >
                          <Send className="h-3 w-3" />
                    </Button>
                  </form>
                  
                  {/* Emoji Reactions & Gift */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        console.log('🙂 emoji clicked, socket:', socket ? 'connected' : 'not connected');
                        if (socket) {
                          socket.emit('send_message', { 
                            streamId: stream.id, 
                            message: '🙂'
                          });
                          console.log('✅ 🙂 message sent via send_message event');
                        } else {
                          console.log('❌ Socket not connected');
                        }
                      }}
                      className="h-8 w-8 hover:scale-110 transition-transform hover:bg-white/10 rounded-full"
                    >
                      <span className="text-xl">🙂</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        console.log('❤️ emoji clicked, socket:', socket ? 'connected' : 'not connected');
                        if (socket) {
                          socket.emit('send_message', { 
                            streamId: stream.id, 
                            message: '❤️'
                          });
                          console.log('✅ ❤️ message sent via send_message event');
                        } else {
                          console.log('❌ Socket not connected');
                        }
                      }}
                      className="h-8 w-8 hover:scale-110 transition-transform hover:bg-white/10 rounded-full"
                    >
                      <span className="text-xl">❤️</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setGiftSelectorOpen(true)}
                      className="h-8 w-8 hover:scale-110 transition-transform hover:bg-white/10 rounded-full"
                    >
                      <span className="text-xl">🎁</span>
                    </Button>
                  </div>
                    </div>
                  )}
                  
                  {!user && (
                    <div className="text-center py-3 bg-black/60 backdrop-blur-sm rounded-lg border border-white/30 shadow-lg">
                      <p className="text-xs text-white/70 mb-2 drop-shadow-lg">
                        Sign in to chat
                      </p>
                      <Button size="sm" variant="secondary" onClick={() => navigate('/')} className="h-7 text-xs">
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Gift Button - Always visible when chat is hidden */}
              {!showChat && user && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setGiftSelectorOpen(true)}
                    className="h-12 w-12 hover:scale-110 transition-transform bg-black/60 hover:bg-black/70 backdrop-blur-sm rounded-full shadow-lg"
                  >
                    <span className="text-2xl">🎁</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Gift Selector Modal */}
      <GiftSelector
        open={giftSelectorOpen}
        onOpenChange={setGiftSelectorOpen}
        streamId={stream.id}
        onGiftSent={(gift, message, grantedAccess) => {
          // Emit gift event via Socket.IO
          if (socket) {
            socket.emit('send_gift', {
              streamId: stream.id,
              giftName: gift.name,
              giftIcon: gift.icon,
              coinAmount: gift.coinPrice,
              message,
            });
          }
          
          // If access was granted, update state immediately
          if (grantedAccess) {
            console.log('✅ Access granted by gift, updating state');
            setHasPrivateAccess(true);
            setHasEntryAccess(true);
            // Refresh stream data
            fetchStream();
          }
          
          // If stream is private and this is the required gift, check access again
          if (stream.isPrivate && stream.requiredGiftId === gift.id) {
            setTimeout(() => {
              checkPrivateAccess(stream.id, stream.requiredGiftId);
            }, 1000);
          }
        }}
      />

      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-0 animate-float-up"
            style={{
              left: `${reaction.x}%`,
              animation: 'float-up 3s ease-out forwards',
            }}
          >
            <span className="text-4xl drop-shadow-lg">{reaction.emoji}</span>
          </div>
        ))}
      </div>

      {/* Gift Animations - Fullscreen overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <GiftAnimation notifications={giftNotifications} />
      </div>

      {/* Floating Gifts - Classic streaming style */}
      <FloatingGifts gifts={floatingGifts} />

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          userId={selectedUserId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />

      {/* Signup Prompt */}
      <SignupPrompt
        open={signupPromptOpen}
        onOpenChange={setSignupPromptOpen}
        onSignup={() => {
          setSignupPromptOpen(false);
          setAuthDialogOpen(true);
        }}
        trigger="stream"
      />

    </>
  );
}
