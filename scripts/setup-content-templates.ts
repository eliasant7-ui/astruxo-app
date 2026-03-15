/**
 * Setup Content Templates - Platform Bootstrap System
 * Creates pre-written content templates for automated posting
 */

import { db } from '../src/server/db/client.js';
import { contentTemplates, commentTemplates } from '../src/server/db/schema.js';

// Content templates for automated posts
const CONTENT_TEMPLATES = [
  // Questions of the Day
  {
    category: 'question',
    content: '🤔 Question of the Day: What\'s your favorite way to spend a weekend?',
  },
  {
    category: 'question',
    content: '💭 Let\'s discuss: What\'s the most interesting thing you learned this week?',
  },
  {
    category: 'question',
    content: '🎯 Quick question: If you could learn any skill instantly, what would it be?',
  },
  {
    category: 'question',
    content: '🌟 What\'s something you\'re looking forward to this week?',
  },
  {
    category: 'question',
    content: '📚 What\'s the last book, movie, or show that really impressed you?',
  },
  {
    category: 'question',
    content: '🎨 If you could master any creative skill, what would you choose?',
  },
  {
    category: 'question',
    content: '🌍 If you could travel anywhere right now, where would you go?',
  },
  {
    category: 'question',
    content: '💡 What\'s the best advice you\'ve ever received?',
  },

  // Interesting Facts
  {
    category: 'fact',
    content: '🌟 Did you know? The first video ever uploaded to YouTube was "Me at the zoo" in 2005!',
  },
  {
    category: 'fact',
    content: '🎬 Fun fact: The average person will spend about 6 months of their lifetime watching videos online!',
  },
  {
    category: 'fact',
    content: '📱 Tech fact: Over 500 hours of video are uploaded to YouTube every minute!',
  },
  {
    category: 'fact',
    content: '🌐 Did you know? Live streaming has grown by over 99% in the last few years!',
  },
  {
    category: 'fact',
    content: '🎥 Interesting: The word "video" comes from Latin, meaning "I see"!',
  },
  {
    category: 'fact',
    content: '💻 Tech trivia: The first webcam was used to monitor a coffee pot at Cambridge University!',
  },
  {
    category: 'fact',
    content: '🌟 Did you know? The human brain processes visual information 60,000 times faster than text!',
  },
  {
    category: 'fact',
    content: '📺 Fun fact: The average person watches over 100 minutes of video content per day!',
  },

  // Conversation Starters
  {
    category: 'conversation_starter',
    content: '👋 Good morning everyone! What are you working on today?',
  },
  {
    category: 'conversation_starter',
    content: '🎉 Happy Friday! Any exciting plans for the weekend?',
  },
  {
    category: 'conversation_starter',
    content: '☕ Coffee or tea? Let\'s settle this debate once and for all!',
  },
  {
    category: 'conversation_starter',
    content: '🎮 Gamers, what are you playing right now? Drop your recommendations!',
  },
  {
    category: 'conversation_starter',
    content: '🎵 What song is stuck in your head today? Share it with us!',
  },
  {
    category: 'conversation_starter',
    content: '📸 Share something that made you smile today!',
  },
  {
    category: 'conversation_starter',
    content: '🌅 Morning motivation: What\'s one thing you want to accomplish today?',
  },
  {
    category: 'conversation_starter',
    content: '🎬 Movie night! What\'s your go-to comfort movie?',
  },
  {
    category: 'conversation_starter',
    content: '💪 What\'s your favorite way to stay productive?',
  },
  {
    category: 'conversation_starter',
    content: '🌟 Shoutout time! Tag someone who inspires you!',
  },

  // Tech & Platform Updates
  {
    category: 'announcement',
    content: '🚀 Welcome to astruXo! We\'re building an amazing community of creators and viewers. Join us!',
  },
  {
    category: 'announcement',
    content: '📺 Check out our 24/7 channels: astruXo TV, astruXo Music, and astruXo Nature - always streaming!',
  },
  {
    category: 'announcement',
    content: '🎥 New to streaming? We\'ve got you covered! Hit that "Go Live" button and share your passion!',
  },
  {
    category: 'announcement',
    content: '💬 Don\'t forget to engage with the community! Like, comment, and share great content!',
  },
  {
    category: 'announcement',
    content: '🌟 Tip: Use hashtags to help others discover your content!',
  },
];

