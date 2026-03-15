import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Generate or get session ID
function getSessionId(): string {
  const key = 'astruxo_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/**
 * Hook to track page visits
 * Automatically tracks route changes
 */
export function useVisitTracking() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const sessionId = getSessionId();
        
        console.log('📊 Tracking visit:', { page: location.pathname, sessionId });
        
        const response = await fetch('/api/analytics/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: location.pathname,
            sessionId,
          }),
        });
        
        if (response.ok) {
          console.log('✅ Visit tracked successfully');
        } else {
          console.warn('⚠️ Visit tracking failed:', response.status);
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('❌ Visit tracking error:', error);
      }
    };

    trackVisit();
  }, [location.pathname]);
}
