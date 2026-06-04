export default function Cookies() {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mentions légales</p>
      <h1 className="text-3xl font-bold text-white mb-2">Politique de cookies</h1>
      <p className="text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">1. Qu'est-ce qu'un cookie ?</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site web. Il permet de reconnaître votre navigateur et de mémoriser certaines informations pour améliorer votre expérience.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">2. Cookies utilisés sur Closia</h2>
          <div className="space-y-4">
            <div className="bg-[#111720] border border-[#c29a6b]/20 rounded-xl p-5">
              <p className="text-[#c29a6b] font-semibold text-sm mb-2">Cookies strictement nécessaires</p>
              <p className="text-gray-400 text-sm leading-relaxed">Indispensables au fonctionnement de la plateforme. Ils gèrent la session utilisateur, l'authentification et la sécurité. Ils ne peuvent pas être désactivés. Aucun consentement requis.</p>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p>→ Session Supabase (authentification)</p>
                <p>→ Session Next.js</p>
              </div>
            </div>

            <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
              <p className="text-white font-semibold text-sm mb-2">Cookies de paiement (Stripe)</p>
              <p className="text-gray-400 text-sm leading-relaxed">Déposés lors d'une transaction via Stripe pour garantir la sécurité du paiement et la protection contre la fraude. Conformes à la norme PCI-DSS.</p>
            </div>

            <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
              <p className="text-white font-semibold text-sm mb-2">Cookies analytiques</p>
              <p className="text-gray-400 text-sm leading-relaxed">Permettent de mesurer l'audience et d'améliorer le service. Les données sont anonymisées. Soumis à consentement.</p>
              <div className="mt-3 text-xs text-gray-500">
                <p>→ Statistiques de navigation anonymisées (Vercel Analytics)</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">3. Durée de conservation</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants ont une durée maximale de 13 mois, conformément aux recommandations de la CNIL.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">4. Gestion de vos cookies</h2>
          <p className="text-gray-300 leading-relaxed text-sm mb-4">Vous pouvez gérer ou supprimer les cookies via les paramètres de votre navigateur :</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>→ <strong className="text-white">Chrome</strong> : Paramètres &rarr; Confidentialité et sécurité &rarr; Cookies</p>
            <p>→ <strong className="text-white">Firefox</strong> : Options &rarr; Vie privée et sécurité &rarr; Cookies</p>
            <p>→ <strong className="text-white">Safari</strong> : Préférences &rarr; Confidentialité &rarr; Cookies</p>
            <p>→ <strong className="text-white">Edge</strong> : Paramètres &rarr; Confidentialité &rarr; Cookies</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">5. Contact</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Pour toute question : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a>
          </p>
        </section>
      </div>

      <div className="border-t border-white/10 pt-8 mt-10 text-xs text-gray-500">
        Closia · <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 18 avenue Carnot, 69250 Neuville sur Saône
      </div>
    </div>
  )
}
