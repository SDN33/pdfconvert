import { useState } from 'react';
import { loginPremium } from '../lib/auth';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (sessionToken: string, email: string) => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const authUser = await loginPremium(email.trim().toLowerCase(), password);

      if (!authUser) {
        setMessage('❌ Email ou mot de passe incorrect.');
        setIsSuccess(false);
      } else if (!authUser.isPremium) {
        setMessage('❌ Votre compte n\'est pas premium.');
        setIsSuccess(false);
      } else {
        setMessage('✅ Connexion réussie ! Accès illimité activé.');
        setIsSuccess(true);
        // Stocker le session token dans localStorage
        localStorage.setItem('session_token', authUser.sessionToken);
        setTimeout(() => {
          onLoginSuccess(authUser.sessionToken, authUser.email);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Erreur de connexion. Veuillez réessayer.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion Premium</h2>
          <p className="text-gray-600 text-sm">
            Connectez-vous pour accéder à vos conversions illimitées
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              isSuccess 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-3">
            Pas encore de compte ?
          </p>
          <button
            onClick={() => {
              onClose();
              // Trigger register modal
              setTimeout(() => {
                const registerBtn = document.querySelector('[data-register-trigger]') as HTMLButtonElement;
                if (registerBtn) registerBtn.click();
              }, 100);
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all mb-2"
          >
            🚀 Créer un compte - 2,99€ à vie
          </button>
          
          <button
            onClick={() => {
              // Trigger upgrade modal for direct purchase
              onClose();
              window.dispatchEvent(new CustomEvent('showUpgradeModal'));
            }}
            className="w-full text-cyan-600 hover:text-cyan-700 text-sm font-medium"
          >
            Acheter sans créer de compte
          </button>
        </div>
      </div>
    </div>
  );
}
