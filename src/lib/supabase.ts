import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface pour le résultat de vérification de conversion
export interface ConversionCheckResult {
  allowed: boolean;
  conversionsUsed: number;
  conversionsLimit: number;
  isPremium: boolean;
  reason?: string;
  message?: string;
}

// Fonction centralisée pour vérifier si une conversion est autorisée
// Tout est géré via la base de données (IP + email)
export async function checkConversionAllowed(
  ipAddress: string, 
  email?: string
): Promise<ConversionCheckResult> {
  try {
    // Utiliser la fonction SQL pour vérifier les conversions
    // Cette fonction gère automatiquement :
    // - Les utilisateurs premium (illimité)
    // - Les comptes gratuits (2/jour par IP)
    // - Les utilisateurs anonymes (2/jour par IP)
    const { data, error } = await supabase
      .rpc('get_remaining_conversions', {
        user_ip: ipAddress,
        user_email: email || null
      });

    if (error) {
      console.error('Error checking conversions:', error);
      // En cas d'erreur, autoriser la conversion par défaut
      return {
        allowed: true,
        conversionsUsed: 0,
        conversionsLimit: 2,
        isPremium: false,
        reason: 'error_fallback'
      };
    }

    const result = data[0];

    // Messages personnalisés selon le type d'utilisateur
    let message = '';
    if (!result.allowed) {
      if (result.reason === 'free_account_limit_reached') {
        message = 'Vous avez atteint votre limite de 2 conversions gratuites par jour. Passez à l\'illimité pour seulement 2,99€ !';
      } else if (result.reason === 'anonymous_limit_reached') {
        message = 'Limite de 2 conversions atteinte. Créez un compte gratuit ou passez à l\'illimité !';
      } else {
        message = 'Limite de conversions atteinte. Passez à la version premium pour un accès illimité !';
      }
    }

    return {
      allowed: result.allowed,
      conversionsUsed: result.conversions_used,
      conversionsLimit: result.conversions_limit,
      isPremium: result.is_premium,
      reason: result.reason,
      message
    };
  } catch (error) {
    console.error('Error in checkConversionAllowed:', error);
    return {
      allowed: true,
      conversionsUsed: 0,
      conversionsLimit: 2,
      isPremium: false,
      reason: 'error_fallback'
    };
  }
}

// Ancienne fonction pour compatibilité (déprécié)
export async function canConvert(ipAddress: string): Promise<{ allowed: boolean; conversionsToday: number; message?: string }> {
  const result = await checkConversionAllowed(ipAddress);
  return {
    allowed: result.allowed,
    conversionsToday: result.conversionsUsed,
    message: result.message
  };
}

// Fonction pour enregistrer une conversion dans la DB
// Cette fonction enregistre TOUJOURS dans conversion_logs (pour le comptage par IP)
// Elle met aussi à jour free_users si un email est fourni (pour les stats)
export async function logConversion(ipAddress: string, userAgent: string, email?: string): Promise<void> {
  try {
    // 1. TOUJOURS enregistrer dans conversion_logs (pour le comptage par IP)
    const { error: logError } = await supabase
      .from('conversion_logs')
      .insert([
        {
          ip_address: ipAddress,
          user_agent: userAgent,
          converted_at: new Date().toISOString()
        }
      ]);

    if (logError) {
      console.error('Error logging conversion:', logError);
    }

    // 2. Si un email est fourni (compte gratuit), mettre à jour les stats dans free_users
    if (email) {
      const { data: freeUser } = await supabase
        .from('free_users')
        .select('*')
        .eq('email', email)
        .single();

      if (freeUser) {
        // Mettre à jour le compteur et la dernière conversion
        await supabase
          .from('free_users')
          .update({
            conversions_count: (freeUser.conversions_count || 0) + 1,
            last_conversion_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('email', email);
      } else {
        // Créer un nouvel utilisateur gratuit si n'existe pas
        await supabase
          .from('free_users')
          .insert([{
            email,
            ip_address: ipAddress,
            conversions_count: 1,
            last_conversion_at: new Date().toISOString()
          }]);
      }
    }
  } catch (error) {
    console.error('Error in logConversion:', error);
  }
}

// Fonction pour vérifier si un utilisateur est premium (par email)
export async function isPremiumUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('premium_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return false;
    }

    // Vérifier si lifetime
    if (data.is_lifetime) {
      return true;
    }

    // Vérifier si pas expiré
    if (data.expires_at && new Date(data.expires_at) > new Date()) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

// Fonction pour obtenir l'adresse IP du client
export async function getClientIP(): Promise<string> {
  try {
    // Essayer d'obtenir l'IP depuis différents services
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Error getting IP:', error);
    return 'unknown';
  }
}
