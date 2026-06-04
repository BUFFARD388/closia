export default function CGV() {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mentions légales</p>
      <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales de Vente</h1>
      <p className="text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">1. Vendeur</h2>
        <p className="text-gray-300 leading-relaxed">
          Les présentes Conditions Générales de Vente (CGV) régissent les ventes réalisées par Laurent Buffard, opérant sous la marque Closia, dont le siège est situé au 18 avenue Carnot, 69250 Neuville sur Saône, RCS Lyon 401 801 204 — ci-après « Closia ».
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          Les CGV s'appliquent à toute commande passée via la plateforme closia.net par un professionnel (ci-après « l'Acheteur »). Toute commande implique l'acceptation pleine et entière des présentes conditions.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">2. Produits et services</h2>
        <p className="text-gray-300 leading-relaxed mb-4">Closia propose les services suivants :</p>

        <div className="bg-[#111720] border border-white/10 rounded-xl p-6 mb-4">
          <p className="text-[#c29a6b] font-semibold mb-3">Lead Exclusif</p>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">Accès immédiat et exclusif aux coordonnées complètes de l'apporteur d'un bien qualifié. Un seul acheteur par lead. Tarifs en vigueur :</p>
          <div className="space-y-1 text-sm text-gray-400">
            <p>→ Bien &lt; 300 000 € : <strong className="text-white">490 € HT</strong></p>
            <p>→ Bien entre 300 000 € et 1 000 000 € : <strong className="text-white">890 € HT</strong></p>
            <p>→ Bien &gt; 1 000 000 € : <strong className="text-white">1 490 € HT</strong></p>
          </div>
        </div>

        <div className="bg-[#111720] border border-white/10 rounded-xl p-6 mb-4">
          <p className="text-[#c29a6b] font-semibold mb-3">Lead Partagé</p>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">Accès partagé entre 2 ou 3 acheteurs maximum aux coordonnées de l'apporteur. Le prix final est calculé à la clôture du lead (72h) selon le nombre d'acheteurs. Tarifs en vigueur :</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="font-medium text-gray-300">Bien &lt; 300 000 € :</p>
            <p className="pl-3">→ 2 acheteurs : <strong className="text-white">290 € HT</strong> / acheteur · 3 acheteurs : <strong className="text-white">190 € HT</strong> / acheteur</p>
            <p className="font-medium text-gray-300 mt-2">Bien entre 300 000 € et 1 000 000 € :</p>
            <p className="pl-3">→ 2 acheteurs : <strong className="text-white">490 € HT</strong> / acheteur · 3 acheteurs : <strong className="text-white">320 € HT</strong> / acheteur</p>
            <p className="font-medium text-gray-300 mt-2">Bien &gt; 1 000 000 € :</p>
            <p className="pl-3">→ 2 acheteurs : <strong className="text-white">790 € HT</strong> / acheteur · 3 acheteurs : <strong className="text-white">520 € HT</strong> / acheteur</p>
          </div>
        </div>

        <div className="bg-[#111720] border border-white/10 rounded-xl p-6">
          <p className="text-[#c29a6b] font-semibold mb-3">Analyse préalable simple</p>
          <p className="text-gray-300 text-sm leading-relaxed">Analyse experte d'un bien immobilier à fort potentiel : lecture PLU, identification du potentiel de valorisation, risques, axes de création de valeur. Rapport écrit livré sous 48h. Tarif : <strong className="text-white">150 € HT</strong>.</p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">3. Prix et TVA</h2>
        <p className="text-gray-300 leading-relaxed">
          Tous les prix sont indiqués hors taxes (HT). La TVA applicable est celle en vigueur au jour de la commande (20 % pour les prestations de services en France). Le montant TTC est affiché sur la page de paiement Stripe avant validation de la commande.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widests mb-4">4. Commande et paiement</h2>
        <p className="text-gray-300 leading-relaxed">
          Le paiement est effectué en ligne au moment de la commande via la plateforme Stripe (paiement sécurisé par carte bancaire). La commande est définitivement validée à réception du paiement. Une facture est automatiquement générée et envoyée par email à l'Acheteur après chaque paiement.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          Pour le lead partagé, l'inscription sur la liste d'attente est gratuite. Le paiement intervient à la clôture du lead (72h), selon le nombre d'acheteurs finalement inscrits.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widests mb-4">5. Droit de rétractation</h2>
        <p className="text-gray-300 leading-relaxed">
          Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenu numérique dont l'exécution a commencé avant l'expiration du délai de rétractation et à laquelle le consommateur a renoncé expressément.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          En tant que service exclusivement B2B (professionnel à professionnel), le droit de rétractation légal de 14 jours prévu pour les consommateurs ne s'applique pas. Tout achat de lead est définitif dès validation du paiement, l'accès aux coordonnées étant immédiat.
        </p>
        <p className="text-gray-300 leading-relaxed mt-3">
          Pour l'analyse préalable, en cas d'impossibilité avérée de Closia à réaliser la prestation, un remboursement intégral sera effectué dans les 14 jours.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widests mb-4">6. Obligations de Closia</h2>
        <p className="text-gray-300 leading-relaxed">
          Closia s'engage à qualifier chaque bien soumis avec sérieux et expertise avant diffusion, à garantir la confidentialité des dossiers et à limiter l'accès à chaque lead au nombre d'acheteurs contractuellement prévu. L'analyse fournie constitue un avis d'expert fondé sur les informations disponibles au moment de l'étude ; elle ne saurait constituer une garantie de résultat ou de transaction.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widests mb-4">7. Litiges</h2>
        <p className="text-gray-300 leading-relaxed">
          Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut d'accord, le tribunal de commerce de Lyon sera seul compétent.
        </p>
      </section>

      <div className="border-t border-white/10 pt-8 text-xs text-gray-500">
        Contact : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 06 87 76 33 40 · 18 avenue Carnot, 69250 Neuville sur Saône
      </div>
    </div>
  )
}
