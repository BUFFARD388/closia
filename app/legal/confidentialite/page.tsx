export default function Confidentialite() {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mentions légales</p>
      <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité & RGPD</h1>
      <p className="text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">1. Responsable du traitement</h2>
        <p className="text-gray-300 leading-relaxed">
          Le responsable du traitement des données personnelles est Laurent Buffard, opérant sous la marque Closia, dont le siège est situé au 18 avenue Carnot, 69250 Neuville sur Saône — RCS Lyon 401 801 204.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          Contact DPO : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">2. Données collectées</h2>
        <p className="text-gray-300 leading-relaxed mb-4">Dans le cadre de l'utilisation de la plateforme, Closia collecte les données suivantes :</p>
        <div className="space-y-3">
          {[
            { titre: 'Données d'identification', contenu: 'Nom, prénom, adresse email, numéro de téléphone, numéro SIREN, société, statut professionnel.' },
            { titre: 'Données de connexion', contenu: 'Adresse IP, identifiant de session, date et heure de connexion.' },
            { titre: 'Données transactionnelles', contenu: 'Historique des achats, montants payés, statut des commandes. Les données bancaires sont traitées exclusivement par Stripe et ne transitent pas par les serveurs de Closia.' },
            { titre: 'Données relatives aux biens', contenu: 'Adresse, description, photos, documents transmis par les apporteurs.' },
            { titre: 'Données de navigation', contenu: 'Cookies techniques et analytiques (voir politique de cookies).' },
          ].map(d => (
            <div key={d.titre} className="flex gap-3 bg-[#111720] border border-white/10 rounded-lg p-4">
              <span className="text-[#c29a6b] flex-shrink-0 mt-0.5">→</span>
              <div>
                <p className="text-white font-medium text-sm mb-1">{d.titre}</p>
                <p className="text-gray-400 text-sm">{d.contenu}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">3. Finalités du traitement</h2>
        <p className="text-gray-300 leading-relaxed mb-3">Les données sont collectées et traitées pour les finalités suivantes :</p>
        <ul className="space-y-2 text-gray-300">
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Création et gestion des comptes utilisateurs</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Traitement des commandes et facturation</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Mise en relation entre apporteurs et acheteurs</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Envoi de communications liées à l'activité de la plateforme</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Amélioration de la plateforme et statistiques d'usage anonymisées</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Respect des obligations légales et comptables</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">4. Base légale du traitement</h2>
        <p className="text-gray-300 leading-relaxed">
          Les traitements reposent sur les bases légales suivantes : exécution du contrat (gestion des comptes et commandes), intérêt légitime (amélioration du service), obligation légale (conservation des documents comptables), et consentement (communications marketing optionnelles).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">5. Durée de conservation</h2>
        <div className="space-y-2 text-gray-300">
          <p>→ Données de compte : durée de vie du compte + 3 ans après clôture</p>
          <p>→ Données transactionnelles et factures : 10 ans (obligation comptable)</p>
          <p>→ Données de navigation : 13 mois maximum</p>
          <p>→ Documents soumis (biens, analyses) : 2 ans après la fin de la relation commerciale</p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">6. Destinataires des données</h2>
        <p className="text-gray-300 leading-relaxed mb-3">Closia ne vend ni ne loue vos données personnelles. Les données peuvent être partagées avec :</p>
        <ul className="space-y-2 text-gray-300">
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Supabase</strong> (hébergement base de données) — serveurs en Europe</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Stripe</strong> (paiement sécurisé) — certifié PCI-DSS</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Resend</strong> (envoi d'emails transactionnels)</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Vercel</strong> (hébergement de l'application) — serveurs en Europe</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Les contreparties dans la transaction (apporteur → acheteur, uniquement après paiement validé)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">7. Vos droits</h2>
        <p className="text-gray-300 leading-relaxed mb-3">Conformément au RGPD (Règlement UE 2016/679), vous disposez des droits suivants :</p>
        <ul className="space-y-2 text-gray-300">
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Droit de rectification</strong> : corriger des données inexactes</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Droit à l'effacement</strong> : demander la suppression de vos données</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Droit d'opposition</strong> : vous opposer à un traitement basé sur l'intérêt légitime</li>
          <li className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> <strong className="text-white">Droit de retrait du consentement</strong> : à tout moment pour les traitements basés sur le consentement</li>
        </ul>
        <p className="text-gray-300 leading-relaxed mt-4">
          Pour exercer ces droits, contactez-nous à <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a>. Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-[#c29a6b]">cnil.fr</a>).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">8. Sécurité</h2>
        <p className="text-gray-300 leading-relaxed">
          Closia met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS/TLS), authentification sécurisée, contrôle d'accès aux données, sauvegardes régulières. Les mots de passe sont hachés et ne sont jamais stockés en clair.
        </p>
      </section>

      <div className="border-t border-white/10 pt-8 text-xs text-gray-500">
        DPO / Contact : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 06 87 76 33 40 · 18 avenue Carnot, 69250 Neuville sur Saône
      </div>
    </div>
  )
}
