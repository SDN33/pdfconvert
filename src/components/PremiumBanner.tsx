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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4">
          
          {/* Left: User Info + Conversions Counter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                  {premiumEmail.split('@')[0]}
                </div>
                <div className="text-xs text-gray-500">Compte gratuit</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <div className="flex gap-1.5">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      i < conversionsLeft 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i < conversionsLeft ? '✓' : ''}
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {conversionsLeft}/2
              </div>
            </div>
          </div>

          {/* Center: Premium Benefits - Inline (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="text-green-600">✓</span>
              <span>Illimité</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-600">✓</span>
              <span>Sans abonnement</span>
            </div>
          </div>

          {/* Right: CTA + Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 line-through">9,99€</span>
              <span className="text-2xl font-bold text-gray-900">2,99€</span>
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">-70%</span>
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showUpgradeModal'));
              }}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Passer Premium →
            </button>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all"
              title="Déconnexion"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Utilisateur NON connecté (anonyme)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4">
        
        {/* Left: Conversions Counter - Compact */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    i < conversionsLeft 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < conversionsLeft ? '✓' : ''}
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {conversionsLeft}/2 conversions
              </div>
              <div className="text-xs text-gray-500">aujourd'hui</div>
            </div>
          </div>
          
          {/* IP Detector */}
          {userIP && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 pl-4 border-l border-gray-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <button 
                onClick={() => setShowIP(!showIP)}
                className="hover:text-gray-600 transition-colors"
              >
                {showIP ? userIP : 'IP'}
              </button>
            </div>
          )}
        </div>

        {/* Center: Premium Benefits - Inline */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="text-green-600">✓</span>
            <span>Illimité</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-600">✓</span>
            <span>Sans abonnement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-600">✓</span>
            <span>Accès prioritaire</span>
          </div>
        </div>

        {/* Right: CTA Compact */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 line-through">9,99€</span>
            <span className="text-2xl font-bold text-gray-900">2,99€</span>
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">-70%</span>
          </div>
          <button
            onClick={() => redirectToCheckout()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Passer Premium →
          </button>
        </div>
      </div>

      {/* Login Link - Subtle */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
        <button
          onClick={onLoginClick}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Déjà un compte ? Connexion</span>
        </button>
      </div>
    </div>
  );
}
