/**
 * Bootstrap Service - Automated Content Generation
 * Manages automated posting, commenting, and announcements
 */

import { db } from '../db/client.js';
import {
  botAccounts,
  contentTemplates,
  commentTemplates,
  bootstrapConfig,
  posts,
  comments,
  activityLog,
  users,
} from '../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

class BootstrapService {
  private isRunning = false;
  private postingInterval: NodeJS.Timeout | null = null;
  private commentingInterval: NodeJS.Timeout | null = null;
  private postQueue: Array<{ botId: number; userId: number }> = [];
  private isProcessingQueue = false;
  private lastPostTime: Date | null = null;
  private readonly MIN_POST_INTERVAL_MINUTES = 4 * 60; // Minimum 4 hours between ANY posts

  /**
   * Start the bootstrap service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Bootstrap service is already running');
      return;
    }

    console.log('🚀 Starting Bootstrap Service...');
    this.isRunning = true;

    // Check if service is enabled
    const config = await this.getConfig();
    if (!config.isEnabled) {
      console.log('⏸️  Bootstrap service is disabled in config');
      return;
    }

    // Start automated posting
    if (config.autoPostingEnabled) {
      this.startAutomatedPosting();
    }

    // Start automated commenting
    if (config.autoCommentsEnabled) {
      this.startAutomatedCommenting();
    }

    console.log('✅ Bootstrap service started successfully');
  }

  /**
   * Stop the bootstrap service
   */
  stop() {
    console.log('🛑 Stopping Bootstrap Service...');
    this.isRunning = false;

    if (this.postingInterval) {
      clearInterval(this.postingInterval);
      this.postingInterval = null;
    }

    if (this.commentingInterval) {
      clearInterval(this.commentingInterval);
      this.commentingInterval = null;
    }

    console.log('✅ Bootstrap service stopped');
  }

  /**
   * Get bootstrap configuration
   */
  private async getConfig() {
    const config = await db.select().from(bootstrapConfig).limit(1);
    return config[0] || {
      isEnabled: false,
      autoPostingEnabled: false,
      autoCommentsEnabled: false,
      streamAnnouncementsEnabled: false,
      minPostIntervalMinutes: 30,
      maxPostIntervalMinutes: 180,
      commentProbability: '0.15',
      maxCommentsPerPost: 2,
    };
  }

