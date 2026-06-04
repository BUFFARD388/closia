export default function Cookies() {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mentions légales</p>
      <h1 className="text-3xl font-bold text-white mb-2">Politique de cookies</h1>
      <p className="text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">1. Qu'est-ce qu'un cookie ?</h2>
        <p className="text-gray-300 leading-relaxed">
          Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) lors de la visite d'un site web. Il permet de reconnaître votre navigateur et de mémoriser certaines informations pour améliorer votre expérience.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">2. Cookies utilisés sur Closia</h2>

        <div className="space-y-4">
          <div className="bg-[#111720] border border-[#c29a6b]/20 rounded-xl p-5">
            <p className="text-[#c29a6b] font-semibold text-sm mb-2">Cookies strictement nécessaires</p>
            <p className="text-gray-400 text-sm leading-relaxed">Indispensables au fonctionnement de la plateforme. Ils gèrent la session utilisateur, l'authentification et la sécurité. Ils ne peuvent pas être désactivés. <strong className="text-white">Aucun consentement requis.</strong></p>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>→ <code className="text-gray-300">sb-auth-token</code> — session Supabase (authentification)</p>
              <p>→ <code className="text-gray-300">next-auth.session</code> — session Next.js</p>
            </div>
          </div>

          <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
            <p className="text-white font-semibold text-sm mb-2">Cookies de paiement (Stripe)</p>
            <p className="text-gray-400 text-sm leading-relaxed">Déposés lors d'une transaction via Stripe. Ils garantissent la sécurité du paiement et la protection contre la fraude. Traitement conforme à la norme PCI-DSS.</p>
            <div className="mt-3 text-xs text-gray-500">
              <p>→ Cookies Stripe — session de paiement sécurisée</p>
            </div>
          </div>

          <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
            <p className="text-white font-semibold text-sm mb-2">Cookies analytiques</p>
            <p className="text-gray-400 text-sm leading-relaxed">Permettent de mesurer l'audience et d'améliorer le service. Les données sont anonymisées et ne permettent pas d'identifier un utilisateur individuellement. <strong className="text-white">Soumis à consentement.</strong></p>
            <div className="mt-3 text-xs text-gray-500">
              <p>→ Statistiques de navigation anonymisées (Vercel Analytics)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">3. Durée de conservation</h2>
        <p className="text-gray-300 leading-relaxed">
          Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants ont une durée maximale de 13 mois, conformément aux recommandations de la CNIL.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">4. Gestion de vos cookies</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Vous pouvez à tout moment gérer ou supprimer les cookies via les paramètres de votre navigateur :
        </p>
        <div className="space-y-2 text-sm text-gray-400">
          <p>→ <strong className="text-white">Chrome</strong> : Paramètres → Confidentialité et sécurité → Cookies</p>
          <p>→ <strong className="text-white">Firefox</strong> : Options → Vie privée et sécurité → Cookies</p>
          <p>→ <strong className="text-white">Safari</strong> : Préférences → Confidentialité → Cookies</p>
          <p>→ <strong className="text-white">Edge</strong> : Paramètres → Confidentialité → Cookies</p>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mt-4">
          Attention : la désactivation des cookies strictement nécessaires peut empêcher l'accès aux fonctionnalités de la plateforme nécessitant une authentification.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">5. Contact</h2>
        <p className="text-gray-300 leading-relaxed">
          Pour toute question relative aux cookies ou à la protection de vos données, contactez-nous à <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a>.
        </p>
      </section>

      <div className="border-t border-white/10 pt-8 text-xs text-gray-500">
        Closia · <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 18 avenue Carnot, 69250 Neuville sur Saône
      </div>
    </div>
  )
}
