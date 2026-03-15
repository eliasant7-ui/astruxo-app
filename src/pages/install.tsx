/**
 * Install Instructions Page
 * Guide users on how to install astruXo as a PWA
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Smartphone, Monitor } from 'lucide-react';

export default function InstallPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <title>Install astruXo - Get the App</title>
      <meta
        name="description"
        content="Install astruXo on your device for the best experience. Works on iOS, Android, and Desktop."
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
          <Download className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Install astruXo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get the full app experience on your device. No app store required!
        </p>
      </div>

      {/* Benefits */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>Why Install?</CardTitle>
          <CardDescription>Get these benefits with the installed app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Works Offline</h3>
                <p className="text-sm text-muted-foreground">
                  Access your content even without internet
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Faster Loading</h3>
                <p className="text-sm text-muted-foreground">
                  Instant access with cached resources
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Home Screen Access</h3>
                <p className="text-sm text-muted-foreground">
                  Launch directly from your home screen
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Native Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Feels like a native app, no browser UI
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <div className="space-y-6">
        {/* iOS */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>iOS (iPhone/iPad)</CardTitle>
                <CardDescription>Install on Safari</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  1
                </span>
                <span>Open astruXo.net in <strong>Safari</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  2
                </span>
                <span>Tap the <strong>Share</strong> button (square with arrow)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  3
                </span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  4
                </span>
                <span>Tap <strong>"Add"</strong> in the top right corner</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  5
                </span>
                <span>The astruXo icon will appear on your home screen!</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Android */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Android</CardTitle>
                <CardDescription>Install on Chrome</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  1
                </span>
                <span>Open astruXo.net in <strong>Chrome</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  2
                </span>
                <span>Tap the <strong>three dots</strong> menu (⋮) in the top right</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  3
                </span>
                <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  4
                </span>
                <span>Tap <strong>"Install"</strong> in the popup</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  5
                </span>
                <span>The astruXo app will be installed on your device!</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Desktop */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Desktop (Windows/Mac/Linux)</CardTitle>
                <CardDescription>Install on Chrome, Edge, or Brave</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  1
                </span>
                <span>Open astruXo.net in <strong>Chrome, Edge, or Brave</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  2
                </span>
                <span>Look for the <strong>install icon</strong> (⊕) in the address bar</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  3
                </span>
                <span>Click the icon and select <strong>"Install"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  4
                </span>
                <span>The app will open in its own window!</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="glass-card inline-block">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Already installed? Launch the app from your home screen or app drawer.
            </p>
            <Link to="/">
              <Button size="lg">
                Go to Feed
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