  /**
   * Start automated posting loop
   */
  private startAutomatedPosting() {
    console.log('📝 Starting automated posting...');

    // Check every 5 minutes if any bot should be added to queue
    this.postingInterval = setInterval(async () => {
      try {
        await this.checkAndQueuePosts();
      } catch (error) {
        console.error('❌ Error in automated posting:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Also run immediately
    this.checkAndQueuePosts();
    
    // Start processing the queue
    this.processPostQueue();
  }

  /**
   * Check if any bots should post and add them to queue
   */
  private async checkAndQueuePosts() {
    const config = await this.getConfig();
    if (!config.autoPostingEnabled) return;

    // Get all active content creator bots
    const bots = await db
      .select({
        bot: botAccounts,
        user: users,
      })
      .from(botAccounts)
      .innerJoin(users, eq(botAccounts.userId, users.id))
      .where(
        and(
          eq(botAccounts.isActive, true),
          eq(botAccounts.botType, 'content_creator')
        )
      );

    for (const { bot, user } of bots) {
      // Check if bot is already in queue
      const alreadyQueued = this.postQueue.some(item => item.botId === bot.id);
      if (alreadyQueued) continue;

      // Check if enough time has passed since last post
      const now = new Date();
      const lastPosted = bot.lastPostedAt ? new Date(bot.lastPostedAt) : null;

      if (lastPosted) {
        const minutesSinceLastPost = (now.getTime() - lastPosted.getTime()) / (1000 * 60);
        if (minutesSinceLastPost < bot.postFrequencyMinutes) {
          continue; // Not time yet
        }
      }

      // Add to queue
      this.postQueue.push({ botId: bot.id, userId: user.id });
      console.log(`📋 Added ${user.username} to post queue (queue size: ${this.postQueue.length})`);
    }
  }

  /**
   * Process the post queue - one post at a time with minimum interval
   */
  private async processPostQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const processNext = async () => {
      try {
        // Check if queue is empty
        if (this.postQueue.length === 0) {
          // Check again in 1 minute
          setTimeout(processNext, 60 * 1000);
          return;
        }

        // Check if enough time has passed since last post
        if (this.lastPostTime) {
          const minutesSinceLastPost = (Date.now() - this.lastPostTime.getTime()) / (1000 * 60);
          if (minutesSinceLastPost < this.MIN_POST_INTERVAL_MINUTES) {
            const waitMinutes = Math.ceil(this.MIN_POST_INTERVAL_MINUTES - minutesSinceLastPost);
            console.log(`⏳ Waiting ${waitMinutes} more minutes before next post...`);
            setTimeout(processNext, waitMinutes * 60 * 1000);
            return;
          }
        }

        // Get next bot from queue
        const nextBot = this.postQueue.shift();
        if (!nextBot) {
          setTimeout(processNext, 60 * 1000);
          return;
        }

        // Create the post
        await this.createBotPost(nextBot.botId, nextBot.userId);
        this.lastPostTime = new Date();

        // Wait minimum interval before processing next
        setTimeout(processNext, this.MIN_POST_INTERVAL_MINUTES * 60 * 1000);
      } catch (error) {
        console.error('❌ Error processing post queue:', error);
        setTimeout(processNext, 60 * 1000);
      }
    };

    processNext();
  }

  /**
   * Create a post from a bot account
   */
  private async createBotPost(botId: number, userId: number) {
    try {
      // Get bot info for logging
      const botInfo = await db
        .select({ username: users.username })
        .from(botAccounts)
        .innerJoin(users, eq(botAccounts.userId, users.id))
        .where(eq(botAccounts.id, botId))
        .limit(1);

      const botUsername = botInfo[0]?.username || 'Unknown';
      console.log(`\n🤖 Creating post for bot: ${botUsername}`);

      // Get a random unused or least-used template
      const templates = await db
        .select()
        .from(contentTemplates)
        .where(eq(contentTemplates.isActive, true))
        .orderBy(contentTemplates.usageCount, contentTemplates.lastUsedAt);

      if (templates.length === 0) {
        console.log('⚠️  No content templates available');
        return;
      }

      // Pick a random template from the top 10 least used
      const topTemplates = templates.slice(0, Math.min(10, templates.length));
      const template = topTemplates[Math.floor(Math.random() * topTemplates.length)];

      console.log(`   📄 Template: "${template.content.substring(0, 50)}..."`);
      console.log(`   🖼️  Media: ${template.mediaUrl ? 'Yes' : 'No'}`);

      // Create the post
      const result = await db.insert(posts).values({
        userId: userId,
        content: template.content,
        mediaUrl: template.mediaUrl || null,
        mediaType: template.mediaUrl ? 'image' : null,
        likeCount: 0,
        commentCount: 0,
      });

      const postId = Number(result[0].insertId);

      // Update template usage
      await db
        .update(contentTemplates)
        .set({
          usageCount: sql`${contentTemplates.usageCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(contentTemplates.id, template.id));

      // Update bot last posted time
      await db
        .update(botAccounts)
        .set({ lastPostedAt: new Date() })
        .where(eq(botAccounts.id, botId));

      // Log activity
      await db.insert(activityLog).values({
        activityType: 'post',
        botAccountId: botId,
        targetId: postId,
        templateId: template.id,
        success: true,
      });

      console.log(`   ✅ Post created successfully (ID: ${postId})`);
      console.log(`   ⏰ Next post from this bot in ${botInfo[0] ? 'configured' : 'default'} minutes\n`);
    } catch (error) {
      console.error(`   ❌ Error creating bot post:`, error);

      // Log failed activity
      await db.insert(activityLog).values({
        activityType: 'post',
        botAccountId: botId,
        success: false,
        errorMessage: String(error),
      });
    }
  }

  /**
   * Start automated commenting loop
   */
  private startAutomatedCommenting() {
    console.log('💬 Starting automated commenting...');

    // Check every 10 minutes for posts to comment on
    this.commentingInterval = setInterval(async () => {
      try {
        await this.checkAndCreateComments();
      } catch (error) {
        console.error('❌ Error in automated commenting:', error);
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Also run after 2 minutes (give posts time to be created)
    setTimeout(() => this.checkAndCreateComments(), 2 * 60 * 1000);
  }

  /**
   * Check recent posts and add comments
   */
  private async checkAndCreateComments() {
    const config = await this.getConfig();
    if (!config.autoCommentsEnabled) return;

    // Get recent posts from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPosts = await db
      .select()
      .from(posts)
      .where(sql`${posts.createdAt} > ${oneDayAgo}`)
      .orderBy(desc(posts.createdAt))
      .limit(20);

    for (const post of recentPosts) {
      // Check if post already has bot comments
      const existingBotComments = await db
        .select()
        .from(comments)
        .innerJoin(botAccounts, eq(comments.userId, botAccounts.userId))
        .where(eq(comments.postId, post.id));

      // Skip if already has max comments
      if (existingBotComments.length >= config.maxCommentsPerPost) {
        continue;
      }

      // Random chance to comment (based on commentProbability)
      const probability = parseFloat(config.commentProbability);
      if (Math.random() > probability) {
        continue;
      }

      // Create a comment
      await this.createBotComment(post.id);
    }
  }

  /**
   * Create a comment from a random bot
   */
  private async createBotComment(postId: number) {
    try {
      // Get a random active bot
      const bots = await db
        .select({
          bot: botAccounts,
          user: users,
        })
        .from(botAccounts)
        .innerJoin(users, eq(botAccounts.userId, users.id))
        .where(eq(botAccounts.isActive, true));

      if (bots.length === 0) return;

      const randomBot = bots[Math.floor(Math.random() * bots.length)];

      // Get a random comment template
      const templates = await db
        .select()
        .from(commentTemplates)
        .where(eq(commentTemplates.isActive, true))
        .orderBy(commentTemplates.usageCount);

      if (templates.length === 0) return;

      const topTemplates = templates.slice(0, Math.min(10, templates.length));
      const template = topTemplates[Math.floor(Math.random() * topTemplates.length)];

      // Create the comment
      const result = await db.insert(comments).values({
        postId: postId,
        userId: randomBot.user.id,
        content: template.content,
        likeCount: 0,
      });

      const commentId = Number(result[0].insertId);

      // Update post comment count
      await db
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, postId));

      // Update template usage
      await db
        .update(commentTemplates)
        .set({
          usageCount: sql`${commentTemplates.usageCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(commentTemplates.id, template.id));

      // Log activity
      await db.insert(activityLog).values({
        activityType: 'comment',
        botAccountId: randomBot.bot.id,
        targetId: commentId,
        templateId: template.id,
        success: true,
      });

      console.log(`✅ Bot ${randomBot.bot.id} commented on post ${postId}`);
    } catch (error) {
      console.error(`❌ Error creating bot comment:`, error);
    }
  }

  /**
   * Create a livestream announcement post
   */
  async announceStream(streamId: number, streamerName: string, streamTitle: string) {
    try {
      const config = await this.getConfig();
      if (!config.streamAnnouncementsEnabled) return;

      // Get the announcer bot
      const announcerBot = await db
        .select({
          bot: botAccounts,
          user: users,
        })
        .from(botAccounts)
        .innerJoin(users, eq(botAccounts.userId, users.id))
        .where(
          and(
            eq(botAccounts.botType, 'announcer'),
            eq(botAccounts.isActive, true)
          )
        )
        .limit(1);

      if (announcerBot.length === 0) {
        console.log('⚠️  No announcer bot available');
        return;
      }

      const { bot, user } = announcerBot[0];

      // Create announcement post
      const content = `🔴 LIVE NOW! ${streamerName} is streaming: "${streamTitle}" - Join the stream! 🎥`;

      const result = await db.insert(posts).values({
        userId: user.id,
        content: content,
        likeCount: 0,
        commentCount: 0,
      });

      const postId = Number(result[0].insertId);

      // Log activity
      await db.insert(activityLog).values({
        activityType: 'announcement',
        botAccountId: bot.id,
        targetId: postId,
        success: true,
      });

      console.log(`✅ Stream announcement created for stream ${streamId}`);
    } catch (error) {
      console.error('❌ Error creating stream announcement:', error);
    }
  }
}

// Export singleton instance
export const bootstrapService = new BootstrapService();
