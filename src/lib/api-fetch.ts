/**
 * API Fetch Helper
 * Automatically handles token refresh for authenticated requests
 */

import { auth } from './firebase-client';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Fetch wrapper that automatically includes fresh Firebase token
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  // If not authenticated request, just fetch normally
  if (skipAuth) {
    return fetch(url, fetchOptions);
  }

  // Check if Firebase is initialized
  if (!auth) {
    console.error('❌ Firebase auth not initialized');
    throw new Error('Firebase auth not initialized');
  }

  // Get current user
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No authenticated user for API request');
    throw new Error('User not authenticated');
  }

  try {
    // ALWAYS get a fresh token (force refresh)
    console.log('🔄 Getting fresh token for API request...', {
      uid: currentUser.uid,
      email: currentUser.email,
      url: url,
    });
    
    const token = await currentUser.getIdToken(true);
    
    console.log('✅ Fresh token obtained', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
      tokenEnd: '...' + token.substring(token.length - 20),
    });

    // Add Authorization header
    const headers = new Headers(fetchOptions.headers);
    const authHeader = `Bearer ${token}`;
    headers.set('Authorization', authHeader);
    
    console.log('🔐 Authorization header set:', {
      headerLength: authHeader.length,
      headerPreview: authHeader.substring(0, 50) + '...',
    });
    
    // Only set Content-Type if not already set (for FormData)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    console.log('📤 Making authenticated request to:', url, {
      method: fetchOptions.method || 'GET',
      hasAuthHeader: headers.has('Authorization'),
      authHeaderValue: headers.get('Authorization')?.substring(0, 50) + '...',
    });

    // Make request with fresh token
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
    });

    // If unauthorized, log the response body
    if (response.status === 401) {
      const errorData = await response.clone().json();
      console.error('❌ 401 Unauthorized response:', errorData);
    }

    return response;
  } catch (error) {
    console.error('❌ Error in apiFetch:', error);
    throw error;
  }
}
