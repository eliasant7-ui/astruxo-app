import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { siteVisits, users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../middleware/auth.js';

/**
 * Get country from IP address using ip-api.com (free, no key required)
 */
async function getCountryFromIP(ip: string | null): Promise<{ country: string | null; countryCode: string | null }> {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: null, countryCode: null };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country || null,
          countryCode: data.countryCode || null,
        };
      }
    }
  } catch (error) {
    console.debug('Failed to get country from IP:', error);
  }

  return { country: null, countryCode: null };
}

/**
 * POST /api/analytics/track-visit
 * Track a page visit (anonymous or authenticated)
 */
export default async function handler(req: Request, res: Response) {
  try {
    // Get user if authenticated (optional)
    let userId: number | null = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyFirebaseToken(idToken);
        if (decodedToken) {
          const [user] = await db.select().from(users).where(eq(users.firebaseUid, decodedToken.uid)).limit(1);
          if (user) {
            userId = user.id;
          }
        }
      } catch (error) {
        // Ignore auth errors for tracking - allow anonymous tracking
        console.debug('Auth failed for visit tracking, tracking as anonymous');
      }
    }

    const { page, sessionId } = req.body;

    if (!page || !sessionId) {
      return res.status(400).json({ error: 'Page and sessionId are required' });
    }

    // Get IP address
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : null) || 
                      req.socket.remoteAddress || 
                      null;

    // Get user agent
    const userAgent = req.headers['user-agent'] || null;

    // Get referrer
    const referer = req.headers['referer'] || req.headers['referrer'];
    const referrer = (typeof referer === 'string' ? referer : null);

    // Get country from IP (async, don't block the response)
    const { country, countryCode } = await getCountryFromIP(ipAddress);

    // Insert visit record
    await db.insert(siteVisits).values({
      page,
      userId: userId || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      referrer: referrer || undefined,
      sessionId,
      country: country || undefined,
      countryCode: countryCode || undefined,
    });

    console.log('✅ Visit tracked:', { page, userId, sessionId, ipAddress, country, countryCode });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
}
