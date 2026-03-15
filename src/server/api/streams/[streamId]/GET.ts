/**
 * GET /api/streams/:streamId
 * Get stream details and viewer token
 */

import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { streams, users, follows } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { generateAgoraSubscriberToken, getAgoraAppId } from '../../../services/agora.js';
import { verifyIdToken } from '@/server/services/firebase';

export default async function handler(req: Request, res: Response) {
  try {
    console.log('🔄 GET /api/streams/:streamId called');
    
    const streamIdParam = req.params.streamId;
    const streamId = parseInt(streamIdParam);

    // Determine if it's a numeric ID or a slug
    const isNumericId = !isNaN(streamId);
    
    console.log('🔍 Stream identifier:', { param: streamIdParam, isNumericId });

    // Optional inline authentication
    let currentUser = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(idToken);
        
        if (decodedToken) {
          console.log('✅ Token verified for Firebase UID:', decodedToken.uid);
          
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.firebaseUid, decodedToken.uid))
            .limit(1);

          if (userResult.length > 0) {
            currentUser = userResult[0];
            console.log('✅ User loaded:', currentUser.username);
          }
        }
      } catch (error) {
        console.log('ℹ️ Optional auth failed, continuing without user');
      }
    } else {
      console.log('ℹ️ No auth header, continuing without user');
    }

    // Get stream with user details - support both ID and slug
    const streamQuery = db
      .select({
        id: streams.id,
        slug: streams.slug,
        title: streams.title,
        description: streams.description,
        thumbnailUrl: streams.thumbnailUrl,
        status: streams.status,
        agoraChannelId: streams.agoraChannelId,
        viewerCount: streams.viewerCount,
        peakViewerCount: streams.peakViewerCount,
        totalGiftsReceived: streams.totalGiftsReceived,
        startedAt: streams.startedAt,
        endedAt: streams.endedAt,
        isPrivate: streams.isPrivate,
        requiredGiftId: streams.requiredGiftId,
        goalAmount: streams.goalAmount,
        currentGoalProgress: streams.currentGoalProgress,
        entryPrice: streams.entryPrice,
        isSystemStream: streams.isSystemStream,
        youtubePlaylistId: streams.youtubePlaylistId,
        currentPlaylistIndex: streams.currentPlaylistIndex,
        userId: streams.userId,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          followerCount: users.followerCount,
        },
      })
      .from(streams)
      .innerJoin(users, eq(streams.userId, users.id));

    // Apply where clause based on ID or slug
    const streamResult = isNumericId
      ? await streamQuery.where(eq(streams.id, streamId)).limit(1)
      : await streamQuery.where(eq(streams.slug, streamIdParam)).limit(1);

    if (streamResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Stream not found',
      });
    }

    const stream = streamResult[0];

    // Check if current user follows the streamer
    let isFollowing = false;
    if (currentUser && stream.user.id !== currentUser.id) {
      const followResult = await db
        .select()
        .from(follows)
        .where(and(
          eq(follows.followerId, currentUser.id),
          eq(follows.followingId, stream.user.id)
        ))
        .limit(1);
      
      isFollowing = followResult.length > 0;
      console.log('🔍 Follow status checked:', { 
        currentUserId: currentUser.id, 
        streamerId: stream.user.id, 
        isFollowing 
      });
    }

    // Add isFollowing to user object
    const streamWithFollowStatus = {
      ...stream,
      user: {
        ...stream.user,
        isFollowing,
      },
    };

    // Generate viewer token if stream is live
    // BUT: Only provide credentials if user has proper access
    let credentials = null;
    if (stream.status === 'live' && stream.agoraChannelId) {
      console.log('🎥 Stream is live, checking access for credentials...');
      console.log('   - Stream ID:', stream.id);
      console.log('   - Is Private:', stream.isPrivate);
      console.log('   - Entry Price:', stream.entryPrice);
      console.log('   - Current User:', currentUser ? currentUser.username : 'GUEST');
      
      // Determine if user should get credentials
      let shouldProvideCredentials = false;
      
      // 1. Public streams (not private, no entry price) - anyone can watch
      if (!stream.isPrivate && !stream.entryPrice) {
        shouldProvideCredentials = true;
        console.log('✅ Public stream - providing credentials to all viewers');
      }
      // 2. Broadcaster always gets credentials
      else if (currentUser && currentUser.id === stream.userId) {
        shouldProvideCredentials = true;
        console.log('✅ Broadcaster - providing credentials');
      }
      // 3. Private/Entry price streams - MUST be authenticated
      else if (currentUser) {
        // For private or entry price streams, we'll provide credentials
        // Frontend will handle showing overlays if user hasn't paid
        // This allows the video player to initialize but not show content
        shouldProvideCredentials = true;
        console.log('✅ Authenticated user on private/entry stream - providing credentials (frontend will check access)');
      }
      // 4. Guest users on private/entry streams - NO credentials
      else {
        shouldProvideCredentials = false;
        console.log('❌ Guest user on private/entry stream - NOT providing credentials');
      }
      
      if (shouldProvideCredentials) {
        const viewerUid = currentUser?.id || Math.floor(Math.random() * 1000000);
        console.log('🔑 Generating Agora credentials for viewer UID:', viewerUid);
        
        const agoraAppId = getAgoraAppId();
        const agoraToken = generateAgoraSubscriberToken(stream.agoraChannelId, viewerUid);

        console.log('   - Agora App ID:', agoraAppId ? 'PRESENT' : 'MISSING');
        console.log('   - Agora Token:', agoraToken ? 'GENERATED' : 'FAILED');

        if (agoraAppId && agoraToken) {
          credentials = {
            appId: agoraAppId,
            channelName: stream.agoraChannelId, // BroadcasterView expects channelName
            token: agoraToken,
            uid: viewerUid,
          };
          console.log('✅ Credentials created successfully');
        } else {
          console.error('❌ Failed to create credentials - missing appId or token');
        }
      }
    } else {
      console.log('ℹ️ Stream not live or no Agora channel:', {
        status: stream.status,
        hasChannel: !!stream.agoraChannelId,
      });
    }

    console.log('📤 Sending response with isFollowing:', isFollowing);

    return res.json({
      success: true,
      stream: streamWithFollowStatus,
      credentials,
    });
  } catch (error) {
    console.error('Get stream error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get stream',
    });
  }
}
