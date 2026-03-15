/**
 * GET /api/stripe/webhook-test
 * Test endpoint to verify webhook configuration
 */
import 'dotenv/config';
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_SECRET_KEY;

    const config = {
      stripeConfigured: !!stripeSecretKey,
      webhookSecretConfigured: !!webhookSecret,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/stripe/webhook`,
      instructions: {
        step1: 'Go to Stripe Dashboard → Developers → Webhooks',
        step2: 'Add endpoint with the URL above',
        step3: 'Select event: checkout.session.completed',
        step4: 'Copy the webhook signing secret',
        step5: 'Add STRIPE_WEBHOOK_SECRET to your secrets',
      },
    };

    res.json(config);
  } catch (error) {
    console.error('Error checking webhook config:', error);
    res.status(500).json({ error: 'Failed to check webhook configuration' });
  }
}
