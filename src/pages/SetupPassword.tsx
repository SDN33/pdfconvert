import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loginPremium } from '../lib/auth';
import bcrypt from 'bcryptjs';

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Fonction pour vérifier la session Stripe
    const verifySession = async () => {
      try {
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.email) {
          setEmail(data.email);
          
          // Vérifier si l'utilisateur a déjà un mot de passe
          const { data: user } = await supabase
            .from('premium_users')
            .select('password_hash')
            .eq('email', data.email)
            .single();

          if (user && user.password_hash) {
            // L'utilisateur a déjà un mot de passe, rediriger vers la page de succès normale
            navigate('/success');
          }
        } else {
          setError('Session invalide');
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        setError('Erreur lors de la vérification de votre paiement');
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Mettre à jour l'utilisateur avec le mot de passe
      const { error: updateError } = await supabase
        .from('premium_users')
        .update({ password_hash: passwordHash })
        .eq('email', email);

      if (updateError) {
        throw updateError;
      }

      // Se connecter automatiquement
      const result = await loginPremium(email, password);

      if (result.success && result.user) {
        // Stocker la session
        localStorage.setItem('session_token', result.user.sessionToken);
        
        // Rediriger vers la page principale
        setTimeout(() => {
          navigate('/?welcome=true');
        }, 1500);
      } else {
        throw new Error('Erreur lors de la connexion');
      }
    } catch (err) {
      console.error('Error setting password:', err);
      setError('Erreur lors de la création du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Bienvenue !
          </h1>
          <p className="text-gray-600">
            Votre paiement a été effectué avec succès
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Créez maintenant votre mot de passe pour accéder à votre compte premium
          </p>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-cyan-800">
            <strong>Email :</strong> {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

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
            {loading ? 'Création en cours...' : 'Créer mon mot de passe et accéder'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Votre compte premium est maintenant actif !</p>
          <p className="mt-1">Conversions illimitées à vie 🚀</p>
        </div>
      </div>
    </div>
  );
}
