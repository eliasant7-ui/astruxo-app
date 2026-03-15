/**
 * Setup astruXo TV Channels - 24/7 Automated System Streams
 * Creates system users and permanent livestreams for YouTube playlist playback
 */

import { db } from '../src/server/db/client.js';
import { users, streams } from '../src/server/db/schema.js';
import { eq } from 'drizzle-orm';

interface ChannelConfig {
  username: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  bio: string;
  title: string;
  description: string;
  playlistId: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    username: 'astruxo_tv',
    firebaseUid: 'system_astruxo_tv',
    email: 'tv@astruxo.com',
    displayName: 'astruXo TV',
    bio: '24/7 automated channel - Watch videos together and chat with the community!',
    title: 'Watching videos together – join the chat',
    description: '24/7 automated channel playing curated content. Chat with the community while watching!',
    playlistId: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf', // Lofi Girl playlist
  },
  {
    username: 'astruxo_music',
    firebaseUid: 'system_astruxo_music',
    email: 'music@astruxo.com',
    displayName: 'astruXo Music',
    bio: '24/7 music channel - Non-stop music for every mood!',
    title: 'Non-stop music – relax and chat',
    description: '24/7 music channel playing the best tracks. Discover new music and chat with music lovers!',
    playlistId: 'PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI', // Top Music Hits playlist
  },
  {
    username: 'astruxo_nature',
    firebaseUid: 'system_astruxo_nature',
    email: 'nature@astruxo.com',
    displayName: 'astruXo Nature',
    bio: '24/7 nature channel - Relax with beautiful nature scenes and sounds!',
    title: 'Peaceful nature scenes – relax and unwind',
    description: '24/7 nature channel featuring stunning landscapes, wildlife, and calming sounds. Perfect for relaxation!',
    playlistId: 'PLrAXtmErZgOdP_8GztsuKi9nrraNbKKp4', // Nature & Wildlife playlist
  },
];

async function createChannel(config: ChannelConfig) {
  console.log(`\n🎬 Setting up ${config.displayName}...`);

  // 1. Check if system user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, config.username))
    .limit(1);

  let systemUser;

  if (existingUser.length > 0) {
    console.log(`✅ System user "${config.username}" already exists`);
    systemUser = existingUser[0];
  } else {
    // Create system user
    console.log(`📝 Creating system user "${config.username}"...`);
    const result = await db.insert(users).values({
      firebaseUid: config.firebaseUid,
      username: config.username,
      email: config.email,
      displayName: config.displayName,
      bio: config.bio,
      avatarUrl: '/logo.png',
      role: 'admin',
      isLive: true,
    });

    const userId = Number(result[0].insertId);
    systemUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    console.log('✅ System user created with ID:', systemUser.id);
  }

  // 2. Check if system stream already exists for this user
  const existingStream = await db
    .select()
    .from(streams)
    .where(eq(streams.userId, systemUser.id))
    .limit(1);

  if (existingStream.length > 0) {
    console.log(`✅ System stream already exists with ID: ${existingStream[0].id}`);
    return existingStream[0];
  }

  // 3. Create permanent system stream
  console.log('📝 Creating permanent system stream...');
  
  const streamResult = await db.insert(streams).values({
    userId: systemUser.id,
    title: config.title,
    description: config.description,
    thumbnailUrl: '/logo.png',
    status: 'live',
    isSystemStream: true,
    youtubePlaylistId: config.playlistId,
    isPrivate: false,
    viewerCount: 0,
    peakViewerCount: 0,
    totalGiftsReceived: '0.00',
    currentGoalProgress: 0,
  });

  const streamId = Number(streamResult[0].insertId);
  const stream = await db
    .select()
    .from(streams)
    .where(eq(streams.id, streamId))
    .limit(1)
    .then(rows => rows[0]);

  console.log('✅ System stream created with ID:', streamId);
  console.log(`   - Title: ${config.title}`);
  console.log(`   - Playlist: ${config.playlistId}`);
  console.log(`   - Access at: /stream/${streamId}`);

  return stream;
}

async function setupAstruXoChannels() {
  console.log('🎬 Setting up astruXo 24/7 Channels...\n');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const createdStreams = [];

    for (const channel of CHANNELS) {
      const stream = await createChannel(channel);
      createdStreams.push(stream);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 All astruXo channels setup complete!\n');
    console.log('📺 Active Channels:');
    createdStreams.forEach((stream, index) => {
      console.log(`   ${index + 1}. ${CHANNELS[index].displayName} - /stream/${stream.id}`);
    });
    console.log('\n💡 To change playlists, update the youtubePlaylistId in the streams table');

  } catch (error) {
    console.error('❌ Error setting up astruXo channels:', error);
    throw error;
  }
}

// Run the setup
setupAstruXoChannels()
  .then(() => {
    console.log('\n✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
