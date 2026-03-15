/**
 * PWA Install Prompt Component
 * Smart detection and installation for Android and iOS
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect iOS (iPhone/iPod)
const isIOS = () => {
  return /iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect iPadOS (including newer iPads that identify as Mac)
const isIPadOS = () => {
  // Check explicit iPad user agent
  if (/iPad/.test(navigator.userAgent)) {
    return true;
  }
  
  // Modern iPads (iPadOS 13+) identify as Mac
  // Check for Mac user agent + touch support + not a real Mac
  const isMacUA = /Macintosh/.test(navigator.userAgent);
  const hasTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
  
  return isMacUA && hasTouchPoints;
};

// Detect if app is installed
const isAppInstalled = () => {
  // Check if running in standalone mode (Android/Desktop)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check iOS/iPadOS standalone mode
  if ((navigator as any).standalone === true) {
    return true;
  }
  
  // Additional check for installed PWA
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  return false;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showIPadModal, setShowIPadModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    // Check if user permanently dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'permanent') {
      return;
    }

    // For iOS/iPadOS, show button immediately
    if (isIOS() || isIPadOS()) {
      setShowButton(true);
      return;
    }

    // For Android/Desktop, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setShowButton(false);
      localStorage.setItem('pwa-install-dismissed', 'permanent');
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    // iPadOS - Show iPad-specific modal
    if (isIPadOS()) {
      setShowIPadModal(true);
      return;
    }

    // iOS (iPhone/iPod) - Show iPhone modal
    if (isIOS()) {
      setShowIOSModal(true);
      return;
    }

    // Android/Desktop - Trigger native prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowButton(false);
        localStorage.setItem('pwa-install-dismissed', 'permanent');
      }

      setDeferredPrompt(null);
    }
  };

  // Don't show anything if installed
  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <>
      {/* Prominent Download Button */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <Button
          onClick={handleInstallClick}
          size="lg"
          className="gap-2 shadow-2xl hover:shadow-[0_20px_50px_rgba(147,51,234,0.4)] transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-2 border-primary-foreground/10 backdrop-blur-sm"
        >
          <Download className="h-5 w-5" />
          Download astruXo
        </Button>
      </div>

      {/* iOS (iPhone) Installation Instructions Modal */}
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src="/logo.png?v=20260308-1734" alt="astruXo" className="h-8 w-8 rounded-lg" />
              Install astruXo on iPhone
            </DialogTitle>
            <DialogDescription>
              Follow these steps to add astruXo to your home screen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Tap the Share icon
                  <Share className="h-5 w-5 text-primary" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  Look for the share button at the <strong>bottom</strong> of your Safari browser
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Tap "Add to Home Screen"
                  <Plus className="h-5 w-5 text-primary" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  Scroll down in the share menu and select "Add to Home Screen"
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Tap "Add"</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm by tapping "Add" in the top right corner
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowIOSModal(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* iPadOS Installation Instructions Modal */}
      <Dialog open={showIPadModal} onOpenChange={setShowIPadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src="/logo.png?v=20260308-1734" alt="astruXo" className="h-8 w-8 rounded-lg" />
              Install astruXo on iPad
            </DialogTitle>
            <DialogDescription>
              Follow these steps to add astruXo to your home screen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1 - iPad specific */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Tap the Share icon
                  <Share className="h-5 w-5 text-primary" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  Look for the share button in the <strong>top right corner</strong> of your Safari toolbar (next to the address bar)
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Tap "Add to Home Screen"
                  <Plus className="h-5 w-5 text-primary" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  In the share menu, scroll down and select "Add to Home Screen"
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Tap "Add"</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm by tapping "Add" in the top right corner of the dialog
                </p>
              </div>
            </div>

            {/* iPad-specific note */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> On iPad, the Share button is located in the top toolbar, not at the bottom like on iPhone.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowIPadModal(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
