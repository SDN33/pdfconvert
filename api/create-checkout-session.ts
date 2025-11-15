import Stripe from 'stripe';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Validation des inputs
const checkoutSchema = z.object({
  email: z.string().email('Email invalide').max(255).optional(),
  priceId: z.string().startsWith('price_', 'Price ID invalide').max(100),
});

// Liste blanche des prix autorisés (à configurer selon vos prix réels)
const ALLOWED_PRICE_IDS = [
  'price_1STW1z1hBWMOXJEVjsamoo6b', // Prix principal (2,99€ lifetime)
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
        details: validationResult.error.issues[0].message 
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
      customer_email: email || undefined, // Stripe collectera l'email si non fourni
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
    console.error('❌ Error creating checkout session:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Fournir plus de détails pour le débogage
    let errorMessage = 'Erreur lors de la création de la session';
    let statusCode = 500;
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('❌ Stripe authentication failed - check STRIPE_SECRET_KEY');
      errorMessage = 'Configuration Stripe invalide';
      statusCode = 500;
    } else if (error.type === 'StripeInvalidRequestError') {
      console.error('❌ Invalid Stripe request:', error.message);
      errorMessage = 'Requête invalide vers Stripe';
      statusCode = 400;
    } else if (error.message?.includes('No such price')) {
      console.error('❌ Invalid price ID:', req.body.priceId);
      errorMessage = 'Prix Stripe invalide';
      statusCode = 400;
    } else if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not set');
      errorMessage = 'Configuration serveur manquante';
      statusCode = 500;
    }
    
    // En développement, renvoyer plus de détails
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(statusCode).json({ 
      error: errorMessage,
      ...(isDev && { details: error.message, type: error.type })
    });
  }
}
