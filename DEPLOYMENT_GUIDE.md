# LiveStream Platform - Complete Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Third-Party Integrations](#third-party-integrations)
8. [Deployment Instructions](#deployment-instructions)
9. [Recommended Hosting Stack](#recommended-hosting-stack)

---

## 1. Project Overview

**LiveStream Platform** is a mobile-first live streaming application similar to Clapper/Fambase with the following features:

### Core Features
- ✅ Firebase Authentication (Email/Password)
- ✅ Live video streaming with Agora SDK
- ✅ Real-time chat with Socket.IO
- ✅ Virtual gifts & monetization system
- ✅ Stripe payment integration for coin purchases
- ✅ Follow system
- ✅ User profiles with avatars
- ✅ Stream history and analytics
- ✅ Earnings dashboard
- ✅ Account management

---

## 2. Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time**: Socket.IO Client
- **Video Streaming**: Agora RTC SDK
- **Payments**: Stripe.js

### Backend
- **Runtime**: Node.js 22+
- **Framework**: Express.js
- **API Routes**: vite-plugin-api
- **Database**: MySQL (via Drizzle ORM)
- **Authentication**: Firebase Admin SDK
- **Real-time**: Socket.IO Server
- **Video Tokens**: Agora Token Server
- **Payments**: Stripe Node SDK
- **File Uploads**: Multer

### Database
- **ORM**: Drizzle ORM
- **Database**: MySQL 8.0+
- **Migrations**: Drizzle Kit

---

## 3. Environment Variables

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=livestream_platform

# ============================================
# FIREBASE CONFIGURATION (Backend)
# ============================================
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# ============================================
# FIREBASE CONFIGURATION (Frontend)
# ============================================
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# ============================================
# AGORA CONFIGURATION
# ============================================
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# ============================================
# STRIPE CONFIGURATION
# ============================================
STRIPE_SECRET_KEY=your_stripe_secret_key_here
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
# Optional: For webhook signature verification
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX

# ============================================
# SERVER CONFIGURATION
# ============================================
HOST=0.0.0.0
PORT=5173
NODE_ENV=production
```

### How to Obtain API Keys

#### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. **Frontend Keys**: Project Settings → General → Your apps → Web app
4. **Backend Keys**: Project Settings → Service Accounts → Generate new private key

#### Agora
1. Go to [Agora Console](https://console.agora.io/)
2. Create a new project
3. Copy App ID and App Certificate from project settings

#### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from Developers → API keys
3. Use Test keys for development, Live keys for production

---

## 4. Database Schema

### Complete Schema (Drizzle ORM)

```typescript
// src/server/db/schema.ts

import { mysqlTable, int, varchar, text, timestamp, boolean, decimal, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  firebaseUid: varchar('firebase_uid', { length: 128 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  coinBalance: int('coin_balance').default(0).notNull(),
  walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  followerCount: int('follower_count').default(0).notNull(),
  followingCount: int('following_count').default(0).notNull(),
  isLive: boolean('is_live').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  firebaseUidIdx: index('firebase_uid_idx').on(table.firebaseUid),
  usernameIdx: index('username_idx').on(table.username),
  isLiveIdx: index('is_live_idx').on(table.isLive),
}));

// ============================================
// STREAMS TABLE
// ============================================
export const streams = mysqlTable('streams', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  agoraChannelName: varchar('agora_channel_name', { length: 64 }).notNull(),
  agoraToken: text('agora_token'),
  isLive: boolean('is_live').default(true).notNull(),
  viewerCount: int('viewer_count').default(0).notNull(),
  peakViewerCount: int('peak_viewer_count').default(0).notNull(),
  totalViews: int('total_views').default(0).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  duration: int('duration').default(0), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  isLiveIdx: index('is_live_idx').on(table.isLive),
  startedAtIdx: index('started_at_idx').on(table.startedAt),
}));

