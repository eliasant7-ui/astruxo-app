/**
 * Real-Time Session Tracking Hook
 * Tracks user sessions and sends data to analytics
 */

import { useEffect, useRef } from 'react';
import { useAuth } from './auth-context';

// Generate unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

// Get device type
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Get geolocation data (using IP-based service)
async function getGeolocation(): Promise<{ country: string; city: string }> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
    };
  } catch (error) {
    console.error('Failed to get geolocation:', error);
    return { country: 'Unknown', city: 'Unknown' };
  }
}

export function useSessionTracking() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    // Only track if user is logged in and not already tracking
    if (!user || isTrackingRef.current) return;

    const startSession = async () => {
      isTrackingRef.current = true;
      sessionIdRef.current = generateSessionId();
      sessionStartRef.current = new Date();

      const deviceType = getDeviceType();
      const { country, city } = await getGeolocation();

      console.log('📊 Starting session tracking:', {
        sessionId: sessionIdRef.current,
        deviceType,
        country,
        city,
      });

      // Send session start to backend
      try {
        const token = await user.getIdToken();
        await fetch('/api/analytics/session/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            deviceType,
            country,
            city,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        console.error('Failed to start session tracking:', error);
      }
    };

    const endSession = async () => {
      if (!sessionIdRef.current || !sessionStartRef.current) return;

      const sessionEnd = new Date();
      const durationSeconds = Math.floor(
        (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000
      );

      console.log('📊 Ending session:', {
        sessionId: sessionIdRef.current,
        duration: durationSeconds,
      });

      // Send session end to backend
      try {
        const token = await user.getIdToken();
        await fetch('/api/analytics/session/end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            durationSeconds,
          }),
        });
      } catch (error) {
        console.error('Failed to end session tracking:', error);
      }

      isTrackingRef.current = false;
    };

    // Start tracking
    startSession();

    // End session on page unload
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [user]);
}
