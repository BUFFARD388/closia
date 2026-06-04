'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: "Qu'est-ce que Closia exactement ?",
    a: "Closia est une plateforme off-market réservée aux professionnels de l'immobilier. Elle met en relation des apporteurs de biens à fort potentiel (agents, mandataires, notaires) avec des acheteurs spécialisés (marchands de biens, promoteurs, foncières, lotisseurs). Chaque bien est analysé par un expert avant d'être diffusé — ce n'est pas un portail, c'est un filtre.",
  },
  {
    q: "À qui s'adresse Closia ?",
    a: "À deux types de professionnels : d'un côté les apporteurs (agents immobiliers, mandataires, notaires) qui ont des biens complexes à placer ; de l'autre les acheteurs (marchands de biens, promoteurs, foncières, lotisseurs) qui cherchent des opportunités de valorisation. L'accès est strictement réservé aux professionnels.",
  },
  {
    q: "Quels types de biens publie Closia ?",
    a: "Uniquement des biens à fort potentiel : immeubles à restructurer ou découper, terrains divisibles, locaux à transformer, biens avec droits à bâtir résiduels, dents creuses, actifs sous-exploités. Closia ne publie jamais de biens standards vendables à des particuliers.",
  },
  {
    q: "Comment fonctionne le processus de dépôt d'un bien ?",
    a: "Vous soumettez votre dossier via le formulaire vendeur. Notre expert l'analyse sous 48h (lecture PLU, potentiel de valorisation, cohérence prix, risques). Si le bien est retenu, il est diffusé pendant 72h auprès de l'ensemble des acheteurs inscrits et sélectionnés sur la plateforme. Parmi ceux qui se positionnent, 3 acheteurs maximum peuvent acheter le lead. Vous recevez un retour dans tous les cas.",
  },
  {
    q: "Combien cela coûte-t-il pour l'apporteur ?",
    a: "Rien. La soumission d'un bien est totalement gratuite pour l'apporteur. Aucun frais, aucune commission sur la transaction. Le modèle économique de Closia repose uniquement sur les acheteurs qui débloquent les coordonnées.",
  },
  {
    q: "Combien coûte l'accès à un lead pour un acheteur ?",
    a: "Le prix dépend de la valeur du bien et du mode d'accès choisi. En lead exclusif : 490 € (bien < 300 000 €), 890 € (300k–1M €) ou 1 490 € (> 1M €). En lead partagé, les tarifs sont dégressifs selon le nombre d'acheteurs. L'inscription sur la plateforme est gratuite.",
  },
  {
    q: "Qu'est-ce que le lead exclusif et le lead partagé ?",
    a: "Le lead est diffusé à l'ensemble des acheteurs inscrits et sélectionnés sur la plateforme. Parmi ceux qui se positionnent, 3 acheteurs maximum peuvent acheter le lead. Le lead exclusif donne un accès unique aux coordonnées de l'apporteur — vous êtes le seul acheteur sur ce dossier. Le lead partagé permet à 2 ou 3 acheteurs d'accéder aux mêmes coordonnées, avec un tarif dégressif. Dans les deux cas, le bien n'est jamais diffusé publiquement.",
  },
  {
    q: "Qu'est-ce que l'analyse préalable ?",
    a: "C'est un service expert à 150 € HT : vous soumettez un bien avant même de l'inscrire sur la plateforme, et notre expert réalise une analyse complète (PLU, potentiel, faisabilité, risques) avec un rapport écrit remis sous 48h. Utile pour conforter votre position face à un vendeur ou accélérer la signature d'un mandat exclusif.",
  },
  {
    q: "Comment est garantie la confidentialité ?",
    a: "Les biens ne sont jamais diffusés publiquement. L'accès est limité à des acheteurs professionnels vérifiés et sélectionnés. Les coordonnées du vendeur ne sont transmises qu'après paiement validé. Chaque dossier disparaît automatiquement à expiration du délai de 72h. Aucune capture ni redistribution n'est autorisée.",
  },
  {
    q: "Que se passe-t-il si aucun acheteur ne se positionne en 72h ?",
    a: "Le lead expire et le dossier est retiré de la diffusion. L'apporteur est informé. Selon le potentiel du bien, une nouvelle diffusion peut être envisagée après requalification.",
  },
  {
    q: "Closia intervient-il dans la négociation ou la transaction ?",
    a: "Non. Une fois les coordonnées transmises, l'acheteur et l'apporteur traitent directement entre eux. Closia ne perçoit aucune commission sur la transaction immobilière. Notre rôle s'arrête à la mise en relation qualifiée.",
  },
  {
    q: "Comment s'inscrire sur Closia ?",
    a: "L'inscription est gratuite et immédiate. Selon votre profil, rendez-vous sur la page d'inscription apporteur ou acheteur, renseignez vos informations professionnelles (SIREN, statut, coordonnées) et accédez à la plateforme après validation de votre email.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <nav className="border-b border-white/5 px-6 lg:px-10 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src="/logo.png" alt="Closia" className="h-10 w-auto" />
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors tracking-widest uppercase">
            Retour
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Aide</p>
        <h1 className="text-3xl font-bold text-white mb-2">Questions fréquentes</h1>
        <p className="text-gray-400 mb-12">Tout ce que vous devez savoir sur Closia.</p>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className={`border rounded-xl transition-all duration-200 ${open === i ? 'border-[#c29a6b]/40 bg-[#c29a6b]/5' : 'border-white/10 bg-[#111720]'}`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="text-sm font-medium text-white">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#c29a6b] flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-gray-300 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 border border-[#c29a6b]/20 rounded-xl p-8 bg-[#c29a6b]/5 text-center">
          <p className="text-white font-semibold mb-2">Vous avez une autre question ?</p>
          <p className="text-gray-400 text-sm mb-6">Notre équipe vous répond sous 24h.</p>
          <a href="mailto:contact@closia.net"
            className="inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#b8911f] transition-colors">
            Nous contacter
          </a>
        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-gray-600">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/legal/cgu" className="hover:text-gray-400">CGU</Link>
          <Link href="/legal/cgv" className="hover:text-gray-400">CGV</Link>
          <Link href="/legal/confidentialite" className="hover:text-gray-400">Confidentialité</Link>
          <Link href="/legal/cookies" className="hover:text-gray-400">Cookies</Link>
        </div>
        <p className="mt-3">© 2026 Closia. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
