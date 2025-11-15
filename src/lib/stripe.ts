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
    console.log('🛒 Démarrage du processus de paiement...');
    console.log('📧 Email:', email || 'non fourni');
    console.log('🔑 Stripe Public Key:', stripePublicKey ? 'Configurée ✓' : 'MANQUANTE ✗');
    
    const stripe = await getStripe();
    if (!stripe) {
      console.error('❌ Stripe n\'a pas pu être chargé');
      throw new Error('Stripe failed to load');
    }

    // En développement, afficher une alerte et simuler le succès
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      console.warn('⚠️ MODE DÉVELOPPEMENT : Simulation du paiement');
      alert(`🧪 MODE DÉVELOPPEMENT\n\n✅ En production, l'utilisateur serait redirigé vers Stripe pour payer 2,99€.\n\n📧 Email: ${email || 'non fourni'}\n\nPour tester:\n1. Déployez sur Vercel\n2. Utilisez la carte test: 4242 4242 4242 4242\n3. Vous serez redirigé vers /setup-password`);
      
      // Simuler un succès en redirigeant vers /setup-password avec un faux session_id
      console.log('Mode dev: simulation du flow de paiement');
      // Ne pas rediriger pour éviter de casser le flow
      return;
    }

    console.log('🌐 Appel de l\'API pour créer la session de paiement...');
    
    // En production, créer une session via l'API backend
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_1STW1z1hBWMOXJEVjsamoo6b',
      }),
    });

    console.log('📡 Réponse API:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, errorText);
      throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 Données reçues:', data);

    if (data.error) {
      console.error('❌ Erreur dans la réponse:', data.error);
      throw new Error(data.error);
    }

    if (!data.sessionId) {
      console.error('❌ Session ID manquant dans la réponse');
      throw new Error('Session ID manquant');
    }

    console.log('✅ Session créée:', data.sessionId);
    console.log('🔄 Redirection vers Stripe Checkout...');

    // Rediriger vers la session de paiement
    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (result.error) {
      console.error('❌ Erreur lors de la redirection:', result.error);
      throw result.error;
    }
  } catch (error: any) {
    console.error('💥 Erreur dans redirectToCheckout:', error);
    console.error('Type d\'erreur:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Message d'erreur plus détaillé pour l'utilisateur
    let userMessage = 'Erreur lors de la redirection vers le paiement.';
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      userMessage += ' Vérifiez votre connexion internet.';
    } else if (error.message?.includes('404')) {
      userMessage += ' L\'API de paiement n\'est pas disponible. Assurez-vous que l\'application est déployée sur Vercel.';
    } else if (error.message?.includes('500')) {
      userMessage += ' Erreur serveur. Veuillez réessayer dans quelques instants.';
    } else if (error.message) {
      userMessage += ` Détails: ${error.message}`;
    }
    
    throw new Error(userMessage);
  }
}
