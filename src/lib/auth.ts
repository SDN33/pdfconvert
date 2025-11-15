import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  isPremium: boolean;
  sessionToken: string;
}

// Connexion avec Google via Supabase Auth
export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    // Utiliser l'origine actuelle (production ou localhost)
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('🔐 Google OAuth redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Erreur de connexion avec Google' };
    }

    return { success: true };
  } catch (error) {
    console.error('Google login error:', error);
    return { success: false, error: 'Erreur de connexion avec Google' };
  }
}

// Gérer le callback OAuth et créer/récupérer l'utilisateur
export async function handleOAuthCallback(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return { success: false, error: 'Erreur lors de la récupération de l\'utilisateur' };
    }

    // Vérifier si l'utilisateur existe dans notre table premium_users
    let { data: premiumUser } = await supabase
      .from('premium_users')
      .select('*')
      .eq('email', user.email)
      .single();

    // Si l'utilisateur n'existe pas, le créer
    if (!premiumUser) {
      const { data: newUser, error: insertError } = await supabase
        .from('premium_users')
        .insert([{
          email: user.email,
          password_hash: null, // Pas de mot de passe pour OAuth
          is_lifetime: false,
          subscription_status: 'free'
        }])
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('Error creating user:', insertError);
        return { success: false, error: 'Erreur lors de la création du compte' };
      }

      premiumUser = newUser;
    }

    // Créer une session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert([{
        user_id: premiumUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      }]);

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, error: 'Erreur lors de la création de la session' };
    }

    return {
      success: true,
      user: {
        id: premiumUser.id,
        email: premiumUser.email,
        isPremium: premiumUser.is_lifetime === true,
        sessionToken
      }
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

// Générer un token de session unique
function generateSessionToken(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Créer un compte premium avec mot de passe
export async function registerPremium(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // Vérifier si l'email existe déjà (sans .single() pour éviter les erreurs)
    const { data: existing } = await supabase
      .from('premium_users')
      .select('email')
      .eq('email', email)
      .maybeSingle(); // Utiliser maybeSingle() au lieu de single()

    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cet email' };
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Créer l'utilisateur GRATUIT (pas premium tant qu'il n'a pas payé)
    const { data: newUser, error } = await supabase
      .from('premium_users')
      .insert([{
        email,
        password_hash: passwordHash,
        is_lifetime: false, // Restera false jusqu'au paiement Stripe
        subscription_status: 'free', // Compte gratuit
        purchased_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error || !newUser) {
      console.error('Error creating user:', error);
      
      // Gérer les erreurs spécifiques
      if (error?.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
        return { success: false, error: 'Un compte existe déjà avec cet email' };
      }
      
      return { success: false, error: error?.message || 'Erreur lors de la création du compte' };
    }

    // Créer une session automatiquement
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert([{
        user_id: newUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      }]);

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, error: 'Erreur lors de la création de la session' };
    }

    return { 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        isPremium: newUser.is_lifetime === true,
        sessionToken
      }
    };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

// Connexion avec email et mot de passe
export async function loginPremium(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // Récupérer l'utilisateur (maybeSingle pour éviter les erreurs)
    const { data: user, error: userError } = await supabase
      .from('premium_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

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
