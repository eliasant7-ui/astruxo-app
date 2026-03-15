/**
 * Referral Tracking Hook
 * Captures and stores referral codes from URL parameters
 */

import { useEffect } from 'react';

const REFERRAL_STORAGE_KEY = 'astruxo_referral_code';

/**
 * Hook to capture referral code from URL and store in localStorage
 * Usage: Add to App.tsx or main layout to capture on any page
 */
export function useReferralTracking() {
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Store referral code in localStorage
      localStorage.setItem(REFERRAL_STORAGE_KEY, refCode.toLowerCase().trim());
      console.log('📎 Referral code captured and stored:', refCode);

      // Optional: Remove ref parameter from URL to clean it up
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
}

/**
 * Get stored referral code from localStorage
 */
export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/**
 * Clear referral code from localStorage (after successful registration)
 */
export function clearReferralCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  console.log('🗑️ Referral code cleared from storage');
}
