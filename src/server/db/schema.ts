/**
 * LiveStream Platform - Database Schema
 * Phase 1: Core MVP (Auth, Profiles, Follows, Streams, Chat)
 * Phase 2: Social Features (Posts, Comments, Likes, Media)
 */

import { pgTable, serial, integer, varchar, text, decimal, timestamp, boolean, index, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firebaseUid: varchar('firebase_uid', { length: 128 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: varchar('role', { length: 20 }).default('user').notNull(), // 'user', 'moderator', 'admin'
  isSuspended: boolean('is_suspended').default(false).notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  followerCount: integer('follower_count').default(0).notNull(),
  followingCount: integer('following_count').default(0).notNull(),
  coinBalance: integer('coin_balance').default(0).notNull(), // Virtual coins for gifts
  walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).default('0.00').notNull(), // Real money earnings
  isLive: boolean('is_live').default(false).notNull(),
  liveConfirmedAt: timestamp('live_confirmed_at'), // When user confirmed pre-live guidelines
  referredBy: varchar('referred_by', { length: 50 }), // Username of referrer
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  firebaseUidIdx: index('firebase_uid_idx').on(table.firebaseUid),
  usernameIdx: index('username_idx').on(table.username),
  isLiveIdx: index('is_live_idx').on(table.isLive),
  roleIdx: index('role_idx').on(table.role),
}));

// ============================================
// FOLLOWS TABLE
// ============================================
export const follows = pgTable('follows', {
  id: serial('id').primaryKey(),
  followerId: integer('follower_id').notNull(),
  followingId: integer('following_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  followerIdx: index('follower_idx').on(table.followerId),
  followingIdx: index('following_idx').on(table.followingId),
  uniqueFollow: index('unique_follow').on(table.followerId, table.followingId),
}));

// ============================================
// STREAMS TABLE
// ============================================
export const streams = pgTable('streams', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  slug: varchar('slug', { length: 100 }), // Human-readable URL slug (username or custom)
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  status: varchar('status', { length: 20 }).default('live').notNull(), // 'live', 'ended'
  agoraChannelId: varchar('agora_channel_id', { length: 255 }),
  viewerCount: integer('viewer_count').default(0).notNull(),
  peakViewerCount: integer('peak_viewer_count').default(0).notNull(),
  totalGiftsReceived: decimal('total_gifts_received', { precision: 10, scale: 2 }).default('0.00').notNull(),
  duration: integer('duration'), // Duration in seconds
  isPrivate: boolean('is_private').default(false).notNull(), // Private stream
  requiredGiftId: integer('required_gift_id'), // Gift required to enter private stream
  goalAmount: integer('goal_amount'), // Coin goal for the stream
  currentGoalProgress: integer('current_goal_progress').default(0), // Current progress towards goal
  entryPrice: integer('entry_price'), // Coins required to enter the stream
  isSystemStream: boolean('is_system_stream').default(false).notNull(), // System-managed 24/7 stream
  youtubePlaylistId: varchar('youtube_playlist_id', { length: 255 }), // YouTube playlist for system streams
  currentPlaylistIndex: integer('current_playlist_index').default(0), // Current video index in playlist (for 24/7 channels)
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  slugIdx: index('slug_idx').on(table.slug),
  statusIdx: index('status_idx').on(table.status),
  startedAtIdx: index('started_at_idx').on(table.startedAt),
  isPrivateIdx: index('is_private_idx').on(table.isPrivate),
  isSystemStreamIdx: index('is_system_stream_idx').on(table.isSystemStream),
}));

// ============================================
// CHAT MESSAGES TABLE
// ============================================
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  streamId: integer('stream_id').notNull(),
  userId: integer('user_id').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// STREAM ENTRY PAYMENTS TABLE
// ============================================
export const streamEntryPayments = pgTable('stream_entry_payments', {
  id: serial('id').primaryKey(),
  streamId: integer('stream_id').notNull(),
  userId: integer('user_id').notNull(),
  amountPaid: integer('amount_paid').notNull(), // Coins paid for entry
  paidAt: timestamp('paid_at').defaultNow().notNull(),
}, (table) => ({
  streamUserIdx: index('stream_user_idx').on(table.streamId, table.userId),
  streamIdIdx: index('stream_id_idx').on(table.streamId),
}));

