/**
 * Update Prompt Component
 * Shows a banner when a new version of the app is available
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for service worker updates
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check for updates every 30 seconds
      const interval = setInterval(() => {
        reg.update();
      }, 30000);

      return () => clearInterval(interval);
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('🔄 New version available:', event.data.version);
        setShowUpdate(true);
      }
    });

    // Check for waiting service worker on load
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        console.log('🔄 Update waiting to be activated');
        setShowUpdate(true);
      }
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 New service worker activated, reloading...');
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Just reload if no waiting worker
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary to-purple-600 text-white shadow-2xl"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-semibold text-sm">New version available!</p>
                <p className="text-xs opacity-90">Update now to get the latest features and fixes.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUpdate}
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                Update Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowUpdate(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
