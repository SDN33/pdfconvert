export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-cyan-100">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">Mentions Légales</h1>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Éditeur du site</h2>
            <div className="text-slate-600 space-y-2">
              <p><strong>Nom :</strong> Stéphane Dei-Negri</p>
              <p><strong>Société :</strong> StillInov</p>
              <p><strong>Email :</strong> <a href="mailto:contact@stillinov.com" className="text-cyan-600 hover:underline">contact@stillinov.com</a></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Hébergement</h2>
            <div className="text-slate-600 space-y-2">
              <p><strong>Hébergeur web :</strong> Hostinger</p>
              <p><strong>Hébergeur application :</strong> Vercel Inc.</p>
              <p className="text-sm">340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Propriété intellectuelle</h2>
            <p className="text-slate-600 mb-4">
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. 
              Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
            <p className="text-slate-600">
              La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Protection des données personnelles (RGPD)</h2>
            <p className="text-slate-600 mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
            </p>
            <p className="text-slate-600 mb-4">
              <strong>Données collectées :</strong>
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Adresse IP (pour limiter les conversions gratuites à 2 par jour)</li>
              <li>Email (uniquement si vous achetez la version premium)</li>
              <li>Cookies de navigation (avec votre consentement)</li>
            </ul>
            <p className="text-slate-600 mb-4">
              <strong>Finalités :</strong> Limitation d'usage, gestion des abonnements premium, amélioration du service.
            </p>
            <p className="text-slate-600 mb-4">
              <strong>Conservation :</strong> Les adresses IP sont conservées 24 heures. Les données d'achat sont conservées pour la durée légale comptable.
            </p>
            <p className="text-slate-600">
              Pour exercer vos droits, contactez : <a href="mailto:contact@stillinov.com" className="text-cyan-600 hover:underline">contact@stillinov.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Cookies</h2>
            <p className="text-slate-600 mb-4">
              Ce site utilise des cookies pour améliorer l'expérience utilisateur et analyser le trafic. En continuant à naviguer sur ce site, vous acceptez l'utilisation de cookies.
            </p>
            <p className="text-slate-600">
              Vous pouvez à tout moment désactiver les cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Conditions de vente - Offre Premium</h2>
            <div className="text-slate-600 space-y-4">
              <p>
                <strong>Produit :</strong> Accès illimité à vie au convertisseur Markdown vers PDF
              </p>
              <p>
                <strong>Prix :</strong> 2,99€ TTC (paiement unique, pas d'abonnement)
              </p>
              <p>
                <strong>Paiement :</strong> Paiement sécurisé via Stripe. Nous acceptons les cartes bancaires.
              </p>
              <p>
                <strong>Livraison :</strong> L'accès premium est activé immédiatement après validation du paiement.
              </p>
              <p>
                <strong>Droit de rétractation :</strong> Conformément à la législation européenne, vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation. Pour toute demande de remboursement, contactez : <a href="mailto:contact@stillinov.com" className="text-cyan-600 hover:underline">contact@stillinov.com</a>
              </p>
              <p>
                <strong>Garantie satisfait ou remboursé :</strong> 30 jours sans condition.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Limitation de responsabilité</h2>
            <p className="text-slate-600 mb-4">
              MarkdownEnPDF.com ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications techniques requises, soit de l'apparition d'un bug ou d'une incompatibilité.
            </p>
            <p className="text-slate-600">
              Le service est fourni "tel quel" sans garantie d'aucune sorte. L'utilisateur est seul responsable de l'utilisation qu'il fait des fichiers PDF générés.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact</h2>
            <p className="text-slate-600">
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter à l'adresse : 
              <a href="mailto:contact@stillinov.com" className="text-cyan-600 hover:underline ml-1">contact@stillinov.com</a>
            </p>
          </section>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              Dernière mise à jour : 14 novembre 2025
            </p>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
