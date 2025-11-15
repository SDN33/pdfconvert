import Stripe from 'stripe';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Validation des inputs
const checkoutSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  priceId: z.string().startsWith('price_', 'Price ID invalide').max(100),
});

// Liste blanche des prix autorisés (à configurer selon vos prix réels)
const ALLOWED_PRICE_IDS = [
  process.env.STRIPE_PRICE_ID_LIFETIME || 'price_1QULQEP7W0mQAYPWdxPNYKoV',
];

// Rate limiting: 10 requêtes par minute par IP
const ratelimit = process.env.UPSTASH_REDIS_REST_URL ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
}) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    if (ratelimit) {
      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', reset.toString());
      
      if (!success) {
        return res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' });
      }
    }

    // Validation des inputs
    const validationResult = checkoutSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: validationResult.error.errors[0].message 
      });
    }

    const { email, priceId } = validationResult.data;

    // Vérifier que le priceId est dans la liste blanche
    if (!ALLOWED_PRICE_IDS.includes(priceId)) {
      return res.status(400).json({ error: 'Prix non autorisé' });
    }

    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/setup-password?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}`,
      customer_email: email,
      locale: 'fr',
      metadata: {
        email: email || 'no-email-provided',
      },
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    // Ne pas exposer les détails d'erreur en production
    res.status(500).json({ error: 'Erreur lors de la création de la session' });
  }
}
