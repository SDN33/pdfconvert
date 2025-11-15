interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Limite de 2 conversions atteinte
          </h2>
          <p className="text-slate-600">
            Passez à l'illimité pour <strong>seulement 2,99€</strong> (paiement unique, à vie)
          </p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-cyan-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Illimité à vie !</h3>
              <p className="text-sm text-slate-600">Un seul paiement, accès permanent</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-cyan-600">2,99€</div>
              <div className="text-xs text-slate-500">Paiement unique</div>
            </div>
          </div>

          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-slate-700">
              <span className="text-cyan-600 text-xl">✓</span>
              <span className="font-semibold">Conversions illimitées</span>
            </li>
            <li className="flex items-center gap-2 text-slate-700">
              <span className="text-cyan-600 text-xl">✓</span>
              <span className="font-semibold">Accès à vie (pas d'abonnement)</span>
            </li>
            <li className="flex items-center gap-2 text-slate-700">
              <span className="text-cyan-600 text-xl">✓</span>
              <span className="font-semibold">Toutes les fonctionnalités premium</span>
            </li>
            <li className="flex items-center gap-2 text-slate-700">
              <span className="text-cyan-600 text-xl">✓</span>
              <span className="font-semibold">Support prioritaire</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600 hover:from-cyan-600 hover:via-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl text-lg"
        >
          Passer à la version illimitée - 2,99€
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          Paiement sécurisé par Stripe • Garantie satisfait ou remboursé 30 jours
        </p>
      </div>
    </div>
  );
}
