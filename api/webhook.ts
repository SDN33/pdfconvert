// Fonction serverless Vercel pour gérer les webhooks Stripe
// Automatise la création d'utilisateurs premium dans Supabase après paiement

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service role pour écrire dans premium_users
);

export const config = {
  api: {
    bodyParser: false, // Important : désactiver le bodyParser pour Stripe
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const buf = await buffer(req);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
  }

  console.log('Webhook event received:', event.type);

  // Gérer l'événement de paiement réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (!session.customer_email) {
      console.error('No customer email in session');
      return res.status(400).json({ error: 'No customer email' });
    }

    console.log('Processing payment for:', session.customer_email);

    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('premium_users')
        .select('*')
        .eq('email', session.customer_email)
        .single();

      if (existingUser) {
        console.log('User already exists, updating...');
        
        // Mettre à jour l'utilisateur existant
        const { error: updateError } = await supabase
          .from('premium_users')
          .update({
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            is_lifetime: true,
            updated_at: new Date().toISOString(),
          })
          .eq('email', session.customer_email);

        if (updateError) {
          console.error('Error updating premium user:', updateError);
          return res.status(500).json({ error: 'Database update error' });
        }
      } else {
        console.log('Creating new premium user WITHOUT password...');
        
        // Créer un nouvel utilisateur premium SANS mot de passe
        // L'utilisateur devra le créer après via /setup-password
        const { error: insertError } = await supabase
          .from('premium_users')
          .insert([
            {
              email: session.customer_email,
              stripe_customer_id: session.customer as string,
              subscription_status: 'active',
              is_lifetime: true,
              password_hash: null, // Pas de mot de passe initialement
              purchased_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Error creating premium user:', insertError);
          return res.status(500).json({ error: 'Database insert error' });
        }
      }

      console.log('Premium user processed successfully:', session.customer_email);

      // TODO: Envoyer un email de bienvenue avec lien vers /setup-password
      // await sendWelcomeEmail(session.customer_email, session.id);

    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      console.error('Database operation failed:', errorMessage);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Gérer l'événement de remboursement
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    
    if (charge.receipt_email) {
      console.log('Processing refund for:', charge.receipt_email);
      
      const { error } = await supabase
        .from('premium_users')
        .update({
          subscription_status: 'refunded',
          is_lifetime: false,
          updated_at: new Date().toISOString(),
        })
        .eq('email', charge.receipt_email);

      if (error) {
        console.error('Error updating refunded user:', error);
      }
    }
  }

  return res.status(200).json({ received: true });
}
