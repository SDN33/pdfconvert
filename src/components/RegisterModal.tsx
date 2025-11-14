import React, { useState } from 'react';
import { X } from 'lucide-react';
import { registerPremium } from '../lib/auth';

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
      const authUser = await registerPremium(email.trim().toLowerCase(), password);
      
      if (!authUser) {
        setError('Erreur lors de la création du compte');
        return;
      }

      setSuccess(true);
      
      // Stocker le session token
      localStorage.setItem('session_token', authUser.sessionToken);
      
      // Appeler le callback de succès
      setTimeout(() => {
        onRegisterSuccess(authUser.sessionToken, authUser.email);
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-2">
            Créer un compte
          </h2>
          <p className="text-gray-600">
            Accédez à vos conversions premium
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Compte créé avec succès !</h3>
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
              {loading ? 'Création en cours...' : 'Créer mon compte'}
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
