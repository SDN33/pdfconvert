import React, { useState } from 'react';
import { X } from 'lucide-react';
import { registerPremium, loginWithGoogle } from '../lib/auth';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (sessionToken: string, email: string) => void;
}

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Adresse email invalide');
      return;
    }

    setLoading(true);

    try {
      const result = await registerPremium(email.trim().toLowerCase(), password);
      
      if (!result.success || !result.user) {
        setError(result.error || 'Erreur lors de la création du compte');
        return;
      }

      setSuccess(true);
      
      // Stocker le session token
      localStorage.setItem('session_token', result.user.sessionToken);
      
      // Appeler le callback de succès
      setTimeout(() => {
        onRegisterSuccess(result.user!.sessionToken, result.user!.email);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        setError('Un compte avec cet email existe déjà');
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      
      if (!result.success) {
        setError(result.error || '❌ Erreur de connexion avec Google.');
        setLoading(false);
      }
      // La redirection vers Google se fait automatiquement
    } catch (error) {
      console.error('Google signup error:', error);
      setError('❌ Erreur de connexion avec Google.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-2">
            Créer un compte gratuit
          </h2>
          <p className="text-gray-600">
            Suivez vos conversions (2/jour gratuit)
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">Compte créé avec succès !</h3>
            <p className="text-green-600">Vous êtes maintenant connecté</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="votre@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="Minimum 8 caractères"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="Confirmer votre mot de passe"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création en cours...' : 'Créer mon compte gratuit'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OU</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continuer avec Google</span>
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <button
            onClick={() => {
              onClose();
              // Déclencher l'ouverture du modal de connexion
              setTimeout(() => {
                const loginBtn = document.querySelector('[data-login-trigger]') as HTMLButtonElement;
                if (loginBtn) loginBtn.click();
              }, 100);
            }}
            className="text-cyan-500 hover:text-cyan-600 font-semibold"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
