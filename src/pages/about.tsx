/**
 * About Us Page
 * Public page with information about the platform
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Info, Heart, Users, Zap, Shield, Globe, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <title>About Us - astruXo</title>
      <meta
        name="description"
        content="Learn about astruXo - our mission, values, and the team behind the platform."
      />

      {/* Back Button */}
      <Link to="/">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Info className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">About astruXo</h1>
        <p className="text-xl text-muted-foreground">
          Connecting creators and communities through live streaming
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Owned and operated by <strong>Santana Enterprises LLC</strong>
        </p>
      </div>

      {/* Mission Statement */}
      <Card className="mb-8 bg-primary/5">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed text-center text-lg">
            To empower creators worldwide by providing a platform where they can share their
            passion, connect with their audience, and build thriving communities through live
            streaming and social interaction.
          </p>
        </CardContent>
      </Card>

      {/* What We Do */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">What We Do</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Live Streaming
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                High-quality live streaming powered by Agora technology. Share your content in real
                time with viewers around the world in stunning HD quality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Social Features
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Build your community with posts, comments, likes, and follows. Share moments,
                engage with fans, and grow your audience beyond live streams.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Monetization
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Turn your passion into income with virtual gifts, tips, and subscriptions. We
                provide the tools you need to earn from your content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Safe Community
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                A safe, respectful environment with robust moderation tools. We're committed to
                keeping our platform positive and welcoming for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Our Values */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Our Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We constantly evolve and improve our platform with cutting-edge technology and
                features that empower creators.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Community First</h3>
              <p className="text-muted-foreground">
                Our users are at the heart of everything we do. We listen to feedback and build
                features that matter to our community.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Trust & Safety</h3>
              <p className="text-muted-foreground">
                We prioritize the safety and privacy of our users with robust security measures and
                clear community guidelines.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Inclusivity</h3>
              <p className="text-muted-foreground">
                We celebrate diversity and create a welcoming space for creators and viewers from
                all backgrounds and cultures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Stats */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Platform Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">HD</div>
              <p className="text-sm text-muted-foreground">Quality Streaming</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">Platform Availability</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">16</div>
              <p className="text-sm text-muted-foreground">Virtual Gifts</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <p className="text-sm text-muted-foreground">Possibilities</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Built with Modern Technology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            LiveStream Platform is built using cutting-edge technologies to ensure the best
            experience for our users:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Frontend</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>React 19 for modern UI</li>
                <li>TypeScript for type safety</li>
                <li>Tailwind CSS for beautiful design</li>
                <li>Vite for lightning-fast development</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Backend</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Node.js & Express for APIs</li>
                <li>MySQL for reliable data storage</li>
                <li>Socket.IO for real-time chat</li>
                <li>Agora for HD video streaming</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join Us */}
      <Card className="bg-primary/5">
        <CardContent className="pt-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Whether you're a creator looking to share your passion or a viewer seeking great
            content, LiveStream Platform is the place for you. Join thousands of users who are
            already part of our growing community.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/streams">
              <Button size="lg" variant="outline">
                Explore Streams
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
        <p className="text-muted-foreground mb-4">
          Have questions or feedback? We'd love to hear from you!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
          <a
            href="mailto:info@astruXo.net"
            className="text-primary hover:underline"
          >
            info@astruXo.net
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>© 2026 LiveStream Platform. All rights reserved.</p>
        <p className="mt-2">Made with ❤️ for creators and communities worldwide.</p>
      </div>
    </div>
  );
}
