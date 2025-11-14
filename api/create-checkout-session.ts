import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, priceId } = req.body;

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

    res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
