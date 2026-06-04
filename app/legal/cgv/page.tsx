export default function CGV() {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mentions légales</p>
      <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales de Vente</h1>
      <p className="text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">1. Vendeur</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Les présentes CGV régissent les ventes réalisées par Laurent Buffard, opérant sous la marque Closia, dont le siège est situé au 18 avenue Carnot, 69250 Neuville sur Saône, RCS Lyon 401 801 204.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">2. Produits et services</h2>

          <div className="space-y-4">
            <div className="bg-[#111720] border border-[#c29a6b]/20 rounded-xl p-5">
              <p className="text-[#c29a6b] font-semibold text-sm mb-3">Lead Exclusif</p>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">Accès immédiat et exclusif aux coordonnées de l'apporteur. Un seul acheteur par lead.</p>
              <div className="space-y-1 text-sm text-gray-400">
                <p>→ Bien inférieur à 300 000 € : <strong className="text-white">490 € HT</strong></p>
                <p>→ Bien entre 300 000 € et 1 000 000 € : <strong className="text-white">890 € HT</strong></p>
                <p>→ Bien supérieur à 1 000 000 € : <strong className="text-white">1 490 € HT</strong></p>
              </div>
            </div>

            <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
              <p className="text-white font-semibold text-sm mb-3">Lead Partagé</p>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">Accès partagé entre 2 ou 3 acheteurs maximum. Prix calculé à la clôture du lead (72h).</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p className="text-gray-300 font-medium">Bien inférieur à 300 000 € :</p>
                <p className="pl-3">→ 2 acheteurs : <strong className="text-white">290 € HT</strong> / acheteur · 3 acheteurs : <strong className="text-white">190 € HT</strong> / acheteur</p>
                <p className="text-gray-300 font-medium mt-2">Bien entre 300 000 € et 1 000 000 € :</p>
                <p className="pl-3">→ 2 acheteurs : <strong className="text-white">490 € HT</strong> / acheteur · 3 acheteurs : <strong className="text-white">320 € HT</strong> / acheteur</p>
                <p className="text-gray-300 font-medium mt-2">Bien supérieur à 1 000 000 € :</p>
                <p className="pl-3">→ 2 acheteurs : <strong className="text-white">790 € HT</strong> / acheteur · 3 acheteurs : <strong className="text-white">520 € HT</strong> / acheteur</p>
              </div>
            </div>

            <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
              <p className="text-white font-semibold text-sm mb-3">Analyse préalable simple</p>
              <p className="text-gray-300 text-sm leading-relaxed">Analyse experte avec lecture PLU, potentiel de valorisation et rapport écrit sous 48h. Tarif : <strong className="text-white">150 € HT</strong>.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">3. Prix et TVA</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Tous les prix sont indiqués hors taxes (HT). La TVA applicable est celle en vigueur au jour de la commande (20 %). Le montant TTC est affiché sur la page de paiement avant validation.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">4. Commande et paiement</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Le paiement est effectué en ligne via Stripe (paiement sécurisé par carte). La commande est validée à réception du paiement. Une facture est automatiquement générée et envoyée par email après chaque paiement.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">5. Droit de rétractation</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            En tant que service exclusivement B2B (professionnel à professionnel), le droit de rétractation légal de 14 jours prévu pour les consommateurs ne s'applique pas. Tout achat de lead est définitif dès validation du paiement, l'accès aux coordonnées étant immédiat.
          </p>
          <p className="text-gray-300 leading-relaxed text-sm mt-3">
            Pour l'analyse préalable, en cas d'impossibilité avérée de Closia à réaliser la prestation, un remboursement intégral sera effectué dans les 14 jours.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">6. Obligations de Closia</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Closia s'engage à qualifier chaque bien avec sérieux avant diffusion, à garantir la confidentialité des dossiers et à limiter l'accès à chaque lead au nombre d'acheteurs prévu. L'analyse fournie est un avis d'expert, non une garantie de résultat.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">7. Litiges</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Les présentes CGV sont soumises au droit français. En cas de litige, le tribunal de commerce de Lyon sera compétent.
          </p>
        </section>
      </div>

      <div className="border-t border-white/10 pt-8 mt-10 text-xs text-gray-500">
        Contact : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 06 87 76 33 40 · 18 avenue Carnot, 69250 Neuville sur Saône
      </div>
    </div>
  )
}

