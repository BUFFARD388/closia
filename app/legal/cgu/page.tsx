import Link from 'next/link'

export default function CGU() {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mentions légales</p>
      <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
      <p className="text-gray-400 mb-12">Dernière mise à jour : juin 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">1. Présentation de la plateforme</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Closia est une plateforme numérique de mise en relation entre des apporteurs de biens immobiliers à fort potentiel (agents immobiliers, mandataires, notaires) et des acheteurs professionnels (marchands de biens, promoteurs, foncières, lotisseurs). Elle est éditée par Laurent Buffard, dont le siège est situé au 18 avenue Carnot, 69250 Neuville sur Saône, immatriculé au RCS de Lyon sous le numéro 401 801 204.
          </p>
          <p className="text-gray-300 leading-relaxed text-sm mt-3">
            L'utilisation de la plateforme closia.net implique l'acceptation pleine et entière des présentes CGU.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">2. Accès à la plateforme</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            La plateforme est exclusivement réservée aux professionnels de l'immobilier. L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes et complètes lors de son inscription, notamment son numéro SIREN, son identité et ses coordonnées professionnelles.
          </p>
          <p className="text-gray-300 leading-relaxed text-sm mt-3">
            Closia se réserve le droit de refuser ou de suspendre tout accès en cas d'informations erronées ou d'usage non conforme.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">3. Obligations des utilisateurs</h2>
          <p className="text-gray-300 leading-relaxed text-sm mb-3">L'utilisateur s'engage à :</p>
          <div className="space-y-2 text-sm text-gray-300">
            <p className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Utiliser la plateforme dans un cadre strictement professionnel et légal</p>
            <p className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Ne pas diffuser ni transmettre à des tiers les informations reçues via la plateforme</p>
            <p className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Respecter la confidentialité des dossiers et coordonnées auxquels il accède</p>
            <p className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Ne soumettre que des biens pour lesquels il dispose d'un mandat ou d'une autorisation</p>
            <p className="flex gap-2"><span className="text-[#c29a6b] flex-shrink-0">→</span> Ne pas tenter de contourner le système de paiement ou d'accéder frauduleusement aux coordonnées</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">4. Fonctionnement de la plateforme</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Les biens soumis font l'objet d'une analyse experte par Closia avant toute diffusion. Closia se réserve le droit d'accepter ou de refuser tout dossier. En cas de validation, le bien est diffusé pendant une durée de 3 à 10 jours selon son potentiel, auprès d'un nombre limité d'acheteurs professionnels qualifiés.
          </p>
          <p className="text-gray-300 leading-relaxed text-sm mt-3">
            L'acheteur qui débloque un lead accède aux coordonnées complètes de l'apporteur et prend contact directement avec lui. Closia n'intervient pas dans la négociation ni dans la transaction.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">5. Responsabilité</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Closia agit en qualité d'intermédiaire de mise en relation et ne saurait être tenu responsable des transactions conclues entre les utilisateurs, des informations inexactes transmises par les apporteurs, ni des décisions d'investissement prises par les acheteurs.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">6. Propriété intellectuelle</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            L'ensemble des éléments constituant la plateforme Closia (textes, visuels, interface, logique applicative, marque, logo) est protégé par le droit d'auteur et appartient exclusivement à Laurent Buffard. Toute reproduction sans autorisation écrite est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#c29a6b] uppercase tracking-widest mb-4">7. Droit applicable</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Les présentes CGU sont soumises au droit français. En cas de litige, le tribunal compétent sera celui du ressort de Lyon.
          </p>
        </section>
      </div>

      <div className="border-t border-white/10 pt-8 mt-10 text-xs text-gray-500">
        Contact : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 06 87 76 33 40 · 18 avenue Carnot, 69250 Neuville sur Saône
      </div>
    </div>
  )
}
