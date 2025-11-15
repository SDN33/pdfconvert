import Stripe from 'stripe';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Validation du session_id
const sessionSchema = z.object({
  session_id: z.string().startsWith('cs_', 'Session ID invalide').max(500),
});

// Rate limiting: 20 requêtes par minute par IP (plus généreux car vérifié après paiement)
const ratelimit = process.env.UPSTASH_REDIS_REST_URL ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
}) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
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
    const validationResult = sessionSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Session ID invalide',
        details: validationResult.error.errors[0].message 
      });
    }

    const { session_id } = validationResult.data;

    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Retourner l'email du client
    res.status(200).json({
      email: session.customer_email || session.customer_details?.email,
      customerId: session.customer,
      paid: session.payment_status === 'paid',
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    // Ne pas exposer les détails d'erreur en production
    res.status(500).json({ error: 'Erreur lors de la vérification de la session' });
  }
}
