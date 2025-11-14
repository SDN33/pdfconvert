import { useState, useEffect } from 'react';

interface CookieBannerProps {
  onAccept: () => void;
}

export default function CookieBanner({ onAccept }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Petit délai pour l'animation
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(onAccept, 300); // Attendre la fin de l'animation
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-2xl shadow-2xl border-2 border-cyan-200 p-6 transition-all duration-300 z-50 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">🍪</div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 mb-2">Cookies</h3>
          <p className="text-sm text-slate-600 mb-4">
            Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation du site.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Accepter
            </button>
            <a
              href="/mentions-legales"
              className="text-sm text-cyan-600 hover:text-cyan-700 py-2 px-3 hover:underline"
            >
              En savoir plus
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
