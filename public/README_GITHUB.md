# 🎥 astruXo - Real-Time Streaming & Social Platform

A complete livestreaming and social media platform built with modern web technologies.

## ✨ Features

### 🎬 Livestreaming
- Real-time video streaming with Agora RTC
- Live chat with Socket.IO
- Virtual gift system
- Stream moderation tools
- Private streams with gift-gated access
- Viewer list and analytics

### 👥 Social Network
- User profiles and avatars
- Social feed with posts
- Comments and nested replies
- Likes and reactions
- Follow system
- User statistics

### 💰 Monetization
- Virtual coins system
- Stripe payment integration
- Gift catalog
- Earnings tracking
- Transaction history

### 🛡️ Moderation
- Assign moderators (up to 3 per stream)
- Delete messages
- Kick/ban users
- Audit trail
- Privacy controls

### 📊 Admin Dashboard
- User management
- Content moderation
- Real-time analytics
- Activity logs

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** MySQL with Drizzle ORM
- **Real-time:** Socket.IO, Agora RTC
- **Auth:** Firebase Authentication
- **Payments:** Stripe
- **UI:** shadcn/ui components

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/eliasant7-ui/Livestream-platform.git
cd Livestream-platform

# Install dependencies
npm install

# Configure environment variables
cp env.example .env
# Edit .env with your credentials

# Setup database
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

## 🔧 Environment Variables

See `env.example` for required environment variables:
- Firebase credentials
- Agora App ID and Certificate
- Stripe API keys
- Database connection string

## 📱 Mobile Support

Fully responsive with:
- Touch-friendly controls
- PWA support
- Safe area insets
- Optimized for iOS and Android

## 🌐 Deployment

Compatible with:
- Vercel
- Netlify
- Railway
- Render
- DigitalOcean
- AWS, Google Cloud, Azure

## 📄 License

All rights reserved.

## 🤝 Contributing

This is a private project. Contact the owner for collaboration opportunities.
