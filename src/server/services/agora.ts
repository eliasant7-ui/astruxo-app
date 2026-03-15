/**
 * Agora RTC Token Service
 * Generates tokens for live streaming
 */

import agoraToken from 'agora-token';
import { getSecret } from '#airo/secrets';

const { RtcTokenBuilder, RtcRole } = agoraToken;

/**
 * Generate Agora RTC token for publisher (streamer)
 */
export function generateAgoraPublisherToken(channelName: string, uid: number): string | null {
  try {
    const appIdRaw = getSecret('AGORA_APP_ID');
    const appCertificateRaw = getSecret('AGORA_APP_CERTIFICATE');

    if (!appIdRaw || !appCertificateRaw) {
      console.error('Agora credentials not configured');
      return null;
    }

    // Ensure secrets are strings
    const appId = typeof appIdRaw === 'string' ? appIdRaw : String(appIdRaw);
    const appCertificate = typeof appCertificateRaw === 'string' ? appCertificateRaw : String(appCertificateRaw);

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return token;
  } catch (error) {
    console.error('Failed to generate publisher token:', error);
    return null;
  }
}

/**
 * Generate Agora RTC token for subscriber (viewer)
 */
export function generateAgoraSubscriberToken(channelName: string, uid: number): string | null {
  try {
    const appIdRaw = getSecret('AGORA_APP_ID');
    const appCertificateRaw = getSecret('AGORA_APP_CERTIFICATE');

    if (!appIdRaw || !appCertificateRaw) {
      console.error('Agora credentials not configured');
      return null;
    }

    // Ensure secrets are strings
    const appId = typeof appIdRaw === 'string' ? appIdRaw : String(appIdRaw);
    const appCertificate = typeof appCertificateRaw === 'string' ? appCertificateRaw : String(appCertificateRaw);

    const role = RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return token;
  } catch (error) {
    console.error('Failed to generate subscriber token:', error);
    return null;
  }
}

/**
 * Get Agora App ID (for frontend)
 */
export function getAgoraAppId(): string | null {
  const appIdRaw = getSecret('AGORA_APP_ID');
  if (!appIdRaw) return null;
  return typeof appIdRaw === 'string' ? appIdRaw : String(appIdRaw);
}
