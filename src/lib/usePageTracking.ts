/**
 * Google Analytics Page Tracking Hook
 * Tracks page views automatically on route changes
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-ER6QWJSEL0', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);
}

/**
 * Track custom events
 * @param eventName - Name of the event (e.g., 'button_click', 'video_play')
 * @param eventParams - Additional parameters for the event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Track user properties
 * @param userId - User ID
 * @param properties - User properties
 */
export function setUserProperties(
  userId: string,
  properties?: Record<string, any>
) {
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'G-ER6QWJSEL0', {
      user_id: userId,
      ...properties,
    });
  }
}
