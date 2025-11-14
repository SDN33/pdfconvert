import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

export async function redirectToCheckout(email?: string) {
  try {
    // Créer une session de paiement via l'API backend
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        priceId: 'price_1STW1z1hBWMOXJEVjsamoo6b',
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Error creating checkout session:', data.error);
      throw new Error(data.error);
    }

    // Rediriger directement vers l'URL de la session Stripe
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // Utiliser la nouvelle méthode recommandée
    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (result.error) {
      console.error('Error redirecting to checkout:', result.error);
      throw result.error;
    }
  } catch (error) {
    console.error('Error in redirectToCheckout:', error);
    throw error;
  }
}
