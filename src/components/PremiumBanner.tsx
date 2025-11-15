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
  
  // Utilisateur PREMIUM (connecté ET payé)
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

  // Utilisateur GRATUIT connecté (a un compte mais pas payé)
  if (premiumEmail && !isPremium) {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
        {/* Effet d'animation de fond */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 via-amber-200/20 to-orange-200/20 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col gap-4">
            {/* En-tête avec badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Compte Gratuit</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{premiumEmail}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-white/60 hover:bg-white/80 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all backdrop-blur-sm border border-gray-200"
              >
                Déconnexion
              </button>
            </div>

            {/* Compteur visuel amélioré */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700">Conversions aujourd'hui</span>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                  {conversionsLeft}/2 restantes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all transform ${
                        i < conversionsLeft 
                          ? 'bg-green-500 border-green-600 text-white scale-100 shadow-md' 
                          : 'bg-gray-200 border-gray-300 text-gray-400 scale-95'
                      }`}
                    >
                      {i < conversionsLeft ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 rounded-full"
                    style={{ width: `${(conversionsLeft / 2) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Bannière CTA premium améliorée */}
            <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-xl p-5 text-white shadow-2xl relative overflow-hidden">
              {/* Effet brillant */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🚀</span>
                      <h4 className="font-extrabold text-lg">Passez à l'illimité !</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-orange-50 mb-3">
                      <li className="flex items-center gap-2">
                        <span className="text-white font-bold">✓</span>
                        <span>Conversions <strong>illimitées</strong> à vie</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-white font-bold">✓</span>
                        <span>Aucun abonnement mensuel</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-white font-bold">✓</span>
                        <span>Accès prioritaire aux nouvelles fonctionnalités</span>
                      </li>
                    </ul>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-100 line-through text-sm">9,99€</span>
                      <span className="text-3xl font-black">2,99€</span>
                      <span className="bg-yellow-400 text-orange-900 text-xs font-bold px-2 py-1 rounded-full">-70%</span>
                    </div>
                    <p className="text-xs text-orange-100 mt-1">Paiement unique • Sans engagement</p>
                  </div>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('showUpgradeModal'));
                    }}
                    className="bg-white text-orange-600 px-6 py-3 rounded-xl font-extrabold hover:bg-orange-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 whitespace-nowrap flex items-center gap-2"
                  >
                    <span>Débloquer</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Utilisateur NON connecté (anonyme)
  return (
    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
      {/* Effet d'animation de fond */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 via-amber-200/20 to-orange-200/20 animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col gap-4">
          {/* Compteur conversions restantes */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">Conversions gratuites aujourd'hui</span>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                {conversionsLeft}/2 restantes
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all transform ${
                      i < conversionsLeft 
                        ? 'bg-green-500 border-green-600 text-white scale-100 shadow-md' 
                        : 'bg-gray-200 border-gray-300 text-gray-400 scale-95'
                    }`}
                  >
                    {i < conversionsLeft ? '✓' : '✗'}
                  </div>
                ))}
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 rounded-full"
                  style={{ width: `${(conversionsLeft / 2) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Détecteur IP */}
            {userIP && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
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

          {/* Bannière CTA premium améliorée */}
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-xl p-4 sm:p-5 text-white shadow-2xl relative overflow-hidden">
            {/* Effet brillant */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl sm:text-2xl">🚀</span>
                    <h4 className="font-extrabold text-base sm:text-lg">Passez à l'illimité !</h4>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-sm text-orange-50 mb-3">
                    <li className="flex items-center gap-2">
                      <span className="text-white font-bold flex-shrink-0">✓</span>
                      <span>Conversions <strong>illimitées</strong> à vie</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-white font-bold flex-shrink-0">✓</span>
                      <span>Aucun abonnement mensuel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-white font-bold flex-shrink-0">✓</span>
                      <span>Accès prioritaire aux nouvelles fonctionnalités</span>
                    </li>
                  </ul>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-100 line-through text-xs sm:text-sm">9,99€</span>
                    <span className="text-2xl sm:text-3xl font-black">2,99€</span>
                    <span className="bg-yellow-400 text-orange-900 text-xs font-bold px-2 py-1 rounded-full">-70%</span>
                  </div>
                  <p className="text-xs text-orange-100 mt-1">Paiement unique • Sans engagement</p>
                </div>
                <button
                  onClick={() => redirectToCheckout()}
                  className="w-full sm:w-auto bg-white text-orange-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-extrabold hover:bg-orange-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 whitespace-nowrap flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span>Débloquer</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Lien connexion discret en bas */}
          <div className="text-center">
            <button
              onClick={onLoginClick}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium underline inline-flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Déjà un compte ? Connexion</span>
            </button>
          </div>
        </div>
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
