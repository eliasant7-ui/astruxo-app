/**
 * Help & Tutorial Page
 * Guide for new users on how to use the platform
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  MessageCircle,
  Gift,
  DollarSign,
  Radio,
  Eye,
  Coins,
  TrendingUp,
  Users,
  Play,
} from 'lucide-react';

export default function HelpPage() {
  return (
    <>
      <title>Help & Tutorial - LiveStream Platform</title>
      <meta name="description" content="Learn how to use the LiveStream platform" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">How to Use LiveStream Platform</h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know to start streaming and earning
            </p>
          </div>

          {/* Getting Started */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-6 w-6" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Create an Account</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Login" in the header and register with your email and password. Choose a unique username that will be visible to viewers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Set Up Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Click on your avatar in the header to access your profile. Add a display name, bio, and profile picture to make your channel more appealing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Grant Camera & Microphone Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Before going live, your browser will ask for camera and microphone permissions. Make sure to allow these for streaming to work.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* For Streamers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-6 w-6" />
                For Streamers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Going Live</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
                  <li>Click the "Go Live" button in the header</li>
                  <li>Enter a catchy title and description for your stream</li>
                  <li>Click "Start Streaming" to begin broadcasting</li>
                  <li>Your camera and microphone will activate automatically</li>
                  <li>Share your stream link with viewers</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Interacting with Chat</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  While broadcasting, you'll see a live chat panel on the right side. You can send messages to your viewers and see their messages in real-time. Your messages will have a special "HOST" badge.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Monitoring Your Stream</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Track your stream's performance with real-time stats: current viewers, peak viewers, and stream duration. These appear in the stats panel during your broadcast.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Earning Money</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Viewers can send you virtual gifts during your stream. Each gift has a coin value, and you earn $0.01 USD per coin. Check your earnings dashboard to see your total revenue and gift history.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* For Viewers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-6 w-6" />
                For Viewers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Watching Streams</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Browse live streams on the homepage. Click on any stream to start watching. You can chat with other viewers and the host in real-time.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Chatting</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Type your message in the chat box at the bottom of the chat panel and press Enter or click Send. Your messages appear instantly for everyone watching the stream.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Sending Gifts</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
                  <li>Click the "Send a Gift" button below the chat</li>
                  <li>Browse the gift catalog (16 gifts across 4 tiers)</li>
                  <li>Select a gift you can afford with your coin balance</li>
                  <li>Optionally add a personal message</li>
                  <li>Click "Send Gift" to deliver it to the streamer</li>
                  <li>Watch the animated gift appear on screen!</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Buying Coins</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Purchase coins to send gifts to your favorite streamers. Click "Buy Coins" in the gift selector or visit the Buy Coins page. Choose from 5 packages ranging from $0.99 to $49.99, with bonus coins on larger purchases.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gift Tiers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                Gift Tiers & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <Badge variant="secondary" className="mb-2">Tier 1</Badge>
                  <h3 className="font-semibold mb-1">Basic Gifts</h3>
                  <p className="text-sm text-muted-foreground mb-2">1-10 coins</p>
                  <p className="text-xs text-muted-foreground">Heart, Thumbs Up, Star, Fire</p>
                </div>

                <div className="border rounded-lg p-4">
                  <Badge className="mb-2 bg-yellow-500">Tier 2</Badge>
                  <h3 className="font-semibold mb-1">Premium Gifts</h3>
                  <p className="text-sm text-muted-foreground mb-2">25-50 coins</p>
                  <p className="text-xs text-muted-foreground">Rose, Trophy, Crown, Diamond</p>
                </div>

                <div className="border rounded-lg p-4">
                  <Badge className="mb-2 bg-blue-500">Tier 3</Badge>
                  <h3 className="font-semibold mb-1">Luxury Gifts</h3>
                  <p className="text-sm text-muted-foreground mb-2">100-500 coins</p>
                  <p className="text-xs text-muted-foreground">Rocket, Gift Box, Sparkles, Party Popper</p>
                </div>

                <div className="border rounded-lg p-4">
                  <Badge className="mb-2 bg-purple-500">Tier 4</Badge>
                  <h3 className="font-semibold mb-1">Epic Gifts</h3>
                  <p className="text-sm text-muted-foreground mb-2">1000-5000 coins</p>
                  <p className="text-xs text-muted-foreground">Lightning, Fireworks, Golden Crown, Mega Star</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Tips & Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">For Streamers:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Stream regularly to build an audience</li>
                    <li>Engage with your chat - respond to messages</li>
                    <li>Thank viewers for gifts by name</li>
                    <li>Use good lighting and a stable internet connection</li>
                    <li>Create interesting titles and descriptions</li>
                    <li>Promote your streams on social media</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">For Viewers:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Be respectful in chat</li>
                    <li>Support your favorite streamers with gifts</li>
                    <li>Follow streamers to get notified when they go live</li>
                    <li>Participate in chat to make streams more fun</li>
                    <li>Share streams you enjoy with friends</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
