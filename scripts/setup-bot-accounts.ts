/**
 * Setup Bot Accounts - Platform Bootstrap System
 * Creates system-managed bot accounts for automated content generation
 */

import { db } from '../src/server/db/client.js';
import { users, botAccounts, bootstrapConfig } from '../src/server/db/schema.js';
import { eq } from 'drizzle-orm';

interface BotConfig {
  username: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  botType: 'content_creator' | 'engagement' | 'announcer';
  postFrequencyMinutes: number;
}

const BOT_CONFIGS: BotConfig[] = [
  {
    username: 'DailyClips',
    firebaseUid: 'bot_daily_clips',
    email: 'dailyclips@astruxo.com',
    displayName: 'Daily Clips',
    bio: '🎬 Sharing interesting video clips and moments every day! | Automated Content',
    avatarUrl: '/logo.png',
    botType: 'content_creator',
    postFrequencyMinutes: 120, // Every 2 hours
  },
  {
    username: 'CoolVideos',
    firebaseUid: 'bot_cool_videos',
    email: 'coolvideos@astruxo.com',
    displayName: 'Cool Videos',
    bio: '📹 Curating the coolest videos from around the web! | Automated Content',
    avatarUrl: '/logo.png',
    botType: 'content_creator',
    postFrequencyMinutes: 180, // Every 3 hours
  },
  {
    username: 'AstruxoExplorer',
    firebaseUid: 'bot_astruxo_explorer',
    email: 'explorer@astruxo.com',
    displayName: 'astruXo Explorer',
    bio: '🌟 Exploring interesting topics and starting conversations! | Automated Content',
    avatarUrl: '/logo.png',
    botType: 'content_creator',
    postFrequencyMinutes: 150, // Every 2.5 hours
  },
  {
    username: 'TechMoments',
    firebaseUid: 'bot_tech_moments',
    email: 'techmoments@astruxo.com',
    displayName: 'Tech Moments',
    bio: '💻 Sharing tech news, facts, and interesting moments! | Automated Content',
    avatarUrl: '/logo.png',
    botType: 'content_creator',
    postFrequencyMinutes: 240, // Every 4 hours
  },
  {
    username: 'StreamAnnouncer',
    firebaseUid: 'bot_stream_announcer',
    email: 'announcer@astruxo.com',
    displayName: 'Stream Announcer',
    bio: '📢 Announcing when streamers go live! | Automated Bot',
    avatarUrl: '/logo.png',
    botType: 'announcer',
    postFrequencyMinutes: 0, // Event-driven, not time-based
  },
];

async function createBotAccount(config: BotConfig) {
  console.log(`\n🤖 Setting up bot: ${config.displayName}...`);

  // 1. Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, config.username))
    .limit(1);

  let botUser;

  if (existingUser.length > 0) {
    console.log(`✅ User "${config.username}" already exists`);
    botUser = existingUser[0];
  } else {
    // Create bot user account
    console.log(`📝 Creating user account "${config.username}"...`);
    const result = await db.insert(users).values({
      firebaseUid: config.firebaseUid,
      username: config.username,
      email: config.email,
      displayName: config.displayName,
      bio: config.bio,
      avatarUrl: config.avatarUrl,
      role: 'user', // Bots are regular users
      isLive: false,
    });

    const userId = Number(result[0].insertId);
    botUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    console.log('✅ User account created with ID:', botUser.id);
  }

  // 2. Check if bot account entry already exists
  const existingBot = await db
    .select()
    .from(botAccounts)
    .where(eq(botAccounts.userId, botUser.id))
    .limit(1);

  if (existingBot.length > 0) {
    console.log(`✅ Bot account entry already exists`);
    return existingBot[0];
  }

  // 3. Create bot account entry
  console.log('📝 Creating bot account entry...');
  
  const botResult = await db.insert(botAccounts).values({
    userId: botUser.id,
    botType: config.botType,
    isActive: true,
    postFrequencyMinutes: config.postFrequencyMinutes,
  });

  const botId = Number(botResult[0].insertId);
  const botAccount = await db
    .select()
    .from(botAccounts)
    .where(eq(botAccounts.id, botId))
    .limit(1)
    .then(rows => rows[0]);

  console.log('✅ Bot account created with ID:', botId);
  console.log(`   - Type: ${config.botType}`);
  console.log(`   - Post Frequency: ${config.postFrequencyMinutes} minutes`);

  return botAccount;
}

async function setupBootstrapConfig() {
  console.log('\n⚙️  Setting up bootstrap configuration...');

  // Check if config already exists
  const existingConfig = await db
    .select()
    .from(bootstrapConfig)
    .limit(1);

  if (existingConfig.length > 0) {
    console.log('✅ Bootstrap config already exists');
    return existingConfig[0];
  }

  // Create default config
  const result = await db.insert(bootstrapConfig).values({
    isEnabled: true,
    autoPostingEnabled: true,
    autoCommentsEnabled: true,
    streamAnnouncementsEnabled: true,
    minPostIntervalMinutes: 30,
    maxPostIntervalMinutes: 180,
    commentProbability: '0.15', // 15% chance
    maxCommentsPerPost: 2,
  });

  console.log('✅ Bootstrap config created');
  return result;
}

async function setupBotAccounts() {
  console.log('🤖 Setting up Platform Bootstrap System...\n');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Setup bootstrap config
    await setupBootstrapConfig();

    // 2. Create all bot accounts
    const createdBots = [];
    for (const config of BOT_CONFIGS) {
      const bot = await createBotAccount(config);
      createdBots.push(bot);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 Bot accounts setup complete!\n');
    console.log('📊 Created Bots:');
    BOT_CONFIGS.forEach((config, index) => {
      console.log(`   ${index + 1}. ${config.displayName} (@${config.username}) - ${config.botType}`);
    });
    console.log('\n💡 Next steps:');
    console.log('   1. Run setup-content-templates.ts to add content');
    console.log('   2. Start the automated posting service');
    console.log('   3. Monitor activity in the admin panel');

  } catch (error) {
    console.error('❌ Error setting up bot accounts:', error);
    throw error;
  }
}

// Run the setup
setupBotAccounts()
  .then(() => {
    console.log('\n✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
