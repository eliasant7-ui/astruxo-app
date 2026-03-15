/**
 * Socket.IO Service for Real-time Chat
 * Handles WebSocket connections for live stream chat
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { verifyIdToken } from './firebase.js';
import { db } from '../db/client.js';
import { users, chatMessages, streams, activeConnections, streamModerators } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

let io: SocketIOServer | null = null;

interface ChatMessage {
  id: number;
  streamId: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  message: string;
  createdAt: Date;
  isModerator?: boolean;
  isHost?: boolean;
}

interface GeoLocation {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get geolocation from IP address using ip-api.com (free, no key required)
 */
async function getGeoLocation(ipAddress: string): Promise<GeoLocation> {
  try {
    // Skip private/local IPs
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return { country: 'Local', city: 'Localhost' };
    }

    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city,regionName,lat,lon`);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city,
        region: data.regionName,
        latitude: data.lat,
        longitude: data.lon,
      };
    }
  } catch (error) {
    console.error('Geolocation error:', error);
  }
  
  return {};
}

/**
 * Register active connection in database
 */
async function registerConnection(socketId: string, ipAddress: string, userAgent: string, userId?: number) {
  try {
    const geo = await getGeoLocation(ipAddress);
    
    await db.insert(activeConnections).values({
      socketId,
      userId: userId || null,
      ipAddress,
      country: geo.country || null,
      city: geo.city || null,
      region: geo.region || null,
      latitude: geo.latitude ? String(geo.latitude) : null,
      longitude: geo.longitude ? String(geo.longitude) : null,
      userAgent,
    });

    console.log(`📍 Connection registered: ${socketId} from ${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}`);
  } catch (error) {
    console.error('Error registering connection:', error);
  }
}

/**
 * Remove connection from database
 */
async function removeConnection(socketId: string) {
  try {
    await db.delete(activeConnections).where(eq(activeConnections.socketId, socketId));
    console.log(`🔌 Connection removed: ${socketId}`);
  } catch (error) {
    console.error('Error removing connection:', error);
  }
}

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer) {
  console.log('🔌 Initializing Socket.IO server...');
  
  if (!httpServer) {
    console.error('❌ HTTP server is null or undefined!');
    return null;
  }

  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Allow all origins for now (can be restricted later)
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Support both transports
      allowEIO3: true, // Support older clients
    });

    console.log('✅ Socket.IO server created successfully');

    io.on('connection', async (socket) => {
      console.log(`✅ Socket connected: ${socket.id}`);

      // Get client IP and user agent
      const ipAddress = socket.handshake.address || socket.handshake.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = socket.handshake.headers['user-agent'] || 'unknown';

      // Register connection (without userId initially)
      await registerConnection(socket.id, ipAddress, userAgent);

    // Handle authentication
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        const decodedToken = await verifyIdToken(data.token);
        if (!decodedToken) {
          socket.emit('auth_error', { message: 'Invalid token' });
          return;
        }

        // Load user from database
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.firebaseUid, decodedToken.uid))
          .limit(1);

        if (userResult.length === 0) {
          socket.emit('auth_error', { message: 'User not found' });
          return;
        }

        const user = userResult[0];
        (socket as any).userId = user.id;
        (socket as any).username = user.username;
        (socket as any).displayName = user.displayName;
        (socket as any).avatarUrl = user.avatarUrl;
        (socket as any).avatarUrl = user.avatarUrl;

        // Update connection with userId
        await db.update(activeConnections)
          .set({ userId: user.id })
          .where(eq(activeConnections.socketId, socket.id));

        socket.emit('authenticated', { userId: user.id, username: user.username });
        console.log(`🔐 User authenticated: ${user.username} (${socket.id})`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Join stream room
    socket.on('join_stream', async (data: { streamId: number }) => {
      try {
        const { streamId } = data;

        // Verify stream exists and is live
        const streamResult = await db.select().from(streams).where(eq(streams.id, streamId)).limit(1);

        if (streamResult.length === 0) {
          socket.emit('error', { message: 'Stream not found' });
          return;
        }

        const stream = streamResult[0];

        if (stream.status !== 'live') {
          socket.emit('error', { message: 'Stream is not live' });
          return;
        }

        // Join room
        const roomName = `stream_${streamId}`;
        socket.join(roomName);
        (socket as any).currentStreamId = streamId;

        socket.emit('joined_stream', { streamId, roomName });
        console.log(`📺 User joined stream ${streamId} (${socket.id})`);

        // Load and send chat history (last 50 messages)
        const history = await db
          .select({
            id: chatMessages.id,
            streamId: chatMessages.streamId,
            userId: chatMessages.userId,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            message: chatMessages.message,
            createdAt: chatMessages.createdAt,
          })
          .from(chatMessages)
          .innerJoin(users, eq(chatMessages.userId, users.id))
          .where(eq(chatMessages.streamId, streamId))
          .orderBy(chatMessages.createdAt)
          .limit(50);

        // Get all moderators for this stream
        const moderators = await db
          .select()
          .from(streamModerators)
          .where(eq(streamModerators.streamId, streamId));

        const moderatorIds = new Set(moderators.map(m => m.userId));

        // Add isModerator and isHost flags to history
        const enrichedHistory = history.map(msg => ({
          ...msg,
          isModerator: moderatorIds.has(msg.userId),
          isHost: stream.userId === msg.userId,
        }));

        socket.emit('chat_history', enrichedHistory);
        console.log(`📜 Sent ${enrichedHistory.length} chat messages to ${socket.id}`);

        // Update viewer count
        const roomSize = io?.sockets.adapter.rooms.get(roomName)?.size || 0;
        await db
          .update(streams)
          .set({
            viewerCount: roomSize,
            peakViewerCount: Math.max(stream.peakViewerCount, roomSize),
          })
          .where(eq(streams.id, streamId));

        // Broadcast viewer count update
        io?.to(roomName).emit('viewer_count', { count: roomSize });
        
        // Get all viewers in the room with their info
        const viewersList: any[] = [];
        const room = io?.sockets.adapter.rooms.get(roomName);
        if (room) {
          for (const socketId of room) {
            const viewerSocket = io?.sockets.sockets.get(socketId);
            if (viewerSocket && (viewerSocket as any).userId) {
              viewersList.push({
                userId: (viewerSocket as any).userId,
                username: (viewerSocket as any).username,
                displayName: (viewerSocket as any).displayName || (viewerSocket as any).username,
                avatarUrl: (viewerSocket as any).avatarUrl || null,
              });
            }
          }
        }
        
        // Broadcast viewers list to the room
        io?.to(roomName).emit('viewers_update', { viewers: viewersList });
        
        // Broadcast user joined notification (only if authenticated)
        if ((socket as any).userId) {
          io?.to(roomName).emit('user_joined', {
            username: (socket as any).username,
            displayName: (socket as any).displayName || (socket as any).username,
          });
        }
      } catch (error) {
        console.error('Join stream error:', error);
        socket.emit('error', { message: 'Failed to join stream' });
      }
    });

    // Leave stream room
    socket.on('leave_stream', async (data: { streamId: number }) => {
      try {
        const { streamId } = data;
        const roomName = `stream_${streamId}`;

        socket.leave(roomName);
        
        // Broadcast user left notification (only if authenticated)
        if ((socket as any).userId) {
          io?.to(roomName).emit('user_left', {
            username: (socket as any).username,
            displayName: (socket as any).displayName || (socket as any).username,
          });
        }
        
        (socket as any).currentStreamId = null;

        // Update viewer count
        const roomSize = io?.sockets.adapter.rooms.get(roomName)?.size || 0;
        await db.update(streams).set({ viewerCount: roomSize }).where(eq(streams.id, streamId));

        // Broadcast viewer count update
        io?.to(roomName).emit('viewer_count', { count: roomSize });
        
        // Get updated viewers list
        const viewersList: any[] = [];
        const room = io?.sockets.adapter.rooms.get(roomName);
        if (room) {
          for (const socketId of room) {
            const viewerSocket = io?.sockets.sockets.get(socketId);
            if (viewerSocket && (viewerSocket as any).userId) {
              viewersList.push({
                userId: (viewerSocket as any).userId,
                username: (viewerSocket as any).username,
                displayName: (viewerSocket as any).displayName || (viewerSocket as any).username,
                avatarUrl: (viewerSocket as any).avatarUrl || null,
              });
            }
          }
        }
        
        // Broadcast updated viewers list
        io?.to(roomName).emit('viewers_update', { viewers: viewersList });

        console.log(`👋 User left stream ${streamId} (${socket.id})`);
      } catch (error) {
        console.error('Leave stream error:', error);
      }
    });

    // Send chat message
    socket.on('send_message', async (data: { streamId: number; message: string }) => {
      try {
        const userId = (socket as any).userId;
        const username = (socket as any).username;
        const displayName = (socket as any).displayName;
        const avatarUrl = (socket as any).avatarUrl;

        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { streamId, message } = data;

        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        if (message.length > 500) {
          socket.emit('error', { message: 'Message too long (max 500 characters)' });
          return;
        }

        // Save message to database
        const result = await db.insert(chatMessages).values({
          streamId,
          userId,
          message: message.trim(),
        });

        const messageId = Number(result[0].insertId);

        // Check if user is a moderator or the broadcaster
        const [stream] = await db
          .select()
          .from(streams)
          .where(eq(streams.id, streamId))
          .limit(1);

        const isHost = stream && stream.userId === userId;

        const [moderator] = await db
          .select()
          .from(streamModerators)
          .where(
            and(
              eq(streamModerators.streamId, streamId),
              eq(streamModerators.userId, userId)
            )
          )
          .limit(1);

        const isModerator = !!moderator;

        // Broadcast message to room
        const roomName = `stream_${streamId}`;
        const chatMessage: ChatMessage = {
          id: messageId,
          streamId,
          userId,
          username,
          displayName: displayName || username,
          avatarUrl,
          message: message.trim(),
          createdAt: new Date(),
          isModerator,
          isHost,
        };

        io?.to(roomName).emit('new_message', chatMessage);
        console.log(`💬 Message sent in stream ${streamId} by ${username}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Send gift notification (requires authentication)
    socket.on('send_gift', async (data: {
      streamId: number;
      giftName: string;
      giftIcon: string;
      coinAmount: number;
      message?: string;
    }) => {
      try {
        // Verify authentication
        const userId = (socket as any).userId;
        const username = (socket as any).username;
        const displayName = (socket as any).displayName;
        const avatarUrl = (socket as any).avatarUrl;

        if (!userId || !username) {
          console.error('❌ Unauthenticated gift attempt from socket:', socket.id);
          socket.emit('error', { message: 'Authentication required to send gifts' });
          return;
        }

        // Validate gift data
        if (!data.streamId || !data.giftName || typeof data.coinAmount !== 'number' || data.coinAmount <= 0) {
          console.error('❌ Invalid gift data from user:', username);
          socket.emit('error', { message: 'Invalid gift data' });
          return;
        }

        // Sanitize inputs
        const sanitizedGiftName = String(data.giftName).slice(0, 100);
        const sanitizedGiftIcon = data.giftIcon ? String(data.giftIcon).slice(0, 500) : '';
        const sanitizedMessage = data.message ? String(data.message).slice(0, 500) : '';
        const clampedCoinAmount = Math.max(1, Math.min(1000000, Math.floor(data.coinAmount)));

        const roomName = `stream_${data.streamId}`;

        // Broadcast gift notification to all viewers
        io?.to(roomName).emit('gift_sent', {
          senderUserId: userId,
          senderUsername: username,
          senderDisplayName: displayName || username,
          senderAvatar: avatarUrl,
          giftName: sanitizedGiftName,
          giftIcon: sanitizedGiftIcon,
          coinAmount: clampedCoinAmount,
          message: sanitizedMessage,
          timestamp: new Date(),
        });

        console.log(`🎁 Gift sent in stream ${data.streamId}: ${sanitizedGiftName} (${clampedCoinAmount} coins) by ${username}`);
      } catch (error) {
        console.error('Send gift notification error:', error);
        socket.emit('error', { message: 'Failed to send gift notification' });
      }
    });

    // Handle reactions
    socket.on('reaction', async (data: { streamId: string; emoji: string }) => {
      try {
        const userId = (socket as any).userId;
        if (!userId) return;

        const roomName = `stream_${data.streamId}`;
        
        // Broadcast reaction to all viewers in the room
        io?.to(roomName).emit('reaction', {
          emoji: data.emoji,
          userId,
        });

        console.log(`❤️ Reaction sent in stream ${data.streamId}: ${data.emoji}`);
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    // Handle message deletion (broadcaster only)
    socket.on('delete_message', async (data: { messageId: number; streamId: number }) => {
      try {
        const userId = (socket as any).userId;
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify user is the broadcaster
        const streamResult = await db
          .select()
          .from(streams)
          .where(eq(streams.id, data.streamId))
          .limit(1);

        if (streamResult.length === 0 || streamResult[0].userId !== userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Broadcast message deletion to all viewers
        const roomName = `stream_${data.streamId}`;
        io?.to(roomName).emit('message_deleted', { messageId: data.messageId });

        console.log(`🗑️ Message ${data.messageId} deleted by broadcaster`);
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle user kick (broadcaster only)
    socket.on('kick_user', async (data: { userId: number; streamId: number }) => {
      try {
        const broadcasterId = (socket as any).userId;
        if (!broadcasterId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Verify user is the broadcaster
        const streamResult = await db
          .select()
          .from(streams)
          .where(eq(streams.id, data.streamId))
          .limit(1);

        if (streamResult.length === 0 || streamResult[0].userId !== broadcasterId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Find and disconnect the kicked user's socket
        const roomName = `stream_${data.streamId}`;
        const socketsInRoom = await io?.in(roomName).fetchSockets();
        
        socketsInRoom?.forEach((s) => {
          if ((s as any).userId === data.userId) {
            s.emit('kicked', { message: 'You have been removed from this stream' });
            s.leave(roomName);
            s.disconnect(true);
          }
        });

        console.log(`👢 User ${data.userId} kicked from stream ${data.streamId}`);
      } catch (error) {
        console.error('❌ Error kicking user:', error);
        socket.emit('error', { message: 'Failed to kick user' });
      }
    });

    // Handle privacy change
    socket.on('privacy_changed', async (data: { streamId: number; isPrivate: boolean; requiredGiftId: number | null }) => {
      console.log('🔒 Privacy changed event received:', data);
      
      const roomName = `stream_${data.streamId}`;
      
      // Broadcast to all viewers in the stream (except sender)
      socket.to(roomName).emit('privacy_changed', {
        isPrivate: data.isPrivate,
        requiredGiftId: data.requiredGiftId,
      });
      
      console.log('🔒 Privacy change broadcasted to room:', roomName);
    });

    // Handle goal updates
    socket.on('goal_updated', async (data: { streamId: number; goalAmount: number; currentGoalProgress: number }) => {
      console.log('🎯 Goal updated event received:', data);
      
      const roomName = `stream_${data.streamId}`;
      
      // Broadcast to all viewers in the stream (except sender)
      socket.to(roomName).emit('goal_updated', {
        goalAmount: data.goalAmount,
        currentGoalProgress: data.currentGoalProgress,
      });
      
      console.log('🎯 Goal update broadcasted to room:', roomName);
    });

    // Handle goal removal
    socket.on('goal_removed', async (data: { streamId: number }) => {
      console.log('🎯 Goal removed event received:', data);
      
      const roomName = `stream_${data.streamId}`;
      
      // Broadcast to all viewers in the stream (except sender)
      socket.to(roomName).emit('goal_removed');
      
      console.log('🎯 Goal removal broadcasted to room:', roomName);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);

      // Remove connection from database
      await removeConnection(socket.id);

      const streamId = (socket as any).currentStreamId;
      if (streamId) {
        const roomName = `stream_${streamId}`;
        const roomSize = io?.sockets.adapter.rooms.get(roomName)?.size || 0;

        // Update viewer count
        await db.update(streams).set({ viewerCount: roomSize }).where(eq(streams.id, streamId));

        // Broadcast viewer count update
        io?.to(roomName).emit('viewer_count', { count: roomSize });
      }
    });
  });

    console.log('✅ Socket.IO initialized and listening for connections');
    return io;
  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO:', error);
    return null;
  }
}

/**
 * Get Socket.IO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}
