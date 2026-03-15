/**
 * Broadcaster Page
 * Interface for streamers to broadcast and manage their live stream
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Radio, StopCircle, AlertCircle, Clock, TrendingUp, Send, UserX, Trash2, UserCircle, SwitchCamera, Mic, MicOff, Users, MessageSquare, UserPlus, Coins, Eye, Ban, Shield, ArrowUpRight, Target, Edit, X, Share2, Home, Video } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { io, Socket } from 'socket.io-client';
import BroadcasterView from './broadcaster-view';
import GiftAnimation from '@/components/GiftAnimation';
import FloatingGifts from '@/components/FloatingGifts';
import ProfileModal from '@/components/ProfileModal';
import ViewersList from '@/components/ViewersList';
import ModerationPanel from '@/components/ModerationPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  message: string;
  createdAt: string;
  type?: 'join' | 'leave' | 'message';
  isHost?: boolean;
  isModerator?: boolean;
}

export default function BroadcasterPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stream, setStream] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewerCount, setPeakViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState('0:00');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stream is ready to start immediately (no pre-live modal needed)
  const hasInitializedRef = useRef(false);

  // End stream confirmation
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // Post-live summary
  const [showSummary, setShowSummary] = useState(false);
  const [streamSummary, setStreamSummary] = useState<any>(null);

  // Audio/Video controls
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isStreaming, setIsStreaming] = useState(false); // Control when to start streaming

  // Chat state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [giftNotifications, setGiftNotifications] = useState<any[]>([]);
  const [floatingGifts, setFloatingGifts] = useState<any[]>([]); // For floating animation
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Viewers list
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewersList, setShowViewersList] = useState(false);
  
  // Reactions
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);

  // Moderation
  const [moderators, setModerators] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<number>>(new Set());
  const [showModerationPanel, setShowModerationPanel] = useState(false);

  // Goal Management
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  useEffect(() => {
    fetchStreamDetails();

    // Poll for viewer count every 5 seconds
    const interval = setInterval(() => {
      fetchStreamDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [streamId]);

  // Calculate stream duration
  useEffect(() => {
    if (!stream || stream.status !== 'live') return;

    const updateDuration = () => {
      const startTime = new Date(stream.startedAt).getTime();
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000); // seconds
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      if (hours > 0) {
        setStreamDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setStreamDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  // Socket.IO connection for chat
  useEffect(() => {
    if (!streamId || !user) return;

    const token = localStorage.getItem('firebaseToken');
    if (!token) return;

    console.log('🔌 Connecting to Socket.IO as broadcaster...');

    const newSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected as broadcaster');
      setIsConnected(true);
      
      // Authenticate first
      const token = localStorage.getItem('firebaseToken');
      if (token) {
        console.log('🔐 Authenticating broadcaster with token...');
        newSocket.emit('authenticate', { token });
      }
      
      // Join stream room
      newSocket.emit('join_stream', { streamId: parseInt(streamId) });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data: any) => {
      console.log('✅ Broadcaster authenticated:', data);
    });

    newSocket.on('auth_error', (data: { message: string }) => {
      console.error('❌ Authentication error:', data.message);
    });

    newSocket.on('chat_history', (history: ChatMessage[]) => {
      console.log('📜 Received chat history:', history.length, 'messages');
      setMessages(history.map(msg => ({
        ...msg,
        isHost: msg.userId === stream?.userId,
      })));
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      console.log('💬 New message:', message);
      setMessages((prev) => {
        const newMessages = [...prev, {
          ...message,
          isHost: message.userId === stream?.userId,
        }];
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
      
      // Update coins earned
      setCoinsEarned((prev) => prev + (data.coinAmount || 0));
      
      // Update goal progress if goal is set
      if (stream?.goalAmount) {
        setStream((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentGoalProgress: (prev.currentGoalProgress || 0) + data.coinAmount,
          };
        });
      }
      
      // Show toast notification
      toast.success(`${data.senderDisplayName} sent ${data.giftName}!`, {
        description: `${data.coinAmount} coins${data.message ? ` - "${data.message}"` : ''}`,
        duration: 4000,
      });
      
      // Add to gift notifications (show animation for 5 seconds)
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
        message: `🎁 ${data.senderDisplayName} sent ${data.giftName} (${data.coinAmount} coins)${data.message ? `: "${data.message}"` : ''}`,
        createdAt: new Date().toISOString(),
        type: 'join',
      };
      setMessages((prev) => {
        const newMessages = [...prev, giftMessage];
        return newMessages.slice(-100);
      });
    });

    // Listen for viewers list updates
    newSocket.on('viewers_update', (data: { viewers: any[] }) => {
      console.log('👥 Viewers update:', data.viewers);
      setViewers(data.viewers);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });

    // Handle message deletion (broadcast to self too)
    newSocket.on('message_deleted', (data: { messageId: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    // Listen for reactions
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

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting socket...');
      newSocket.disconnect();
    };
  }, [streamId, user, stream?.userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchStreamDetails = async () => {
    try {
      const token = localStorage.getItem('firebaseToken');
      const response = await fetch(`/api/streams/${streamId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stream');
      }

      if (data.success) {
        console.log('🎯 STREAM DATA LOADED:', data.stream);
        console.log('🎯 Goal Amount:', data.stream.goalAmount);
        console.log('🎯 Entry Price:', data.stream.entryPrice);
        console.log('🎯 Current Goal Progress:', data.stream.currentGoalProgress);
        setStream(data.stream);
        setViewerCount(data.stream.viewerCount || 0);
        setPeakViewerCount(data.stream.peakViewerCount || 0);

        // Set credentials if available
        if (data.credentials) {
          setCredentials(data.credentials);
        }

        // Start streaming immediately (no pre-live modal needed)
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          setIsStreaming(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  // Toggle microphone mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // The BroadcasterView component will handle the actual muting via props
    toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  // Toggle camera facing (front/back)
  const handleFlipCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
    toast.success('Camera flipped');
  };

  // Handle share stream to feed (direct, no dialog)
  const handleCopyStreamLink = async () => {
    if (!stream) {
      toast.error('Stream no disponible');
      return;
    }

    try {
      // Get the current URL origin
      const origin = window.location.origin;
      const streamUrl = `${origin}/stream/${stream.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(streamUrl);
      
      toast.success('¡Link copiado!', {
        description: 'Puedes pegarlo donde quieras',
      });
    } catch (err) {
      console.error('❌ Copy link error:', err);
      toast.error('Error al copiar link', {
        description: 'Intenta de nuevo',
      });
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

  // Moderation functions
  const handleDeleteMessage = async (messageId: string, userId: number, content: string) => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/messages`, {
        method: 'DELETE',
        body: JSON.stringify({ messageId, userId, content }),
      });

      const data = await response.json();
      if (data.success) {
        // Remove message from UI
        setMessages(prev => prev.filter(m => m.id.toString() !== messageId));
        toast.success('Message deleted');
        
        // Emit socket event to remove message for all viewers
        if (socket) {
          socket.emit('message_deleted', { streamId: parseInt(streamId!), messageId });
        }
      } else {
        toast.error(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleKickUser = async (userId: number, username: string) => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/bans`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          banType: 'kick',
          reason: 'Kicked by broadcaster',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${username} has been kicked`);
        
        // Emit socket event to disconnect user
        if (socket) {
          socket.emit('user_kicked', { streamId: parseInt(streamId!), userId });
        }
        
        // Add to banned users set
        setBannedUsers(prev => new Set(prev).add(userId));
      } else {
        toast.error(data.message || 'Failed to kick user');
      }
    } catch (error) {
      console.error('Error kicking user:', error);
      toast.error('Failed to kick user');
    }
  };

  const handleBanUser = async (userId: number, username: string) => {
    try {
      const response = await apiFetch(`/api/streams/${streamId}/bans`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          banType: 'ban',
          reason: 'Banned by broadcaster',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${username} has been permanently banned`);
        
        // Emit socket event to disconnect user
        if (socket) {
          socket.emit('user_banned', { streamId: parseInt(streamId!), userId });
        }
        
        // Add to banned users set
        setBannedUsers(prev => new Set(prev).add(userId));
      } else {
        toast.error(data.message || 'Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleEndStream = () => {
    // Show confirmation dialog before ending
    setShowEndConfirmation(true);
  };

  // Goal Management Functions
  const handleOpenGoalDialog = () => {
    setGoalAmount(stream?.goalAmount?.toString() || '');
    setShowGoalDialog(true);
  };

  const handleUpdateGoal = async () => {
    if (!goalAmount || parseInt(goalAmount) < 0) {
      toast.error('Please enter a valid goal amount');
      return;
    }

    setIsUpdatingGoal(true);
    try {
      const response = await apiFetch(`/api/streams/${streamId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalAmount: parseInt(goalAmount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Goal updated successfully!');
        setShowGoalDialog(false);
        fetchStreamDetails(); // Refresh stream data
        
        // Emit socket event to notify all viewers about goal update
        console.log('🎯 Socket status:', { 
          socketExists: !!socket, 
          socketConnected: socket?.connected,
          streamId: streamId 
        });
        
        if (socket && socket.connected) {
          console.log('🎯 Emitting goal_updated event to streamId:', streamId);
          socket.emit('goal_updated', {
            streamId: parseInt(streamId!),
            goalAmount: parseInt(goalAmount),
            currentGoalProgress: stream?.currentGoalProgress || 0,
          });
          console.log('✅ goal_updated event emitted');
        } else {
          console.error('❌ Socket not connected, cannot emit goal_updated event');
        }
      } else {
        toast.error(data.message || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const handleRemoveGoal = async () => {
    setIsUpdatingGoal(true);
    try {
      const response = await apiFetch(`/api/streams/${streamId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalAmount: null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Goal removed successfully!');
        setShowGoalDialog(false);
        fetchStreamDetails(); // Refresh stream data
        
        // Emit socket event to notify all viewers about goal removal
        console.log('🎯 Socket status for removal:', { 
          socketExists: !!socket, 
          socketConnected: socket?.connected,
          streamId: streamId 
        });
        
        if (socket && socket.connected) {
          console.log('🎯 Emitting goal_removed event to streamId:', streamId);
          socket.emit('goal_removed', {
            streamId: parseInt(streamId!),
          });
          console.log('✅ goal_removed event emitted');
        } else {
          console.error('❌ Socket not connected, cannot emit goal_removed event');
        }
      } else {
        toast.error(data.message || 'Failed to remove goal');
      }
    } catch (error) {
      console.error('Error removing goal:', error);
      toast.error('Failed to remove goal');
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const confirmEndStream = async () => {
    console.log('🔴 confirmEndStream called');
    setIsEnding(true);

    try {
      // Check if stream is already ended
      if (stream?.status === 'ended') {
        console.log('⚠️ Stream is already ended, showing summary...');
        
        // Close dialog
        setShowEndConfirmation(false);
        
        // Show summary with current data
        setStreamSummary({
          duration: streamDuration,
          peakViewers: peakViewerCount,
          totalViewers: peakViewerCount,
          commentsCount: messages.length,
          newFollowers: 0,
          coinsEarned: 0,
        });
        
        setShowSummary(true);
        setIsEnding(false);
        return;
      }

      console.log('🛑 Ending stream...');
      console.log('📤 Making request to /api/streams/' + streamId + '/end');
      
      // Use apiFetch which automatically handles token refresh
      const response = await apiFetch(`/api/streams/${streamId}/end`, {
        method: 'POST',
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        console.log('✅ Stream ended successfully');
        
        // Close dialog ONLY after success
        setShowEndConfirmation(false);
        
        // Store summary data
        setStreamSummary({
          duration: streamDuration,
          peakViewers: peakViewerCount,
          totalViewers: data.summary?.totalViewers || peakViewerCount,
          commentsCount: messages.length,
          newFollowers: data.summary?.newFollowers || 0,
          coinsEarned: data.summary?.coinsEarned || 0,
        });
        
        // Clear credentials
        localStorage.removeItem('streamCredentials');
        
        // Show summary screen
        setShowSummary(true);
      } else {
        console.error('❌ Failed to end stream:', data.message);
        
        // If stream is already ended, show summary anyway
        if (data.message?.includes('already ended')) {
          console.log('⚠️ Stream already ended, showing summary...');
          
          // Close dialog
          setShowEndConfirmation(false);
          
          setStreamSummary({
            duration: streamDuration,
            peakViewers: peakViewerCount,
            totalViewers: peakViewerCount,
            commentsCount: messages.length,
            newFollowers: 0,
            coinsEarned: coinsEarned,
          });
          setShowSummary(true);
        } else {
          // Keep dialog open on error
          console.error('❌ Keeping dialog open due to error');
          toast.error('Failed to end stream', {
            description: data.message || 'Please try again',
          });
        }
      }
    } catch (err) {
      console.error('❌ End stream error:', err);
      
      // Keep dialog open on error
      console.error('❌ Keeping dialog open due to exception');
      toast.error('Failed to end stream', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsEnding(false);
    }
  };



  const handleViewProfile = (userId: number) => {
    handleUserClick(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream || !credentials) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Stream Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This stream does not exist or has ended.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <title>Broadcasting - {stream.title}</title>
      <meta name="description" content={`Live streaming: ${stream.title}`} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

      {/* Fullscreen Video Background - Below controls */}
      {!showSummary && (
        <div className="fixed inset-0 bg-black" style={{ zIndex: 0 }}>
          <BroadcasterView
            credentials={credentials}
            onError={(err) => setError(err)}
            isMuted={isMuted}
            cameraFacing={cameraFacing}
            shouldStart={isStreaming}
          />
        </div>
      )}

      {/* Overlay UI - Above video */}
      {!showSummary && (
        <div className="fixed inset-0 pointer-events-none flex flex-col" style={{ zIndex: 10 }}>
          {/* Top Bar - Mobile-First Layout */}
          <div className="pointer-events-auto">
            {/* Mobile Layout - Stack vertically (iPhone & iPad portrait) */}
            <div className="md:hidden">
              {/* Row 1: LIVE Badge + Control Buttons */}
              <div className="flex items-center justify-between gap-2 p-3 bg-gradient-to-b from-black/90 to-transparent" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                <div className="flex items-center gap-1">
                  <Badge variant="destructive" className="animate-pulse shadow-lg text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                    <Radio className="h-2.5 w-2.5 mr-0.5 fill-current" />
                    LIVE
                  </Badge>
                  {stream?.isPrivate && (
                    <Badge className="bg-purple-600 hover:bg-purple-700 shadow-lg text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                      <Shield className="h-2.5 w-2.5" />
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Shield Button - Moderation */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowModerationPanel(true)}
                    className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                    title="Moderation & Privacy"
                  >
                    <Shield className="h-5 w-5 text-white" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFlipCamera}
                    className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                    title="Flip Camera"
                  >
                    <SwitchCamera className="h-5 w-5 text-white" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleMute}
                    className={`h-10 w-10 rounded-full backdrop-blur-sm shadow-md ${
                      isMuted 
                        ? 'bg-red-500/90 hover:bg-red-600/90' 
                        : 'bg-white/15 hover:bg-white/25'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5 text-white" />
                    ) : (
                      <Mic className="h-5 w-5 text-white" />
                    )}
                  </Button>

                  {/* Copy Link Button - Mobile */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyStreamLink}
                    className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                    title="Copiar Link"
                  >
                    <Share2 className="h-5 w-5 text-white" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndStream}
                    disabled={isEnding}
                    className="bg-red-600/90 hover:bg-red-700 shadow-md h-10 px-4 text-sm font-medium rounded-full"
                  >
                    {isEnding ? '...' : 'End'}
                  </Button>
                </div>
              </div>
              
              {/* Row 2: Stats */}
              <div className="flex items-center gap-2 px-3 pb-3 text-white/90 text-sm font-medium overflow-x-auto">
                <button 
                  onClick={() => setShowViewersList(true)}
                  className="flex items-center gap-1.5 bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 transition-colors cursor-pointer flex-shrink-0"
                >
                  <Eye className="h-4 w-4" />
                  <span>{viewerCount}</span>
                </button>
                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0">
                  <Clock className="h-4 w-4" />
                  <span>{streamDuration}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400">{coinsEarned}</span>
                </div>
                
                {/* Goal Badge - Mobile Row 2 */}
                {stream?.goalAmount ? (
                  <button
                    onClick={handleOpenGoalDialog}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0 transition-all active:scale-95"
                  >
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span className="text-white">{stream.currentGoalProgress || 0}/{stream.goalAmount}</span>
                    <Edit className="h-3 w-3 text-white/80" />
                  </button>
                ) : (
                  <button
                    onClick={handleOpenGoalDialog}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0 transition-all active:scale-95"
                  >
                    <Target className="h-4 w-4 text-white" />
                    <span className="text-white text-xs font-bold">Add Goal</span>
                  </button>
                )}

                {/* Home Button - Mobile Row 2 (Icon Only) */}
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="flex items-center justify-center bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full h-7 w-7 flex-shrink-0 transition-colors"
                  title="Ver Feed"
                >
                  <Home className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Desktop Layout - Single row (iPad landscape & desktop) */}
            <div className="hidden md:block p-3 lg:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <div className="flex items-center justify-between gap-2">
              {/* Left: LIVE Badge + Stats */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="destructive" className="animate-pulse shadow-2xl text-sm font-bold px-3 py-1.5 flex-shrink-0">
                  <Radio className="h-4 w-4 mr-1.5 fill-current" />
                  LIVE
                </Badge>
                {stream?.isPrivate && (
                  <Badge className="bg-purple-600 hover:bg-purple-700 shadow-2xl text-sm font-bold px-3 py-1.5 flex-shrink-0">
                    <Shield className="h-4 w-4 mr-1.5" />
                    PRIVATE
                  </Badge>
                )}
                
                {/* Goal Progress Badge - Desktop */}
                {stream?.goalAmount ? (
                  <button
                    onClick={handleOpenGoalDialog}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-2xl text-sm font-bold px-3 py-1.5 flex-shrink-0 rounded-full flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span>GOAL: {stream.currentGoalProgress || 0}/{stream.goalAmount}</span>
                    <Edit className="h-3.5 w-3.5 text-white/80" />
                  </button>
                ) : (
                  <button
                    onClick={handleOpenGoalDialog}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-2xl text-sm font-bold px-3 py-1.5 flex-shrink-0 rounded-full flex items-center gap-1.5 transition-all active:scale-95"
                    title="Add Goal"
                  >
                    <Target className="h-4 w-4" />
                    <span>Add Goal</span>
                  </button>
                )}
                
                {/* Stats */}
                <div className="hidden sm:flex items-center gap-3 text-white/90 text-sm font-medium overflow-x-auto">
                  {/* Viewers - Clickable */}
                  <button 
                    onClick={() => setShowViewersList(true)}
                    className="flex items-center gap-2 bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0 transition-colors cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{viewerCount}</span>
                  </button>
                  
                  {/* Duration */}
                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0">
                    <Clock className="h-4 w-4" />
                    <span>{streamDuration}</span>
                  </div>
                  
                  {/* Coins Earned */}
                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 flex-shrink-0">
                    <Coins className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400">{coinsEarned}</span>
                  </div>
                </div>
              </div>

              {/* Right: Control Buttons - Always Visible */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Moderation Panel Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModerationPanel(true)}
                  className="h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                  title="Moderation & Privacy"
                >
                  <Shield className="h-5 w-5 text-white" />
                </Button>

                {/* Flip Camera Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFlipCamera}
                  className="h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                  title="Flip Camera"
                >
                  <SwitchCamera className="h-5 w-5 text-white" />
                </Button>

                {/* Microphone Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMute}
                  className={`h-11 w-11 rounded-full backdrop-blur-sm shadow-md ${
                    isMuted 
                      ? 'bg-red-500/90 hover:bg-red-600/90' 
                      : 'bg-white/15 hover:bg-white/25'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5 text-white" />
                  ) : (
                    <Mic className="h-5 w-5 text-white" />
                  )}
                </Button>

                {/* Go to Homepage Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    window.open('/', '_blank');
                  }}
                  className="h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                  title="Ver Feed (abre en nueva pestaña)"
                >
                  <Home className="h-5 w-5 text-white" />
                </Button>

                {/* Copy Link Button - Desktop */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyStreamLink}
                  className="h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-md"
                  title="Copiar Link"
                >
                  <Share2 className="h-5 w-5 text-white" />
                </Button>

                {/* End Live Button - Always Visible */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndStream}
                  disabled={isEnding}
                  className="bg-red-600/90 hover:bg-red-700 shadow-md h-10 px-4 text-sm font-medium rounded-full flex-shrink-0"
                >
                  {isEnding ? (
                    'Ending...'
                  ) : (
                    <>
                      <StopCircle className="h-4 w-4 mr-1.5" />
                      End
                    </>
                  )}
                </Button>
              </div>
            </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 bg-red-500/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-start gap-3 shadow-2xl pointer-events-auto">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section - Floating Chat with Safe Area */}
          <div className="flex-1 flex items-end p-2 md:p-3 gap-2 pointer-events-none" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
            {/* Right Bottom - Floating Chat */}
            <div className="flex-1 max-w-md ml-auto pointer-events-auto">
              <div className="flex flex-col max-h-[40vh] md:max-h-[45vh]">
                {/* Messages - Scrollable */}
                <div className="flex-1 overflow-y-auto mb-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <div className="space-y-2 px-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-white/60">
                        <p className="text-sm drop-shadow-lg">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-2 group ${msg.type ? 'justify-center' : ''}`}
                        >
                          {msg.type ? (
                            // System message
                            <div className="text-xs text-white/60 italic text-center drop-shadow-lg">
                              {msg.message}
                            </div>
                          ) : (
                            // User message - Floating style
                            <>
                              <Avatar 
                                className="h-9 w-9 flex-shrink-0 border-2 border-white/40 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleViewProfile(msg.userId)}
                              >
                                <AvatarImage src={msg.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/90 text-sm">
                                  {msg.displayName?.[0] || msg.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className={`text-base font-bold ${msg.isHost ? 'text-primary' : 'text-white'} drop-shadow-lg leading-tight cursor-pointer hover:underline`}
                                    onClick={() => handleViewProfile(msg.userId)}
                                  >
                                    {msg.displayName || msg.username}
                                  </span>
                                  {msg.isHost && (
                                    <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-primary/90 shadow-lg">
                                      HOST
                                    </Badge>
                                  )}
                                  {!msg.isHost && msg.isModerator && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-purple-500/90 shadow-lg">
                                      MOD
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-base text-white drop-shadow-lg break-words leading-snug">{msg.message}</p>
                              </div>
                              
                              {/* Moderation Menu - Only show for non-host messages */}
                              {!msg.isHost && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20 shadow-lg rounded-full">
                                      <span className="sr-only">Open menu</span>
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                      </svg>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-black/95 backdrop-blur-md border-white/30 shadow-xl">
                                    <DropdownMenuItem onClick={() => handleViewProfile(msg.userId)} className="text-white hover:bg-white/10 text-sm">
                                      <UserCircle className="mr-2 h-4 w-4" />
                                      View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteMessage(msg.id.toString(), msg.userId, msg.message)}
                                      className="text-red-400 hover:bg-red-500/20 text-sm"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Message
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem 
                                      onClick={() => handleKickUser(msg.userId, msg.displayName || msg.username)}
                                      className="text-orange-400 hover:bg-orange-500/20 text-sm"
                                    >
                                      <UserX className="mr-2 h-4 w-4" />
                                      Kick User (Temporary)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleBanUser(msg.userId, msg.displayName || msg.username)}
                                      className="text-red-600 hover:bg-red-500/20 text-sm font-semibold"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Ban User (Permanent)
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input with Floating Emojis */}
                <div className="flex items-center gap-2">
                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 flex-1">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Message..."
                      maxLength={500}
                      disabled={!isConnected}
                      className="bg-black/60 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50 shadow-lg h-10 text-sm"
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
                  
                  {/* Emoji Reactions - Click = message, Long press = floating */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        console.log('❤️ emoji clicked (Broadcaster)');
                        if (e.currentTarget.dataset.wasLongPress === 'true') {
                          console.log('⚠️ Was long press, ignoring click');
                          e.currentTarget.dataset.wasLongPress = 'false';
                          return;
                        }
                        console.log('📤 Sending ❤️ as chat message, socket:', socket ? 'connected' : 'not connected');
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
                      onMouseDown={(e) => {
                        const target = e.currentTarget;
                        const longPressTimer = setTimeout(() => {
                          target.dataset.wasLongPress = 'true';
                          if (socket) {
                            socket.emit('reaction', { streamId: stream.id, emoji: '❤️' });
                          }
                        }, 500);
                        target.dataset.longPressTimer = String(longPressTimer);
                      }}
                      onMouseUp={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      onMouseLeave={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      onTouchStart={(e) => {
                        const target = e.currentTarget;
                        const longPressTimer = setTimeout(() => {
                          target.dataset.wasLongPress = 'true';
                          if (socket) {
                            socket.emit('reaction', { streamId: stream.id, emoji: '❤️' });
                          }
                        }, 500);
                        target.dataset.longPressTimer = String(longPressTimer);
                      }}
                      onTouchEnd={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      className="h-8 w-8 hover:scale-110 transition-transform hover:bg-white/10 rounded-full"
                    >
                      <span className="text-xl">❤️</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        console.log('👍 emoji clicked (Broadcaster)');
                        if (e.currentTarget.dataset.wasLongPress === 'true') {
                          console.log('⚠️ Was long press, ignoring click');
                          e.currentTarget.dataset.wasLongPress = 'false';
                          return;
                        }
                        console.log('📤 Sending 👍 as chat message, socket:', socket ? 'connected' : 'not connected');
                        if (socket) {
                          socket.emit('send_message', { 
                            streamId: stream.id, 
                            message: '👍'
                          });
                          console.log('✅ 👍 message sent via send_message event');
                        } else {
                          console.log('❌ Socket not connected');
                        }
                      }}
                      onMouseDown={(e) => {
                        const target = e.currentTarget;
                        const longPressTimer = setTimeout(() => {
                          target.dataset.wasLongPress = 'true';
                          if (socket) {
                            socket.emit('reaction', { streamId: stream.id, emoji: '👍' });
                          }
                        }, 500);
                        target.dataset.longPressTimer = String(longPressTimer);
                      }}
                      onMouseUp={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      onMouseLeave={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      onTouchStart={(e) => {
                        const target = e.currentTarget;
                        const longPressTimer = setTimeout(() => {
                          target.dataset.wasLongPress = 'true';
                          if (socket) {
                            socket.emit('reaction', { streamId: stream.id, emoji: '👍' });
                          }
                        }, 500);
                        target.dataset.longPressTimer = String(longPressTimer);
                      }}
                      onTouchEnd={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      className="h-8 w-8 hover:scale-110 transition-transform hover:bg-white/10 rounded-full"
                    >
                      <span className="text-xl">👍</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        console.log('😂 emoji clicked (Broadcaster)');
                        if (e.currentTarget.dataset.wasLongPress === 'true') {
                          console.log('⚠️ Was long press, ignoring click');
                          e.currentTarget.dataset.wasLongPress = 'false';
                          return;
                        }
                        console.log('📤 Sending 😂 as chat message, socket:', socket ? 'connected' : 'not connected');
                        if (socket) {
                          socket.emit('send_message', { 
                            streamId: stream.id, 
                            message: '😂'
                          });
                          console.log('✅ 😂 message sent via send_message event');
                        } else {
                          console.log('❌ Socket not connected');
                        }
                      }}
                      onMouseDown={(e) => {
                        const target = e.currentTarget;
                        const longPressTimer = setTimeout(() => {
                          target.dataset.wasLongPress = 'true';
                          if (socket) {
                            socket.emit('reaction', { streamId: stream.id, emoji: '😂' });
                          }
                        }, 500);
                        target.dataset.longPressTimer = String(longPressTimer);
                      }}
                      onMouseUp={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      onMouseLeave={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      onTouchStart={(e) => {
                        const target = e.currentTarget;
                        const longPressTimer = setTimeout(() => {
                          target.dataset.wasLongPress = 'true';
                          if (socket) {
                            socket.emit('reaction', { streamId: stream.id, emoji: '😂' });
                          }
                        }, 500);
                        target.dataset.longPressTimer = String(longPressTimer);
                      }}
                      onTouchEnd={(e) => {
                        const timer = e.currentTarget.dataset.longPressTimer;
                        if (timer) clearTimeout(Number(timer));
                      }}
                      className="h-8 w-8 hover:scale-110 transition-transform hover:bg-white/10 rounded-full"
                    >
                      <span className="text-xl">😂</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* End Stream Confirmation Dialog */}
      {/* First confirmation modal */}
      <AlertDialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End livestream?</AlertDialogTitle>
            <AlertDialogDescription>
              Your stream will end and viewers will be disconnected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndStream} className="bg-red-600 hover:bg-red-700">
              Yes, End Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post-Live Summary Screen */}
      {showSummary && streamSummary && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
              {/* Header with Navigation Buttons */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {/* Home Button - Left */}
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    title="Home"
                  >
                    <Home className="h-5 w-5" />
                  </Button>

                  {/* Radio Icon - Center */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Radio className="h-8 w-8 text-primary" />
                  </div>

                  {/* Go Live Button - Right */}
                  <Button
                    onClick={() => navigate('/go-live')}
                    variant="default"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    title="Go Live"
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                </div>
                <h1 className="text-2xl font-bold">Stream Ended</h1>
                <p className="text-muted-foreground">Here's how it went</p>
              </div>

              {/* Section 1: Performance */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-lg mb-4">Performance</h2>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <span className="font-semibold">{streamSummary.duration}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Peak viewers</span>
                    </div>
                    <span className="font-semibold">{streamSummary.peakViewers}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Total viewers</span>
                    </div>
                    <span className="font-semibold">{streamSummary.totalViewers}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Engagement */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-lg mb-4">Engagement</h2>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Comments</span>
                    </div>
                    <span className="font-semibold">{streamSummary.commentsCount}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">New followers</span>
                    </div>
                    <span className="font-semibold">{streamSummary.newFollowers}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-center text-muted-foreground italic">
                      Thanks for showing up.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Earnings */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-lg mb-4">Earnings</h2>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">Coins earned</span>
                    </div>
                    <span className="font-semibold text-xl">{streamSummary.coinsEarned}</span>
                  </div>

                  <Button 
                    onClick={() => navigate('/earnings')} 
                    variant="outline" 
                    className="w-full"
                  >
                    View Earnings
                  </Button>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/go-live')} 
                  className="w-full"
                  size="lg"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Go Live Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Panel Dialog - Transparent Overlay */}
      <Dialog open={showModerationPanel} onOpenChange={setShowModerationPanel}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="w-full max-w-md bg-black/80 backdrop-blur-xl border-white/20 text-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Moderation & Privacy
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Manage moderators, privacy settings, and stream access
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <ModerationPanel
                streamId={parseInt(streamId!)}
                isPrivate={stream?.isPrivate || false}
                requiredGiftId={stream?.requiredGiftId || null}
                viewers={viewers}
                onPrivacyChange={(isPrivate, giftId) => {
                  console.log('🔒 onPrivacyChange called:', { isPrivate, giftId, currentStream: stream });
                  
                  if (stream) {
                    const updatedStream = { ...stream, isPrivate, requiredGiftId: giftId };
                    console.log('🔒 Updating stream state:', updatedStream);
                    setStream(updatedStream);
                  }
                  
                  // Emit socket event to notify viewers
                  if (socket) {
                    console.log('🔒 Emitting privacy_changed event');
                    socket.emit('privacy_changed', { 
                      streamId: parseInt(streamId!), 
                      isPrivate, 
                      requiredGiftId: giftId 
                    });
                  }
                }}
              />
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Viewers List Sheet */}
      <Sheet open={showViewersList} onOpenChange={setShowViewersList}>
        <SheetContent side="right" className="w-[90vw] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              Live Viewers ({viewerCount})
            </SheetTitle>
            <SheetDescription className="text-base">
              Click on a viewer to see their profile
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-2">
              {viewers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-base">No viewers yet</p>
                  <p className="text-sm">Share your stream to get viewers!</p>
                </div>
              ) : (
                viewers.map((viewer) => (
                  <button
                    key={viewer.userId}
                    onClick={() => handleViewProfile(viewer.userId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                      <AvatarImage src={viewer.avatarUrl || undefined} />
                      <AvatarFallback className="text-base">
                        {viewer.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-base truncate">
                        {viewer.displayName || viewer.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{viewer.username}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Goal Management Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              {stream?.goalAmount ? 'Manage Goal' : 'Create Goal'}
            </DialogTitle>
            <DialogDescription>
              {stream?.goalAmount 
                ? 'Update or remove your stream goal. Progress will be preserved.'
                : 'Set a coin goal for your viewers to help you reach during this stream.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Goal Amount (Coins)</Label>
              <Input
                id="goalAmount"
                type="number"
                min="0"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="e.g., 500"
                disabled={isUpdatingGoal}
              />
              <p className="text-xs text-muted-foreground">
                Current progress: {stream?.currentGoalProgress || 0} coins
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateGoal}
                disabled={isUpdatingGoal || !goalAmount}
                className="flex-1"
              >
                {isUpdatingGoal ? 'Updating...' : stream?.goalAmount ? 'Update Goal' : 'Create Goal'}
              </Button>

              {stream?.goalAmount && (
                <Button
                  onClick={handleRemoveGoal}
                  disabled={isUpdatingGoal}
                  variant="destructive"
                  className="flex-1"
                >
                  {isUpdatingGoal ? 'Removing...' : 'Remove Goal'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
