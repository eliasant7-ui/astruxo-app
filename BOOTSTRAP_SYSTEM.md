# astruXo Bootstrap System

## Overview

The Bootstrap System is an automated content generation platform designed to solve the "empty platform" problem during the early stages of community growth. It creates authentic-looking activity through bot accounts that post content, add comments, and announce livestreams.

## ✨ Features

### 1. **Bot Accounts** (5 Total)
System-managed accounts that create content automatically:

- **DailyClips** (@DailyClips) - Posts every 45 minutes
  - Shares interesting video clips and moments
  - Content creator type
  - Language: English

- **astruXo Explorer** (@AstruxoExplorer) - Posts every 60 minutes (1 hour)
  - Explores interesting topics and starts conversations
  - Content creator type
  - Language: English

- **Tech Moments** (@TechMoments) - Posts every 75 minutes (1.25 hours)
  - Shares tech news, facts, and interesting moments
  - Content creator type
  - Language: English

- **Historia Viva** (@HistoriaViva) - Posts every 90 minutes (1.5 hours) 🆕
  - Comparte momentos fascinantes de la historia
  - Content creator type
  - Language: Spanish

- **Mente Libre** (@MenteLibre) - Posts every 105 minutes (1.75 hours) 🆕
  - Reflexiones filosóficas y pensamientos profundos
  - Content creator type
  - Language: Spanish

- **Stream Announcer** (@StreamAnnouncer) - Event-driven
  - Announces when streamers go live
  - Announcer type
  - Language: English/Spanish

### 2. **Content Templates** (49 Total)

Pre-written content organized by category:

- **Questions** (8 templates) - "Question of the Day" style posts (English)
- **Facts** (8 templates) - Interesting facts about video, tech, and streaming (English)
- **Conversation Starters** (10 templates) - Engaging posts to spark discussion (English)
- **Announcements** (5 templates) - Platform updates and tips (English)
- **History** (8 templates) - Fascinating historical facts and moments (Spanish) 🆕
- **Philosophy** (10 templates) - Philosophical reflections and deep thoughts (Spanish) 🆕

### 3. **Comment Templates** (19 Total)

Simple engagement comments to start discussions:

- **Positive** (8 templates) - "Interesting! 🤔", "Great point! 👍"
- **Questions** (6 templates) - "What do you think? 🤔", "Thoughts? 💭"
- **Neutral** (5 templates) - "Thanks for sharing! 🙏", "Good to know! 📝"

### 4. **Automated Posting**

- Bots check every 5 minutes if it's time to post
- Each bot has its own posting frequency
- Templates are rotated to avoid repetition
- Least-used templates are prioritized

### 5. **Automated Commenting**

- Checks every 10 minutes for posts to comment on
- 15% probability of commenting on each post (configurable)
- Maximum 2 bot comments per post (configurable)
- Only comments on posts from the last 24 hours

### 6. **Stream Announcements**

- Automatically creates a post when a user goes live
- Format: "🔴 LIVE NOW! [Username] is streaming: [Title] - Join the stream! 🎥"
- Posted by the Stream Announcer bot

### 7. **24/7 Livestream Channels**

Already implemented - three permanent channels:
- **astruXo TV** (ID: 227) - General content
- **astruXo Music** (ID: 228) - 24/7 music
- **astruXo Nature** (ID: 229) - Nature/wildlife

## 🎛️ Admin Control Panel

Access via: **Admin Dashboard → Bootstrap Tab**

### System Status
- **Master Enable/Disable** - Turn entire system on/off
- **Auto Posting** - Enable/disable automated posts
- **Auto Comments** - Enable/disable automated comments
- **Stream Announcements** - Enable/disable stream alerts

### Statistics Dashboard
- **Bot Accounts** - View all bots, their status, and last activity
- **Activity Stats** - See posts, comments, and announcements (24h / all-time)
- **Success Rate** - Monitor system reliability

### Advanced Settings
- **Comment Probability** - Adjust chance of commenting (0.0 - 1.0)
- **Max Comments Per Post** - Limit bot comments per post

## 📊 Database Schema

### `bot_accounts`
Tracks system-managed bot accounts
- Links to `users` table
- Stores bot type, frequency, and last posted time

### `content_templates`
Pre-written content for automated posts
- Categorized by type (question, fact, conversation_starter, announcement)
- Tracks usage count to rotate content

### `comment_templates`
Simple engagement comments
- Categorized by sentiment (positive, neutral, question)
- Tracks usage count

### `bootstrap_config`
Global system configuration
- Enable/disable flags for each feature
- Posting intervals and comment probability

### `activity_log`
Audit trail of all automated actions
- Tracks posts, comments, and announcements
- Records success/failure for monitoring

## 🚀 Setup Instructions

### Initial Setup (Already Complete)

1. **Create Bot Accounts**
   ```bash
   npx tsx scripts/setup-bot-accounts.ts
   ```
   Creates 5 bot user accounts and bot account entries

2. **Add Content Templates**
   ```bash
   npx tsx scripts/setup-content-templates.ts
   ```
   Adds 31 content templates and 19 comment templates

