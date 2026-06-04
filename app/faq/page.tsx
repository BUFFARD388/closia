'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: "Qu'est-ce que Closia exactement ?",
    a: "Closia est une plateforme off-market reservee aux professionnels de l'immobilier. Elle met en relation des apporteurs de biens a fort potentiel (agents, mandataires, notaires) avec des acheteurs specialises (marchands de biens, promoteurs, foncieres, lotisseurs). Chaque bien est analyse par un expert avant d'etre diffuse — ce n'est pas un portail, c'est un filtre.",
  },
  {
    q: "A qui s'adresse Closia ?",
    a: "A deux types de professionnels : d'un cote les apporteurs (agents immobiliers, mandataires, notaires) qui ont des biens complexes a placer ; de l'autre les acheteurs (marchands de biens, promoteurs, foncieres, lotisseurs) qui cherchent des opportunites de valorisation. L'acces est strictement reserve aux professionnels.",
  },
  {
    q: "Quels types de biens publie Closia ?",
    a: "Uniquement des biens a fort potentiel : immeubles a restructurer ou decouper, terrains divisibles, locaux a transformer, biens avec droits a batir residuels, dents creuses, actifs sous-exploites. Closia ne publie jamais de biens standards vendables a des particuliers.",
  },
  {
    q: "Comment fonctionne le processus de depot d'un bien ?",
    a: "Vous soumettez votre dossier via le formulaire vendeur. Notre expert l'analyse sous 48h (lecture PLU, potentiel de valorisation, coherence prix, risques). Si le bien est retenu, il est diffuse pendant 72h en off-market strict aupres de 3 acheteurs professionnels maximum. Vous recevez un retour dans tous les cas.",
  },
  {
    q: "Combien cela coute-t-il pour l'apporteur ?",
    a: "Rien. La soumission d'un bien est totalement gratuite pour l'apporteur. Aucun frais, aucune commission sur la transaction. Le modele economique de Closia repose uniquement sur les acheteurs qui debloquent les coordonnees.",
  },
  {
    q: "Combien coute l'acces a un lead pour un acheteur ?",
    a: "Le prix depend de la valeur du bien et du mode d'acces choisi. En lead exclusif : 490 EUR (bien < 300 000 EUR), 890 EUR (300k-1M EUR) ou 1 490 EUR (> 1M EUR). En lead partage (2-3 acheteurs max), les tarifs sont degressifs. L'inscription sur la plateforme est gratuite.",
  },
  {
    q: "Qu'est-ce que le lead exclusif et le lead partage ?",
    a: "Le lead exclusif donne un acces immediat et unique aux coordonnees de l'apporteur — vous etes le seul acheteur sur ce dossier. Le lead partage permet a 2 ou 3 acheteurs maximum d'acceder aux memes coordonnees, avec un tarif plus bas. Dans les deux cas, le bien n'est jamais diffuse publiquement.",
  },
  {
    q: "Qu'est-ce que l'analyse prealable ?",
    a: "C'est un service expert a 150 EUR HT : vous soumettez un bien avant meme de l'inscrire sur la plateforme, et notre expert realise une analyse complete (PLU, potentiel, faisabilite, risques) avec un rapport ecrit remis sous 48h. Utile pour conforter votre position face a un vendeur ou un client.",
  },
  {
    q: "Comment est garantie la confidentialite ?",
    a: "Les biens ne sont jamais diffuses publiquement. L'acces est limite a des acheteurs professionnels verifies. Les coordonnees du vendeur ne sont transmises qu'apres paiement valide. Chaque dossier disparait automatiquement a expiration du delai de 72h. Aucune capture ni redistribution n'est autorisee.",
  },
  {
    q: "Que se passe-t-il si aucun acheteur ne se positionne en 72h ?",
    a: "Le lead expire et le dossier est retire de la diffusion. L'apporteur est informe. Selon le potentiel du bien, une nouvelle diffusion peut etre envisagee apres requalification, ou nous pouvons orienter vers d'autres solutions.",
  },
  {
    q: "Closia intervient-il dans la negociation ou la transaction ?",
    a: "Non. Une fois les coordonnees transmises, l'acheteur et l'apporteur traitent directement entre eux. Closia ne percoit aucune commission sur la transaction immobiliere. Notre role s'arrete a la mise en relation qualifiee.",
  },
  {
    q: "Comment s'inscrire sur Closia ?",
    a: "L'inscription est gratuite et immediate. Selon votre profil, rendez-vous sur la page d'inscription apporteur ou acheteur, renseignez vos informations professionnelles (SIREN, statut, coordonnees) et vous accedez a la plateforme apres validation de votre email.",
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
        <h1 className="text-3xl font-bold text-white mb-2">Questions frequentes</h1>
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
          <p className="text-gray-400 text-sm mb-6">Notre equipe vous repond sous 24h.</p>
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
          <Link href="/legal/confidentialite" className="hover:text-gray-400">Confidentialite</Link>
          <Link href="/legal/cookies" className="hover:text-gray-400">Cookies</Link>
        </div>
        <p className="mt-3">2026 Closia. Tous droits reserves.</p>
      </footer>
    </div>
  )
}
