/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events (payment confirmations)
 */
import 'dotenv/config';
import type { Request, Response } from 'express';
import Stripe from 'stripe';

import { db } from '../../../db/client.js';
import { users, coinTransactions } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || typeof stripeSecretKey !== 'string') {
  throw new Error('STRIPE_SECRET_KEY not configured');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-02-25.clover',
});

// Webhook secret for signature verification (optional but recommended)
const webhookSecretRaw = process.env.STRIPE_WEBHOOK_SECRET;
const webhookSecret = typeof webhookSecretRaw === 'string' ? webhookSecretRaw : '';

export default async function handler(req: Request, res: Response) {
  console.log('🎯 Stripe webhook handler called');
  console.log('📦 Request body type:', typeof req.body);
  console.log('📦 Is Buffer:', Buffer.isBuffer(req.body));

  try {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && sig && typeof sig === 'string') {
      try {
        // Get raw body - Express raw middleware provides it as Buffer
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        
        console.log('🔐 Verifying webhook signature...');
        event = stripe.webhooks.constructEvent(
          rawBody,
          sig,
          webhookSecret
        );
        console.log('✅ Webhook signature verified');
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({
          error: 'Webhook Error',
          message: `Webhook signature verification failed: ${err.message}`,
        });
      }
    } else {
      // If no webhook secret, parse the body directly (less secure)
      console.log('⚠️ Processing webhook without signature verification');
      
      // Parse body if it's a Buffer
      if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString()) as Stripe.Event;
      } else {
        event = req.body as Stripe.Event;
      }
    }

    console.log('📨 Webhook event type:', event.type);
    console.log('📨 Event ID:', event.id);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Checkout session completed:', session.id);
        console.log('💳 Payment status:', session.payment_status);

        // Verify payment was successful
        if (session.payment_status !== 'paid') {
          console.log('⚠️ Payment not completed yet, status:', session.payment_status);
          return res.json({ received: true, message: 'Payment not completed' });
        }

        console.log('✅ Payment confirmed as PAID');

        // Extract metadata
        const userId = parseInt(session.metadata?.userId || '0');
        const coins = parseInt(session.metadata?.coins || '0');
        const packageId = session.metadata?.packageId;

        console.log('📦 Metadata:', { userId, coins, packageId });

        if (!userId || !coins) {
          console.error('❌ Missing metadata in session');
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing metadata',
          });
        }

        console.log(`💰 Crediting ${coins} coins to user ${userId}`);

        // Update user's coin balance
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userResult.length === 0) {
          console.error('❌ User not found:', userId);
          return res.status(404).json({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        const currentBalance = userResult[0].coinBalance || 0;
        const newBalance = currentBalance + coins;

        // Update balance
        await db
          .update(users)
          .set({ coinBalance: newBalance })
          .where(eq(users.id, userId));

        console.log(`✅ Updated balance: ${currentBalance} → ${newBalance}`);

        // Record transaction
        const transactionResult = await db.insert(coinTransactions).values({
          userId: userId,
          amount: coins,
          type: 'purchase',
          description: `Purchased ${coins} coins (Package: ${packageId})`,
          stripeSessionId: session.id,
          createdAt: new Date(),
        });

        console.log('✅ Transaction recorded with ID:', transactionResult[0]?.insertId);
        console.log('🎉 Coin purchase completed successfully!');
        console.log('📊 Final state:', {
          userId,
          oldBalance: currentBalance,
          newBalance,
          coinsAdded: coins,
          packageId,
          sessionId: session.id,
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process webhook',
    });
  }
}