3. **Start Server**
   The bootstrap service starts automatically when the server starts

### Verification

Check server logs for:
```
🚀 Starting Bootstrap Service...
📝 Starting automated posting...
💬 Starting automated commenting...
✅ Bootstrap service started successfully
✅ Bot 1 created post X: "..."
```

## 🎯 Usage

### For Admins

1. **Monitor Activity**
   - Go to Admin Dashboard → Bootstrap Tab
   - View real-time statistics
   - Check bot activity and success rates

2. **Adjust Settings**
   - Toggle features on/off as needed
   - Adjust comment probability for more/less engagement
   - Set max comments per post

3. **Disable When Ready**
   - Once real user activity increases
   - Turn off "System Enabled" toggle
   - Bots will stop posting immediately

### For Developers

**Add New Content Templates:**
```typescript
await db.insert(contentTemplates).values({
  category: 'question',
  content: 'Your new question here?',
  isActive: true,
  usageCount: 0,
});
```

**Add New Comment Templates:**
```typescript
await db.insert(commentTemplates).values({
  content: 'Your comment here!',
  sentiment: 'positive',
  isActive: true,
  usageCount: 0,
});
```

**Manually Trigger Stream Announcement:**
```typescript
import { bootstrapService } from './services/bootstrap-service';

await bootstrapService.announceStream(
  streamId,
  'Username',
  'Stream Title'
);
```

## 🔧 Configuration

### Default Settings

```typescript
{
  isEnabled: true,
  autoPostingEnabled: true,
  autoCommentsEnabled: true,
  streamAnnouncementsEnabled: true,
  minPostIntervalMinutes: 30,
  maxPostIntervalMinutes: 180,
  commentProbability: 0.15, // 15% chance
  maxCommentsPerPost: 2,
}
```

### Posting Frequencies

- **DailyClips**: Every 45 minutes
- **astruXo Explorer**: Every 60 minutes (1 hour)
- **Tech Moments**: Every 75 minutes (1.25 hours)
- **Historia Viva**: Every 90 minutes (1.5 hours) 🆕
- **Mente Libre**: Every 105 minutes (1.75 hours) 🆕
- **Stream Announcer**: Event-driven (when streams start)

**Note:** Posts alternate approximately every 30-45 minutes across all bots.

## 📈 Expected Activity

With default settings:
- **~24-28 posts per day** from content creator bots (alternating every 30-45 minutes)
- **~3-5 comments per day** on recent posts (15% probability)
- **Stream announcements** whenever users go live
- **3 permanent 24/7 livestreams** always active
- **Bilingual content** - English and Spanish posts for diverse audience 🆕

## ⚠️ Important Notes

### Transparency
- All bot accounts have "Automated Content" or "Automated Bot" in their bio
- Easy to identify as system-managed accounts
- Clear distinction from real users

### Performance
- Minimal server impact (checks every 5-10 minutes)
- Efficient database queries with indexes
- Automatic cleanup of old activity logs

### Scalability
- Designed to be disabled once community grows
- Can adjust frequencies and probabilities
- Easy to add more bots or templates

### Data Integrity
- All actions logged in `activity_log` table
- Success/failure tracking for monitoring
- Template usage tracking prevents repetition

## 🎉 Benefits

1. **No Empty Platform** - Always has fresh content
2. **Engagement Starter** - Comments encourage real users to participate
3. **Stream Visibility** - Announcements promote live streams
4. **24/7 Activity** - Permanent livestream channels
5. **Easy Management** - Admin panel for full control
6. **Transparent** - Clear bot identification
7. **Scalable** - Disable when no longer needed

## 🔮 Future Enhancements

Potential improvements:
- AI-generated content using GPT
- Time-based posting (peak hours)
- Trending topic integration
- User interaction analysis
- Dynamic frequency adjustment
- Multi-language support
- Custom bot personalities

## 📝 Maintenance

### Regular Tasks
- Monitor success rates in admin panel
- Add new content templates periodically
- Adjust settings based on real user activity
- Review activity logs for issues

### When to Disable
- Real user posts exceed 50+ per day
- Active community engagement is consistent
- Platform has critical mass of users
- Bot content becomes redundant

## 🆘 Troubleshooting

**Bots not posting?**
- Check "System Enabled" toggle in admin panel
- Verify bot accounts exist in database
- Check server logs for errors
- Ensure content templates are active

**Too much bot activity?**
- Increase posting frequency intervals
- Reduce comment probability
- Disable specific features (comments, announcements)

**Not enough variety?**
- Add more content templates
- Add more comment templates
- Check template usage counts

**System errors?**
- Check activity log for failed actions
- Review server logs for stack traces
- Verify database schema is up to date

## 📚 Related Documentation

- [Database Schema](src/server/db/schema.ts)
- [Bootstrap Service](src/server/services/bootstrap-service.ts)
- [Setup Scripts](scripts/)
- [Admin Panel](src/components/BootstrapControlPanel.tsx)

---

**Built with ❤️ for astruXo - Making platforms feel alive from day one!**
