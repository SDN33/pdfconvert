import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

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
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