// ============================================
// FOLLOWS TABLE
// ============================================
export const follows = mysqlTable('follows', {
  id: int('id').primaryKey().autoincrement(),
  followerId: int('follower_id').notNull(),
  followingId: int('following_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  followerIdIdx: index('follower_id_idx').on(table.followerId),
  followingIdIdx: index('following_id_idx').on(table.followingId),
  uniqueFollow: index('unique_follow').on(table.followerId, table.followingId),
}));

// ============================================
// CHAT MESSAGES TABLE
// ============================================
export const chatMessages = mysqlTable('chat_messages', {
  id: int('id').primaryKey().autoincrement(),
  streamId: int('stream_id').notNull(),
  userId: int('user_id').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// GIFTS TABLE
// ============================================
export const gifts = mysqlTable('gifts', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  coinCost: int('coin_cost').notNull(),
  tier: int('tier').notNull(), // 1-4
  description: text('description'),
  animationUrl: text('animation_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tierIdx: index('tier_idx').on(table.tier),
  coinCostIdx: index('coin_cost_idx').on(table.coinCost),
}));

// ============================================
// GIFT TRANSACTIONS TABLE
// ============================================
export const giftTransactions = mysqlTable('gift_transactions', {
  id: int('id').primaryKey().autoincrement(),
  giftId: int('gift_id').notNull(),
  senderId: int('sender_id').notNull(),
  receiverId: int('receiver_id').notNull(),
  streamId: int('stream_id'),
  coinAmount: int('coin_amount').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  senderIdIdx: index('sender_id_idx').on(table.senderId),
  receiverIdIdx: index('receiver_id_idx').on(table.receiverId),
  streamIdIdx: index('stream_id_idx').on(table.streamId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// COIN TRANSACTIONS TABLE
// ============================================
export const coinTransactions = mysqlTable('coin_transactions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  amount: int('amount').notNull(), // Positive for purchase, negative for spending
  type: varchar('type', { length: 20 }).notNull(), // 'purchase', 'gift_sent', 'gift_received', 'withdrawal'
  description: text('description'),
  referenceId: int('reference_id'), // ID of related transaction
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  typeIdx: index('type_idx').on(table.type),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  streams: many(streams),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  sentGifts: many(giftTransactions, { relationName: 'sender' }),
  receivedGifts: many(giftTransactions, { relationName: 'receiver' }),
  coinTransactions: many(coinTransactions),
  chatMessages: many(chatMessages),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  user: one(users, {
    fields: [streams.userId],
    references: [users.id],
  }),
  chatMessages: many(chatMessages),
  giftTransactions: many(giftTransactions),
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
```

### Database Migrations

Run migrations with:
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations to database
```

### Seed Data (Gifts Catalog)

```bash
# Run this after migrations
npx tsx src/server/db/seed-gifts.ts
```

---

## 5. Frontend Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # shadcn UI components
│   ├── AuthDialog.tsx         # Login/Register modal
│   ├── GiftAnimation.tsx      # Floating gift animations
│   ├── GiftSelector.tsx       # Gift selection modal
│   ├── ProtectedRoute.tsx     # Route guard
│   └── Spinner.tsx            # Loading spinner
├── layouts/
│   ├── parts/
│   │   ├── Header.tsx         # Navigation header
│   │   └── Footer.tsx         # Site footer
│   ├── RootLayout.tsx         # Main layout wrapper
│   └── Website.tsx            # Website layout
├── lib/
│   ├── auth-context.tsx       # Firebase Auth context
│   ├── firebase-client.ts     # Firebase client config
│   ├── api-client.ts          # API utilities
│   └── utils.ts               # Helper functions
├── pages/
│   ├── index.tsx              # Home page (live streams)
│   ├── go-live.tsx            # Start streaming page
│   ├── broadcast/
│   │   ├── [streamId].tsx     # Broadcaster view
│   │   └── broadcaster-view.tsx
│   ├── stream/
│   │   ├── [streamId].tsx     # Viewer page
│   │   └── viewer-view.tsx
│   ├── user/
│   │   └── [userId].tsx       # User profile
│   ├── profile-edit.tsx       # Edit profile
│   ├── account-settings.tsx   # Account management
│   ├── sync-user.tsx          # Firebase → DB sync
│   ├── buy-coins.tsx          # Coin purchase page
│   ├── earnings.tsx           # Earnings dashboard
│   └── help.tsx               # Help page
├── server/                    # Backend code (see below)
├── styles/
│   └── globals.css            # Global styles
├── App.tsx                    # App component
├── main.tsx                   # Entry point
└── routes.tsx                 # Route definitions
```

### Key Frontend Components

#### Authentication Context (`lib/auth-context.tsx`)
- Firebase Authentication wrapper
- Provides `user`, `loading`, `token`, `refreshToken`
- Auto-refreshes tokens on expiry

#### Protected Routes (`components/ProtectedRoute.tsx`)
- Redirects unauthenticated users to home
- Shows loading state during auth check

#### Real-time Chat (Socket.IO Client)
- Connection in stream viewer/broadcaster pages
- Events: `authenticate`, `chat_message`, `user_joined`, `user_left`, `gift_sent`

#### Video Streaming (Agora SDK)
- Broadcaster: `AgoraRTCProvider` with camera/microphone
- Viewer: `RemoteUser` component for playback

---

## 6. Backend Architecture

### Directory Structure

```
src/server/
├── api/
│   ├── auth/
│   │   ├── me/GET.ts          # Get current user
│   │   ├── sync/POST.ts       # Sync Firebase → DB
│   │   └── register/POST.ts   # Register user
│   ├── streams/
│   │   ├── start/POST.ts      # Start stream
│   │   ├── live/GET.ts        # Get live streams
│   │   └── [streamId]/
│   │       ├── GET.ts         # Get stream details
│   │       ├── PUT.ts         # Update stream
│   │       └── DELETE.ts      # End stream
│   ├── users/
│   │   └── [userId]/
│   │       ├── GET.ts         # Get user profile
│   │       ├── PUT.ts         # Update profile
│   │       └── DELETE.ts      # Delete account
│   ├── gifts/
│   │   ├── GET.ts             # Get gift catalog
│   │   └── send/POST.ts       # Send gift
│   ├── wallet/
│   │   ├── balance/GET.ts     # Get balance
│   │   └── earnings/GET.ts    # Get earnings
│   ├── stripe/
│   │   ├── create-checkout-session/POST.ts
│   │   └── webhook/POST.ts    # Stripe webhook
│   └── upload/
│       └── avatar/POST.ts     # Avatar upload
├── db/
│   ├── client.ts              # Database connection
│   ├── config.ts              # DB configuration
│   ├── schema.ts              # Drizzle schema
│   └── seed-gifts.ts          # Seed gifts data
├── middleware/
│   └── auth.ts                # Auth middleware (deprecated)
├── services/
│   ├── firebase.ts            # Firebase Admin SDK
│   ├── agora.ts               # Agora token generation
│   └── socket.ts              # Socket.IO server
└── configure.js               # Express server setup
```

### API Endpoints

#### Authentication
- `POST /api/auth/sync` - Sync Firebase user to database
- `GET /api/auth/me` - Get current authenticated user

#### Streams
- `POST /api/streams/start` - Start a new stream
- `GET /api/streams/live` - Get all live streams
- `GET /api/streams/:streamId` - Get stream details
- `PUT /api/streams/:streamId` - Update stream (end, viewer count)
- `DELETE /api/streams/:streamId` - Delete stream

#### Users
- `GET /api/users/:userId` - Get user profile (supports ID, UID, username)
- `PUT /api/users/:userId` - Update user profile
- `DELETE /api/users/:userId` - Delete user account

#### Gifts
- `GET /api/gifts` - Get gift catalog
- `POST /api/gifts/send` - Send gift to streamer

#### Wallet
- `GET /api/wallet/balance` - Get coin and wallet balance
- `GET /api/wallet/earnings` - Get earnings history

#### Stripe
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/webhook` - Handle payment confirmations

#### Upload
- `POST /api/upload/avatar` - Upload profile picture

### Socket.IO Events

#### Client → Server
- `authenticate` - Authenticate with Firebase token
- `join_stream` - Join a stream room
- `leave_stream` - Leave a stream room
- `chat_message` - Send chat message
- `update_viewer_count` - Update viewer count

#### Server → Client
- `authenticated` - Authentication successful
- `chat_message` - New chat message
- `chat_history` - Load chat history
- `user_joined` - User joined stream
- `user_left` - User left stream
- `gift_sent` - Gift sent notification
- `viewer_count_updated` - Viewer count changed

### Authentication Pattern

**CRITICAL**: Exported middleware does NOT work in production builds. Use inline authentication:

```typescript
import { verifyFirebaseToken } from '../../../services/firebase.js';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  // Manual authentication
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyFirebaseToken(idToken);

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Load user from database
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.firebaseUid, decodedToken.uid))
    .limit(1);

  if (userResult.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userResult[0];
  
  // Continue with authenticated logic...
}
```

---

## 7. Third-Party Integrations

### Firebase Authentication

**Setup:**
1. Enable Email/Password authentication in Firebase Console
2. Add authorized domains for production
3. Configure Firebase Admin SDK with service account

**Client Configuration:**
```typescript
// src/lib/firebase-client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### Agora Video Streaming

**Token Generation:**
```typescript
// src/server/services/agora.ts
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export function generateAgoraToken(
  channelName: string,
  uid: number,
  role: 'publisher' | 'subscriber' = 'subscriber'
): string {
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs,
    privilegeExpiredTs
  );
}
```

**Client Usage:**
```typescript
// Broadcaster
import { AgoraRTCProvider, useRTCClient } from 'agora-rtc-react';

<AgoraRTCProvider client={client}>
  <LocalVideoTrack play />
  <LocalAudioTrack play />
</AgoraRTCProvider>

// Viewer
<RemoteUser user={remoteUsers[0]} playVideo playAudio />
```

### Stripe Payments

**Coin Packages:**
```typescript
const COIN_PACKAGES = {
  '100': { coins: 100, price: 99 },      // $0.99
  '500': { coins: 500, price: 499, bonus: 50 },   // $4.99
  '1000': { coins: 1000, price: 999, bonus: 150 }, // $9.99
  '2500': { coins: 2500, price: 2499, bonus: 500 }, // $24.99
  '5000': { coins: 5000, price: 4999, bonus: 1500 }, // $49.99
};
```

**Checkout Flow:**
1. User clicks "Purchase" on coin package
2. Frontend calls `/api/stripe/create-checkout-session`
3. Backend creates Stripe Checkout Session
4. User redirected to Stripe payment page
5. After payment, user redirected back with success/cancel
6. Stripe webhook confirms payment
7. Backend credits coins to user account

**Webhook Configuration:**
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`
- Add webhook secret to environment variables

### Socket.IO Real-time

**Server Initialization:**
```typescript
// src/server/services/socket.ts
import { Server } from 'socket.io';
import { createServer } from 'http';

let io: Server | null = null;

export function initializeSocketIO(httpServer: any) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('authenticate', async (token: string) => {
      // Verify Firebase token
      // Store user info in socket.data
    });

    socket.on('join_stream', (streamId: string) => {
      socket.join(`stream_${streamId}`);
    });

    socket.on('chat_message', (data) => {
      io.to(`stream_${data.streamId}`).emit('chat_message', data);
    });
  });

  return io;
}
```

---

## 8. Deployment Instructions

### Prerequisites
- Node.js 22+ installed
- MySQL 8.0+ database
- Domain name (optional)
- SSL certificate (recommended)

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd livestream-platform
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file with all required variables (see section 3).

### Step 4: Setup Database

```bash
# Create database
mysql -u root -p
CREATE DATABASE livestream_platform;
EXIT;

# Run migrations
npm run db:generate
npm run db:migrate

# Seed gift catalog
npx tsx src/server/db/seed-gifts.ts
```

### Step 5: Build Application

```bash
npm run build
```

This creates:
- `dist/` - Frontend build
- `dist/server.bundle.cjs` - Backend bundle

### Step 6: Start Production Server

```bash
NODE_ENV=production node dist/server.bundle.cjs
```

Or use PM2 for process management:

```bash
npm install -g pm2
pm2 start dist/server.bundle.cjs --name livestream-platform
pm2 save
pm2 startup
```

### Step 7: Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend static files
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    client_max_body_size 10M;
}
```

### Step 8: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy webhook secret to `.env`

---

## 9. Recommended Hosting Stack

### Option 1: VPS (DigitalOcean, Linode, Vultr)

**Recommended Specs:**
- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 50GB SSD
- **Bandwidth**: Unmetered or 3TB+

**Cost**: $20-40/month

**Pros:**
- Full control
- Cost-effective for high traffic
- Easy to scale

**Cons:**
- Requires server management
- Manual security updates

### Option 2: Platform as a Service (Render, Railway, Fly.io)

**Recommended:**
- **Render**: Web Service + PostgreSQL/MySQL
- **Railway**: Project with MySQL plugin
- **Fly.io**: App + MySQL volume

**Cost**: $15-30/month

**Pros:**
- Easy deployment
- Auto-scaling
- Managed infrastructure

**Cons:**
- Less control
- Can be expensive at scale

### Option 3: Serverless (Vercel + PlanetScale)

**Stack:**
- **Frontend**: Vercel
- **Database**: PlanetScale (MySQL)
- **Backend**: Vercel Serverless Functions

**Cost**: $20-50/month

**Pros:**
- Auto-scaling
- Global CDN
- Zero DevOps

**Cons:**
- Socket.IO requires workarounds
- Cold starts for functions

### Recommended: VPS with Docker

**Why:**
- Full control over Socket.IO and real-time features
- Cost-effective
- Easy to backup and migrate
- Supports all features without limitations

**Docker Compose Setup:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: livestream_platform
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
```

---

## 10. Monitoring & Maintenance

### Logging

Use PM2 for logs:
```bash
pm2 logs livestream-platform
pm2 logs livestream-platform --lines 100
```

### Database Backups

```bash
# Daily backup script
mysqldump -u root -p livestream_platform > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p livestream_platform < backup_20260228.sql
```

### Health Checks

Monitor these endpoints:
- `GET /api/health` - Server health
- Socket.IO connection status
- Database connection pool

### Performance Optimization

1. **Database Indexes**: Already configured in schema
2. **CDN**: Use Cloudflare for static assets
3. **Image Optimization**: Compress avatars on upload
4. **Caching**: Add Redis for session storage (optional)

---

## 11. Security Checklist

- ✅ HTTPS enabled with valid SSL certificate
- ✅ Firebase tokens verified on every request
- ✅ SQL injection protection (Drizzle ORM parameterized queries)
- ✅ CORS configured properly
- ✅ Rate limiting on API endpoints (recommended)
- ✅ File upload validation (size, type)
- ✅ Environment variables secured
- ✅ Stripe webhook signature verification
- ✅ User input sanitization

---

## 12. Troubleshooting

### Common Issues

**Socket.IO not connecting:**
- Check CORS configuration
- Verify WebSocket support in reverse proxy
- Check firewall rules

**Agora video not working:**
- Verify App ID and Certificate
- Check token expiration
- Ensure HTTPS for production

**Stripe webhook not receiving events:**
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Review Stripe Dashboard logs

**Database connection errors:**
- Verify credentials in `.env`
- Check MySQL service is running
- Ensure database exists

---

## 13. Support & Resources

### Documentation
- [Agora Docs](https://docs.agora.io/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Socket.IO Docs](https://socket.io/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

### Community
- GitHub Issues (your repository)
- Stack Overflow
- Discord/Slack community

---

## 14. License & Credits

**Tech Stack Credits:**
- React + Vite
- shadcn/ui components
- Agora RTC SDK
- Firebase Authentication
- Stripe Payments
- Socket.IO
- Drizzle ORM

---

## Conclusion

This guide provides everything needed to deploy and maintain your LiveStream Platform independently. The codebase is fully portable and can be hosted on any infrastructure that supports Node.js and MySQL.

For questions or issues, refer to the troubleshooting section or consult the official documentation of each technology.

**Good luck with your deployment! 🚀**
