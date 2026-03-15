/**
 * GET /api/health/secrets
 * Check if secrets are configured (for debugging)
 */

import type { Request, Response } from 'express';
import { getSecret } from '#airo/secrets';

export default async function handler(req: Request, res: Response) {
  try {
    const secrets = {
      FIREBASE_PROJECT_ID: !!getSecret('FIREBASE_PROJECT_ID'),
      FIREBASE_PRIVATE_KEY: !!getSecret('FIREBASE_PRIVATE_KEY'),
      FIREBASE_CLIENT_EMAIL: !!getSecret('FIREBASE_CLIENT_EMAIL'),
      AGORA_APP_ID: !!getSecret('AGORA_APP_ID'),
      AGORA_APP_CERTIFICATE: !!getSecret('AGORA_APP_CERTIFICATE'),
    };

    // Check private key format
    const privateKey = getSecret('FIREBASE_PRIVATE_KEY');
    const privateKeyInfo = privateKey
      ? {
          length: String(privateKey).length,
          hasBackslashN: String(privateKey).includes('\\n'),
          hasNewline: String(privateKey).includes('\n'),
          startsWithBegin: String(privateKey).trim().startsWith('-----BEGIN'),
          endsWithEnd: String(privateKey).trim().endsWith('-----'),
        }
      : null;

    return res.json({
      success: true,
      secrets,
      privateKeyInfo,
      message: 'All secrets configured' + (Object.values(secrets).every(Boolean) ? '' : ' (some missing)'),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: String(error),
    });
  }
}
