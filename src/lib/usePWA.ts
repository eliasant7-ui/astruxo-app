/**
 * PWA Hook
 * Registers service worker and handles PWA functionality
 */

import { useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    // Check if we already cleaned up
    const cleanupDone = sessionStorage.getItem('pwa_cleanup_done');
    
    if (!cleanupDone && 'serviceWorker' in navigator) {
      console.log('[PWA] 🧹 Starting cleanup process...');
      
      // Mark as done FIRST to prevent loops
      sessionStorage.setItem('pwa_cleanup_done', 'true');
      
      let needsReload = false;
      
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          console.log(`[PWA] Found ${registrations.length} service worker(s), removing...`);
          needsReload = true;
          
          const unregisterPromises = registrations.map((registration) => 
            registration.unregister()
          );
          
          return Promise.all(unregisterPromises);
        }
      }).then(() => {
        // Clear all caches
        if ('caches' in window) {
          return caches.keys().then((cacheNames) => {
            if (cacheNames.length > 0) {
              console.log(`[PWA] Found ${cacheNames.length} cache(s), deleting...`);
              needsReload = true;
              
              return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
              );
            }
          });
        }
      }).then(() => {
        if (needsReload) {
          console.log('[PWA] ✅ Cleanup complete! Reloading to apply changes...');
          // Wait a moment for cleanup to complete
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          console.log('[PWA] ✅ No cleanup needed');
        }
      }).catch((error) => {
        console.error('[PWA] ❌ Cleanup error:', error);
      });
    } else if (cleanupDone) {
      console.log('[PWA] ✅ Cleanup already done this session');
    }
  }, []);
}
