// Exemple de fonction serverless Vercel pour gérer les webhooks Stripe
// À placer dans /api/webhook.ts si vous voulez gérer automatiquement les paiements

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service role, pas la clé anon
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Gérer l'événement de paiement réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Créer l'utilisateur premium dans Supabase
    const { error } = await supabase.from('premium_users').insert([
      {
        email: session.customer_email,
        stripe_customer_id: session.customer as string,
        subscription_status: 'active',
        is_lifetime: true,
        purchased_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error creating premium user:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // TODO: Envoyer un email de confirmation
    console.log('Premium user created:', session.customer_email);
  }

  return res.status(200).json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