// ============================================
// GIFTS CATALOG TABLE
// ============================================
export const gifts = pgTable('gifts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(), // Lucide icon name
  coinPrice: integer('coin_price').notNull(), // Price in coins
  animationType: varchar('animation_type', { length: 50 }).default('bounce').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('is_active_idx').on(table.isActive),
  sortOrderIdx: index('sort_order_idx').on(table.sortOrder),
}));

// ============================================
// GIFT TRANSACTIONS TABLE
// ============================================
export const giftTransactions = pgTable('gift_transactions', {
  id: serial('id').primaryKey(),
  giftId: integer('gift_id').notNull(),
  senderId: integer('sender_id').notNull(), // User who sent the gift
  receiverId: integer('receiver_id').notNull(), // Streamer who received
  streamId: integer('stream_id').notNull(),
  coinAmount: integer('coin_amount').notNull(),
  message: text('message'), // Optional message with gift
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  senderIdx: index('sender_idx').on(table.senderId),
  receiverIdx: index('receiver_idx').on(table.receiverId),
  streamIdx: index('stream_idx').on(table.streamId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// COIN TRANSACTIONS TABLE
// ============================================
export const coinTransactions = pgTable('coin_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: integer('amount').notNull(), // Positive for purchase, negative for spending
  type: varchar('type', { length: 20 }).notNull(), // 'purchase', 'gift_sent', 'gift_received', 'withdrawal'
  description: text('description'),
  referenceId: integer('reference_id'), // ID of related transaction (gift, purchase, etc)
  stripeSessionId: varchar('stripe_session_id', { length: 255 }), // Stripe checkout session ID
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  typeIdx: index('type_idx').on(table.type),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// POSTS TABLE (Social Feed)
// ============================================
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  streamId: integer('stream_id'), // Reference to livestream if this post is sharing a stream
  content: text('content'), // Text content of the post
  mediaType: varchar('media_type', { length: 20 }), // 'image', 'video', 'livestream', null
  mediaUrl: text('media_url'), // URL to image or video
  thumbnailUrl: text('thumbnail_url'), // Thumbnail for videos
  linkPreview: json('link_preview'), // Cached OG metadata: { url, title, description, image, siteName }
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  mediaTypeIdx: index('media_type_idx').on(table.mediaType),
}));

// ============================================
// COMMENTS TABLE
// ============================================
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id'), // For nested replies
  likeCount: integer('like_count').default(0).notNull(),
  replyCount: integer('reply_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index('post_id_idx').on(table.postId),
  userIdIdx: index('user_id_idx').on(table.userId),
  parentIdIdx: index('parent_id_idx').on(table.parentId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// LIKES TABLE
// ============================================
export const likes = pgTable('likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index('post_id_idx').on(table.postId),
  userIdIdx: index('user_id_idx').on(table.userId),
  uniqueLike: index('unique_like').on(table.postId, table.userId),
}));

// ============================================
// COMMENT LIKES TABLE
// ============================================
export const commentLikes = pgTable('comment_likes', {
  id: serial('id').primaryKey(),
  commentId: integer('comment_id').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  commentIdIdx: index('comment_id_idx').on(table.commentId),
  userIdIdx: index('user_id_idx').on(table.userId),
  uniqueLike: index('unique_comment_like').on(table.commentId, table.userId),
}));

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  streams: many(streams),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  chatMessages: many(chatMessages),
  giftsSent: many(giftTransactions, { relationName: 'sender' }),
  giftsReceived: many(giftTransactions, { relationName: 'receiver' }),
  coinTransactions: many(coinTransactions),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'follower',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'following',
  }),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  user: one(users, {
    fields: [streams.userId],
    references: [users.id],
  }),
  chatMessages: many(chatMessages),
  giftTransactions: many(giftTransactions),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  stream: one(streams, {
    fields: [chatMessages.streamId],
    references: [streams.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const giftsRelations = relations(gifts, ({ many }) => ({
  transactions: many(giftTransactions),
}));

export const giftTransactionsRelations = relations(giftTransactions, ({ one }) => ({
  gift: one(gifts, {
    fields: [giftTransactions.giftId],
    references: [gifts.id],
  }),
  sender: one(users, {
    fields: [giftTransactions.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [giftTransactions.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
  stream: one(streams, {
    fields: [giftTransactions.streamId],
    references: [streams.id],
  }),
}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  user: one(users, {
    fields: [coinTransactions.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

// ============================================
// REPORTS TABLE (RBAC System)
// ============================================
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterUserId: integer('reporter_user_id').notNull(),
  reportedUserId: integer('reported_user_id'),
  reportedPostId: integer('reported_post_id'),
  reportedStreamId: integer('reported_stream_id'),
  reason: varchar('reason', { length: 100 }).notNull(), // 'spam', 'harassment', 'inappropriate', 'other'
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'reviewed', 'dismissed', 'action_taken'
  reviewedBy: integer('reviewed_by'), // Admin/Moderator ID
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index('reporter_idx').on(table.reporterUserId),
  reportedUserIdx: index('reported_user_idx').on(table.reportedUserId),
  reportedPostIdx: index('reported_post_idx').on(table.reportedPostId),
  statusIdx: index('status_idx').on(table.status),
}));

// ============================================
// MODERATION LOGS TABLE (RBAC System)
// ============================================
export const moderationLogs = pgTable('moderation_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'ban_user', 'suspend_user', 'delete_post', 'restore_post', 'delete_stream'
  targetUserId: integer('target_user_id'),
  targetPostId: integer('target_post_id'),
  targetStreamId: integer('target_stream_id'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  adminIdx: index('admin_idx').on(table.adminId),
  actionTypeIdx: index('action_type_idx').on(table.actionType),
  targetUserIdx: index('target_user_idx').on(table.targetUserId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// Relations for reports
export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterUserId],
    references: [users.id],
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
  }),
  reportedPost: one(posts, {
    fields: [reports.reportedPostId],
    references: [posts.id],
  }),
  reviewer: one(users, {
    fields: [reports.reviewedBy],
    references: [users.id],
  }),
}));

// Relations for moderation logs
export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  admin: one(users, {
    fields: [moderationLogs.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [moderationLogs.targetUserId],
    references: [users.id],
  }),
  targetPost: one(posts, {
    fields: [moderationLogs.targetPostId],
    references: [posts.id],
  }),
}));

// ============================================
// ACTIVE CONNECTIONS TABLE (Tracking)
// ============================================
export const activeConnections = pgTable('active_connections', {
  id: serial('id').primaryKey(),
  socketId: varchar('socket_id', { length: 255 }).notNull().unique(),
  userId: integer('user_id'), // Nullable for anonymous users
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  userAgent: text('user_agent'),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
}, (table) => ({
  socketIdIdx: index('socket_id_idx').on(table.socketId),
  userIdIdx: index('user_id_idx').on(table.userId),
  connectedAtIdx: index('connected_at_idx').on(table.connectedAt),
}));

export const activeConnectionsRelations = relations(activeConnections, ({ one }) => ({
  user: one(users, {
    fields: [activeConnections.userId],
    references: [users.id],
  }),
}));

// ============================================
// USER SESSIONS TABLE (for analytics)
// ============================================
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // Nullable for anonymous sessions
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  deviceType: varchar('device_type', { length: 50 }), // 'mobile', 'tablet', 'desktop'
  userAgent: text('user_agent'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds').default(0),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  startedAtIdx: index('started_at_idx').on(table.startedAt),
  deviceTypeIdx: index('device_type_idx').on(table.deviceType),
  countryIdx: index('country_idx').on(table.country),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// ============================================
// PWA INSTALLATIONS TABLE
// ============================================
export const pwaInstallations = pgTable('pwa_installations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // Nullable for anonymous installs
  deviceType: varchar('device_type', { length: 50 }), // 'mobile', 'tablet', 'desktop'
  platform: varchar('platform', { length: 50 }), // 'android', 'ios', 'windows', 'mac', 'linux'
  userAgent: text('user_agent'),
  installedAt: timestamp('installed_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  installedAtIdx: index('installed_at_idx').on(table.installedAt),
  platformIdx: index('platform_idx').on(table.platform),
}));

export const pwaInstallationsRelations = relations(pwaInstallations, ({ one }) => ({
  user: one(users, {
    fields: [pwaInstallations.userId],
    references: [users.id],
  }),
}));

// Stream Moderators - Temporary moderators assigned by broadcaster
export const streamModerators = pgTable('stream_moderators', {
  id: serial('id').primaryKey(),
  streamId: integer('stream_id').notNull(),
  userId: integer('user_id').notNull(), // Moderator user ID
  assignedBy: integer('assigned_by').notNull(), // Broadcaster user ID
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  userIdIdx: index('user_id_idx').on(table.userId),
  uniqueStreamUser: index('unique_stream_user').on(table.streamId, table.userId),
}));

// Stream Bans - Users banned from specific streams
export const streamBans = pgTable('stream_bans', {
  id: serial('id').primaryKey(),
  streamId: integer('stream_id').notNull(),
  userId: integer('user_id').notNull(), // Banned user ID
  bannedBy: integer('banned_by').notNull(), // Moderator/Broadcaster user ID
  reason: varchar('reason', { length: 255 }),
  banType: varchar('ban_type', { length: 20 }).default('kick').notNull(), // 'kick' (temporary), 'ban' (permanent)
  bannedAt: timestamp('banned_at').defaultNow().notNull(),
}, (table) => ({
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  userIdIdx: index('user_id_idx').on(table.userId),
  uniqueStreamUser: index('unique_stream_user').on(table.streamId, table.userId),
}));

// Private Stream Access - Users who paid to enter private stream
export const privateStreamAccess = pgTable('private_stream_access', {
  id: serial('id').primaryKey(),
  streamId: integer('stream_id').notNull(),
  userId: integer('user_id').notNull(),
  giftId: integer('gift_id'), // Gift sent to gain access (nullable for entry price streams)
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
}, (table) => ({
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  userIdIdx: index('user_id_idx').on(table.userId),
  uniqueStreamUser: index('unique_stream_user').on(table.streamId, table.userId),
}));

// Deleted Messages - Track deleted messages for moderation
export const deletedMessages = pgTable('deleted_messages', {
  id: serial('id').primaryKey(),
  streamId: integer('stream_id').notNull(),
  messageId: varchar('message_id', { length: 255 }).notNull(), // Socket.IO message ID
  userId: integer('user_id').notNull(), // Original message sender
  content: text('content').notNull(), // Original message content
  deletedBy: integer('deleted_by').notNull(), // Moderator/Broadcaster user ID
  deletedAt: timestamp('deleted_at').defaultNow().notNull(),
}, (table) => ({
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  messageIdIdx: index('message_id_idx').on(table.messageId),
}));

export const streamModeratorsRelations = relations(streamModerators, ({ one }) => ({
  stream: one(streams, {
    fields: [streamModerators.streamId],
    references: [streams.id],
  }),
  user: one(users, {
    fields: [streamModerators.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [streamModerators.assignedBy],
    references: [users.id],
  }),
}));

export const streamBansRelations = relations(streamBans, ({ one }) => ({
  stream: one(streams, {
    fields: [streamBans.streamId],
    references: [streams.id],
  }),
  user: one(users, {
    fields: [streamBans.userId],
    references: [users.id],
  }),
  bannedByUser: one(users, {
    fields: [streamBans.bannedBy],
    references: [users.id],
  }),
}));

export const privateStreamAccessRelations = relations(privateStreamAccess, ({ one }) => ({
  stream: one(streams, {
    fields: [privateStreamAccess.streamId],
    references: [streams.id],
  }),
  user: one(users, {
    fields: [privateStreamAccess.userId],
    references: [users.id],
  }),
}));

export const deletedMessagesRelations = relations(deletedMessages, ({ one }) => ({
  stream: one(streams, {
    fields: [deletedMessages.streamId],
    references: [streams.id],
  }),
  user: one(users, {
    fields: [deletedMessages.userId],
    references: [users.id],
  }),
  deletedByUser: one(users, {
    fields: [deletedMessages.deletedBy],
    references: [users.id],
  }),
}));

// ============================================
// SITE VISITS TABLE - Track page views
// ============================================
export const siteVisits = pgTable('site_visits', {
  id: serial('id').primaryKey(),
  page: varchar('page', { length: 255 }).notNull(), // Page path (e.g., '/', '/streams', '/feed')
  userId: integer('user_id'), // NULL for anonymous visitors
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
  userAgent: text('user_agent'), // Browser/device info
  referrer: text('referrer'), // Where they came from
  sessionId: varchar('session_id', { length: 255 }), // Track unique sessions
  country: varchar('country', { length: 100 }), // Country name from IP geolocation
  countryCode: varchar('country_code', { length: 2 }), // ISO 2-letter country code (e.g., 'US', 'ES')
  visitedAt: timestamp('visited_at').defaultNow().notNull(),
}, (table) => ({
  pageIdx: index('page_idx').on(table.page),
  userIdIdx: index('user_id_idx').on(table.userId),
  sessionIdIdx: index('session_id_idx').on(table.sessionId),
  visitedAtIdx: index('visited_at_idx').on(table.visitedAt),
  countryCodeIdx: index('country_code_idx').on(table.countryCode),
}));

// ============================================
// BOOTSTRAP SYSTEM - Automated Activity
// ============================================

// Bot Accounts - System-managed accounts for automated content
export const botAccounts = pgTable('bot_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(), // Links to users table
  botType: varchar('bot_type', { length: 50 }).notNull(), // 'content_creator', 'engagement', 'announcer'
  isActive: boolean('is_active').default(true).notNull(),
  postFrequencyMinutes: integer('post_frequency_minutes').default(120).notNull(), // How often to post
  lastPostedAt: timestamp('last_posted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  botTypeIdx: index('bot_type_idx').on(table.botType),
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

// Content Templates - Pre-written content for bots to post
export const contentTemplates = pgTable('content_templates', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 50 }).notNull(), // 'question', 'fact', 'conversation_starter', 'announcement'
  content: text('content').notNull(),
  mediaUrl: text('media_url'), // Optional image/video URL
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(), // Track how many times used
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('category_idx').on(table.category),
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

// Comment Templates - Simple engagement comments
export const commentTemplates = pgTable('comment_templates', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(), // "Interesting!", "What do you think?", etc.
  sentiment: varchar('sentiment', { length: 20 }).default('neutral').notNull(), // 'positive', 'neutral', 'question'
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sentimentIdx: index('sentiment_idx').on(table.sentiment),
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

// Bootstrap Activity Config - Global settings
export const bootstrapConfig = pgTable('bootstrap_config', {
  id: serial('id').primaryKey(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  autoPostingEnabled: boolean('auto_posting_enabled').default(true).notNull(),
  autoCommentsEnabled: boolean('auto_comments_enabled').default(true).notNull(),
  streamAnnouncementsEnabled: boolean('stream_announcements_enabled').default(true).notNull(),
  minPostIntervalMinutes: integer('min_post_interval_minutes').default(30).notNull(),
  maxPostIntervalMinutes: integer('max_post_interval_minutes').default(180).notNull(),
  commentProbability: decimal('comment_probability', { precision: 3, scale: 2 }).default('0.15').notNull(), // 15% chance
  maxCommentsPerPost: integer('max_comments_per_post').default(2).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Automated Activity Log - Track all automated actions
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // 'post', 'comment', 'announcement'
  botAccountId: integer('bot_account_id'),
  targetId: integer('target_id'), // Post ID, Comment ID, etc.
  templateId: integer('template_id'), // Which template was used
  success: boolean('success').default(true).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  activityTypeIdx: index('activity_type_idx').on(table.activityType),
  botAccountIdIdx: index('bot_account_id_idx').on(table.botAccountId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// Relations
export const botAccountsRelations = relations(botAccounts, ({ one }) => ({
  user: one(users, {
    fields: [botAccounts.userId],
    references: [users.id],
  }),
}));


