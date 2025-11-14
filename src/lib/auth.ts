import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  isPremium: boolean;
  sessionToken: string;
}

// Générer un token de session unique
function generateSessionToken(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Créer un compte premium avec mot de passe
export async function registerPremium(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si l'email existe déjà
    const { data: existing } = await supabase
      .from('premium_users')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cet email' };
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Créer l'utilisateur
    const { error } = await supabase
      .from('premium_users')
      .insert([{
        email,
        password_hash: passwordHash,
        is_lifetime: false, // Sera mis à true après paiement Stripe
        subscription_status: 'pending'
      }]);

    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Erreur lors de la création du compte' };
    }

    return { success: true };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

// Connexion avec email et mot de passe
export async function loginPremium(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('premium_users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    // Vérifier si premium actif
    const isPremium = user.is_lifetime === true;

    // Créer une session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Session de 30 jours

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert([{
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      }]);

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, error: 'Erreur lors de la création de la session' };
    }

    // Mettre à jour last_login
    await supabase
      .from('premium_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isPremium,
        sessionToken
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

// Vérifier une session
export async function verifySession(sessionToken: string): Promise<{ valid: boolean; user?: AuthUser }> {
  try {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*, premium_users(*)')
      .eq('session_token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return { valid: false };
    }

    const user = session.premium_users as {
      id: string;
      email: string;
      is_lifetime: boolean;
    };

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.is_lifetime === true,
        sessionToken
      }
    };
  } catch (error) {
    console.error('Verify session error:', error);
    return { valid: false };
  }
}

// Déconnexion
export async function logout(sessionToken: string): Promise<void> {
  try {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Mettre à jour le mot de passe
export async function updatePassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error } = await supabase
      .from('premium_users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

// Réinitialiser le mot de passe (générer un token temporaire)
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur existe
    const { data: user } = await supabase
      .from('premium_users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return { success: true };
    }

    // TODO: Générer un token de réinitialisation et l'envoyer par email
    // Pour l'instant, on retourne juste success
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}
