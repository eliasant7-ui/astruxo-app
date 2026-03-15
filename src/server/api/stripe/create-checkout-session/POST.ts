/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe Checkout session for coin purchase
 */
import 'dotenv/config';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { verifyIdToken } from '@/server/services/firebase';
import { db } from '../../../db/client.js';
import { users } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || typeof stripeSecretKey !== 'string') {
  throw new Error('STRIPE_SECRET_KEY not configured');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-02-25.clover',
});

// Coin packages with prices in cents (USD)
const COIN_PACKAGES = {
  '100': { coins: 100, price: 99, name: '100 Coins' },
  '500': { coins: 500, price: 499, bonus: 50, name: '500 Coins + 50 Bonus' },
  '1000': { coins: 1000, price: 999, bonus: 150, name: '1,000 Coins + 150 Bonus' },
  '2500': { coins: 2500, price: 2499, bonus: 500, name: '2,500 Coins + 500 Bonus' },
  '5000': { coins: 5000, price: 4999, bonus: 1500, name: '5,000 Coins + 1,500 Bonus' },
};

export default async function handler(req: Request, res: Response) {
  console.log('🎯 Create Stripe checkout session handler called');

  try {
    // Authenticate user
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Load user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
    }

    const user = userResult[0];
    console.log('✅ User authenticated:', user.username);

    // Get package from request
    const { packageId } = req.body;

    if (!packageId || !COIN_PACKAGES[packageId as keyof typeof COIN_PACKAGES]) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid package ID',
      });
    }

    const pkg = COIN_PACKAGES[packageId as keyof typeof COIN_PACKAGES];
    const totalCoins = pkg.coins + ('bonus' in pkg ? pkg.bonus : 0);

    console.log(`💰 Creating checkout session for ${pkg.name} ($${pkg.price / 100})`);

    // Get the base URL for redirects
    const baseUrl = req.headers.origin || 'http://localhost:5173';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: `Get ${totalCoins} coins for your account`,
              images: ['https://via.placeholder.com/300x300.png?text=Coins'],
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/buy-coins?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/buy-coins?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        packageId: packageId,
        coins: totalCoins.toString(),
      },
      customer_email: decodedToken.email || undefined,
    });

    console.log('✅ Stripe checkout session created:', session.id);

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Create checkout session error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create checkout session',
    });
  }
}