// Comment templates for engagement
const COMMENT_TEMPLATES = [
  // Positive comments
  { content: 'Interesting! 🤔', sentiment: 'positive' },
  { content: 'Great point! 👍', sentiment: 'positive' },
  { content: 'Love this! ❤️', sentiment: 'positive' },
  { content: 'So true! 💯', sentiment: 'positive' },
  { content: 'Amazing! ✨', sentiment: 'positive' },
  { content: 'This is awesome! 🔥', sentiment: 'positive' },
  { content: 'Well said! 👏', sentiment: 'positive' },
  { content: 'Couldn\'t agree more! 🙌', sentiment: 'positive' },

  // Questions
  { content: 'What do you think? 🤔', sentiment: 'question' },
  { content: 'Anyone else feel this way?', sentiment: 'question' },
  { content: 'Thoughts? 💭', sentiment: 'question' },
  { content: 'What\'s your take on this?', sentiment: 'question' },
  { content: 'Has anyone tried this?', sentiment: 'question' },
  { content: 'What would you do?', sentiment: 'question' },

  // Neutral engagement
  { content: 'Thanks for sharing! 🙏', sentiment: 'neutral' },
  { content: 'Good to know! 📝', sentiment: 'neutral' },
  { content: 'Noted! ✅', sentiment: 'neutral' },
  { content: 'Interesting perspective! 👀', sentiment: 'neutral' },
  { content: 'I see what you mean! 💡', sentiment: 'neutral' },
];

async function setupContentTemplates() {
  console.log('📝 Setting up Content Templates...\n');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Insert content templates
    console.log('\n📄 Creating content templates...');
    let contentCount = 0;

    for (const template of CONTENT_TEMPLATES) {
      await db.insert(contentTemplates).values({
        category: template.category,
        content: template.content,
        isActive: true,
        usageCount: 0,
      });
      contentCount++;
    }

    console.log(`✅ Created ${contentCount} content templates`);
    console.log(`   - Questions: ${CONTENT_TEMPLATES.filter(t => t.category === 'question').length}`);
    console.log(`   - Facts: ${CONTENT_TEMPLATES.filter(t => t.category === 'fact').length}`);
    console.log(`   - Conversation Starters: ${CONTENT_TEMPLATES.filter(t => t.category === 'conversation_starter').length}`);
    console.log(`   - Announcements: ${CONTENT_TEMPLATES.filter(t => t.category === 'announcement').length}`);

    // 2. Insert comment templates
    console.log('\n💬 Creating comment templates...');
    let commentCount = 0;

    for (const template of COMMENT_TEMPLATES) {
      await db.insert(commentTemplates).values({
        content: template.content,
        sentiment: template.sentiment,
        isActive: true,
        usageCount: 0,
      });
      commentCount++;
    }

    console.log(`✅ Created ${commentCount} comment templates`);
    console.log(`   - Positive: ${COMMENT_TEMPLATES.filter(t => t.sentiment === 'positive').length}`);
    console.log(`   - Questions: ${COMMENT_TEMPLATES.filter(t => t.sentiment === 'question').length}`);
    console.log(`   - Neutral: ${COMMENT_TEMPLATES.filter(t => t.sentiment === 'neutral').length}`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 Template setup complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Start the automated posting service');
    console.log('   2. Monitor activity in the admin panel');
    console.log('   3. Add more templates as needed');

  } catch (error) {
    console.error('❌ Error setting up templates:', error);
    throw error;
  }
}

// Run the setup
setupContentTemplates()
  .then(() => {
    console.log('\n✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
