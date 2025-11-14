import { redirectToCheckout } from '../lib/stripe';
import { useState } from 'react';

interface PremiumBannerProps {
  conversionsLeft: number;
  onLoginClick: () => void;
  isPremium: boolean;
  premiumEmail?: string;
  onLogout?: () => void;
  userIP?: string;
}

export default function PremiumBanner({ 
  conversionsLeft, 
  onLoginClick, 
  isPremium, 
  premiumEmail,
  onLogout,
  userIP 
}: PremiumBannerProps) {
  const [showIP, setShowIP] = useState(false);
  
  if (isPremium && premiumEmail) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">✨ Premium Actif</h3>
              </div>
              <p className="text-white/90 text-xs">
                {premiumEmail} • Conversions illimitées ♾️
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all backdrop-blur-sm"
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl p-4 shadow-md mb-6 relative overflow-hidden">
      {/* Effet de brillance subtil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100/20 to-transparent animate-shimmer"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Partie gauche - Info conversions */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎯</span>
              <h3 className="font-bold text-gray-900">Conversions gratuites</h3>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {conversionsLeft}/2 restantes
              </span>
            </div>
            
            {/* Compteur visuel */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      i < conversionsLeft 
                        ? 'bg-green-500 border-green-600 text-white' 
                        : 'bg-gray-200 border-gray-300 text-gray-400'
                    }`}
                  >
                    {i < conversionsLeft ? '✓' : '✗'}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600">par 24h</span>
            </div>

            {/* Détecteur IP */}
            {userIP && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <button 
                  onClick={() => setShowIP(!showIP)}
                  className="hover:text-gray-700 underline"
                >
                  {showIP ? `IP: ${userIP}` : 'Voir mon IP'}
                </button>
              </div>
            )}
          </div>

          {/* Partie droite - CTA */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => redirectToCheckout()}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              🚀 Illimité 2,99€
            </button>
            
            <button
              onClick={onLoginClick}
              className="flex-1 sm:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-all border border-gray-300 text-sm whitespace-nowrap"
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Connexion
              </span>
            </button>
          </div>
        </div>

        {/* Petite ligne de bénéfices */}
        {conversionsLeft === 0 && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-xs text-gray-600 text-center">
              ⚡ Accès à vie • 🎨 Tous les styles • ♾️ Conversions illimitées
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 4s infinite;
        }
      `}</style>
    </div>
  );
}
