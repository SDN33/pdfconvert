import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('Payment successful, session:', sessionId);

    // Redirection automatique après 5 secondes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Paiement réussi !
        </h1>
        
        <p className="text-xl text-slate-600 mb-8">
          Félicitations ! Vous avez maintenant accès à la version <strong className="text-cyan-600">illimitée à vie</strong> !
        </p>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Vos avantages :</h2>
          <ul className="space-y-3 text-left max-w-md mx-auto">
            <li className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-slate-700 font-semibold">Conversions illimitées</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-slate-700 font-semibold">Accès à vie (aucun abonnement)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-slate-700 font-semibold">Toutes les fonctionnalités premium</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-slate-700 font-semibold">Support prioritaire</span>
            </li>
          </ul>
        </div>

        <div className="mb-8">
          <p className="text-slate-600 mb-4">
            Un email de confirmation vous a été envoyé avec tous les détails.
          </p>
          <p className="text-sm text-slate-500">
            Redirection automatique dans <strong className="text-cyan-600">{countdown}</strong> seconde{countdown > 1 ? 's' : ''}...
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600 hover:from-cyan-600 hover:via-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl text-lg"
        >
          Commencer à convertir maintenant →
        </button>
      </div>
    </div>
  );
}
