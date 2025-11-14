import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour vérifier si l'utilisateur peut convertir (limite 2 par jour)
export async function canConvert(ipAddress: string): Promise<{ allowed: boolean; conversionsToday: number; message?: string }> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('conversion_logs')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('converted_at', twentyFourHoursAgo);

    if (error) {
      console.error('Error checking conversions:', error);
      return { allowed: true, conversionsToday: 0 }; // En cas d'erreur, autoriser la conversion
    }

    const conversionsToday = data?.length || 0;

    if (conversionsToday >= 2) {
      return {
        allowed: false,
        conversionsToday,
        message: 'Vous avez atteint la limite de 2 conversions gratuites par jour. Passez à la version illimitée pour seulement 2,99€ à vie !'
      };
    }

    return { allowed: true, conversionsToday };
  } catch (error) {
    console.error('Error in canConvert:', error);
    return { allowed: true, conversionsToday: 0 };
  }
}

// Fonction pour enregistrer une conversion
export async function logConversion(ipAddress: string, userAgent: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversion_logs')
      .insert([
        {
          ip_address: ipAddress,
          user_agent: userAgent,
          converted_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error logging conversion:', error);
    }
  } catch (error) {
    console.error('Error in logConversion:', error);
  }
}

// Fonction pour vérifier si un utilisateur est premium
export async function isPremiumUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('premium_users')
      .select('*')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .single();

    if (error || !data) {
      return false;
    }

    // Vérifier si lifetime ou si pas expiré
    if (data.is_lifetime) {
      return true;
    }

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
