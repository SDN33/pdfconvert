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
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    // En développement, afficher une alerte et simuler le succès
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      alert(`🧪 MODE DÉVELOPPEMENT\n\n✅ En production, l'utilisateur serait redirigé vers Stripe pour payer 2,99€.\n\n📧 Email: ${email || 'non fourni'}\n\nPour tester:\n1. Déployez sur Vercel\n2. Utilisez la carte test: 4242 4242 4242 4242\n3. Vous serez redirigé vers /setup-password`);
      
      // Simuler un succès en redirigeant vers /setup-password avec un faux session_id
      console.log('Mode dev: simulation du flow de paiement');
      // Ne pas rediriger pour éviter de casser le flow
      return;
    }

    // En production, créer une session via l'API backend
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Error creating checkout session:', data.error);
      throw new Error(data.error);
    }

    // Rediriger vers la session de paiement
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
