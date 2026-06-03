'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<'vendeurs' | 'acheteurs' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [bienIdx, setBienIdx] = useState(0)
  const [analyseModal, setAnalyseModal] = useState(false)
  const [analyseType, setAnalyseType] = useState<'simple' | 'complexe' | null>(null)
  const [analyseForm, setAnalyseForm] = useState({ nom: '', email: '', tel: '', adresse: '', description: '', message: '' })
  const [analyseFiles, setAnalyseFiles] = useState<File[]>([])
  const [analyseSending, setAnalyseSending] = useState(false)
  const [analyseSent, setAnalyseSent] = useState(false)

  const TEMOIGNAGES = [
    { role: 'Mandataire immobilier', region: 'Région lyonnaise', initiale: 'S.R.', type: 'apporteur',
      texte: "J'avais un immeuble complexe sur les bras — mon client voulait vendre vite mais le bien ne correspondait à rien de standard. Closia l'a analysé en moins de 48h et m'a donné une réponse claire. Le lead a été acheté en 30h." },
    { role: 'Marchand de biens', region: 'Bordeaux', initiale: 'T.M.', type: 'acheteur',
      texte: "Ce que j'apprécie sur Closia, c'est que je ne reçois que des dossiers qui ont déjà été lus par quelqu'un qui connaît son métier. Je ne perds plus de temps. Quand un lead arrive, je sais qu'il y a quelque chose à faire." },
    { role: 'Agent immobilier', region: 'Marseille', initiale: 'A.D.', type: 'apporteur',
      texte: "Je n'aurais jamais pu analyser seul le potentiel de division de ce terrain. Grâce à Closia j'ai pu proposer une vraie solution à mon client, signer le mandat exclusif, et le bien a trouvé preneur en off-market." },
    { role: 'Promoteur immobilier', region: 'Lyon', initiale: 'R.B.', type: 'acheteur',
      texte: "Sur Closia, les dossiers arrivent déjà filtrés. L'analyse PLU est faite, le potentiel est identifié. Je gagne un temps précieux et je peux me concentrer sur les négociations plutôt que sur le tri." },
    { role: 'Notaire', region: 'Toulouse', initiale: 'C.V.', type: 'apporteur',
      texte: "Certains biens de succession sont complexes à valoriser. Closia m'a permis de proposer une solution rapide et sérieuse à la famille. Réponse en 48h, vente conclue en off-market. Discret et efficace." },
  ]

  const BIENS_SLIDER = [
    { icon: '⊞', titre: 'Division parcellaire', desc: 'Maison sur grande parcelle divisible en 2 lots constructibles. Potentiel fort dans les zones périurbaines.', ex: 'Ex : maison 150m² sur 1 200m² → lot détaché de 600m² constructible' },
    { icon: '↗', titre: 'Promotion immobilière', desc: "Bureaux, locaux ou terrains à transformer en logements. Changement de destination selon PLU.", ex: 'Ex : plateau de bureaux 300m² → 6 logements en zone UA' },
    { icon: '◲', titre: 'Droits à bâtir résiduels', desc: "Bien existant avec potentiel de surélévation ou d'extension. Étage supplémentaire selon CES résiduel.", ex: 'Ex : immeuble R+2 → élévation R+3 autorisée, création de 2 appartements' },
    { icon: '◎', titre: 'Dent creuse & foncier', desc: "Terrain sous-coté dans une zone constructible. Lecture PLU favorable, potentiel non exploité.", ex: 'Ex : terrain 400m² en zone UB → permis de construire R+2 faisable' },
    { icon: '⊟', titre: 'Immeuble à restructurer', desc: "Immeuble dégradé ou sous-exploité à découper en lots et repositionner. Création de valeur par la restructuration.", ex: 'Ex : immeuble mixte R+3 → 8 lots vendables séparément après travaux' },
    { icon: '▣', titre: 'Actif sous-exploité', desc: "Combles aménageables, locaux vacants, CES résiduels. Valorisation sans démolition.", ex: 'Ex : combles perdus 80m² → T3 créé, valeur ajoutée nette 120 000€' },
  ]

  // Auto-slide témoignages
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TEMOIGNAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash
      if (hash === '#vendeurs') setActiveSection('vendeurs')
      else if (hash === '#acheteurs') setActiveSection('acheteurs')
      else setActiveSection(null)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="min-h-screen bg-[#0b1220] text-white font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b1220]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between py-3">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.png" alt="Closia" className="h-14 sm:h-20 w-auto" />
          </div>

          {/* Nav links desktop */}
          <div className="hidden md:flex items-center gap-8 text-xs tracking-widest uppercase text-gray-400">
            <a href="#confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#vendeurs" className="hover:text-white transition-colors">Vendeurs pro</a>
            <a href="#acheteurs" className="hover:text-white transition-colors">Acheteurs pro</a>
            <Link href="/auth/login" className="hover:text-white transition-colors">Connexion</Link>
          </div>

          <Link
            href="/auth/register/acheteur"
            className="hidden md:inline-flex items-center text-xs tracking-widest uppercase bg-white text-black font-semibold px-5 py-2.5 hover:bg-gray-100 transition-colors rounded-lg"
          >
            Accéder aux opportunités
          </Link>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2"
          >
            {menuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <div className="md:hidden bg-[#111720] border-t border-white/10 px-6 py-6 space-y-4">
            <a href="#vendeurs" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5 tracking-widest uppercase">Vendeurs pro</a>
            <a href="#acheteurs" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5 tracking-widest uppercase">Acheteurs pro</a>
            <a href="#confidentialite" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5 tracking-widest uppercase">Confidentialité</a>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5 tracking-widest uppercase">Connexion</Link>
            <div className="pt-2 space-y-3">
              <Link href="/auth/register/acheteur" onClick={() => setMenuOpen(false)} className="block text-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3 rounded-lg">
                Accéder aux opportunités — Gratuit
              </Link>
              <Link href="/auth/register/vendeur" onClick={() => setMenuOpen(false)} className="block text-center text-xs tracking-widest uppercase border border-white/20 text-white px-6 py-3 rounded-lg">
                Soumettre un bien
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 sm:pt-40 pb-12 sm:pb-20 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Texte */}
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-8">
              Off-market réservé aux professionnels
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6 text-white">
              Des opportunités immobilières filtrées par un expert
            </h1>
            <p className="text-base text-gray-400 leading-relaxed mb-12 max-w-xl">
              Pas un portail. Pas un algorithme. Opportunités réservées aux professionnels qui créent de la valeur.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/auth/register/acheteur"
                className="inline-flex items-center text-xs tracking-widest uppercase bg-white text-black font-semibold px-5 py-2 hover:bg-gray-100 transition-colors rounded-lg"
              >
                Accéder aux opportunités
              </Link>
              <span className="text-xs text-gray-400">
                Réservé aux acheteurs professionnels · <span className="text-[#c29a6b]">Inscription gratuite</span>
              </span>
            </div>
          </div>

          {/* Photo + identité */}
          <div className="hidden lg:flex flex-col items-center gap-6">
            <div className="relative">
              {/* Halo doré derrière */}
              <div className="absolute inset-0 rounded-full bg-[#c29a6b]/10 blur-2xl scale-110" />
              <img
                src="/laurent.jpg"
                alt="Laurent Buffard"
                className="relative w-64 h-64 rounded-full object-cover object-top border border-[#c29a6b]/30"
              />
              {/* Badge flottant */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0b1220] border border-[#c29a6b]/40 rounded-full px-5 py-2 whitespace-nowrap">
                <p className="text-xs text-[#c29a6b] font-medium tracking-widest uppercase">Expert valorisation</p>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-white font-semibold">Laurent Buffard</p>
              <p className="text-xs text-gray-500 mt-1">20 ans d'expérience · Fondateur de Closia</p>
            </div>

            {/* Mini stats */}
            <div className="flex gap-6 text-center">
              {[
                { val: '20 ans', label: "d'expérience" },
                { val: '48h', label: "d'analyse" },
                { val: '0 €', label: 'pour l\'apporteur' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-sm font-bold text-[#c29a6b]">{s.val}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── PROBLÉMATIQUES ── */}
      <section className="px-6 lg:px-10 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Côté acheteur */}
            <div className="relative border border-[#c29a6b]/20 rounded-2xl p-10 overflow-hidden group hover:border-[#c29a6b]/50 transition-all duration-500 bg-[#c29a6b]/[0.03]">
              <div className="absolute top-0 left-0 w-px h-24 bg-gradient-to-b from-[#c29a6b] to-transparent" />
              <p className="text-xs tracking-[0.3em] uppercase text-[#c29a6b] mb-10">Marchands · Promoteurs · Foncières</p>
              <h2 className="text-2xl font-bold leading-snug mb-6">Seuls les dossiers qui méritent<br />votre attention arrivent jusqu'à vous.</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">Les professionnels de la valorisation immobilière passent un temps considérable à écarter des dossiers qui n'auraient jamais dû leur parvenir. Chaque heure perdue sur un bien sans potentiel est une opportunité manquée ailleurs.</p>
              <p className="text-sm text-gray-300 leading-relaxed mb-10">Sur Closia, chaque bien a été lu, analysé et validé par un expert avant d'être diffusé. Vous ne recevez que des dossiers à potentiel, en off-market strict, disponibles <strong className="text-white">72h</strong> — jamais vus sur le marché ouvert.</p>
              <div className="border-t border-[#c29a6b]/15 pt-8">
                <p className="text-xs text-gray-600 mb-4 tracking-widest uppercase">Ce que vous gagnez</p>
                <div className="space-y-2 text-sm text-gray-400 mb-8">
                  <p>→ Des dossiers pré-qualifiés, prêts à étudier</p>
                  <p>→ Un accès filtré par type, zone ou prix</p>
                  <p>→ Des opportunités fraîches, jamais diffusées</p>
                </div>
                <Link href="/auth/register/acheteur" className="inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3 hover:bg-[#b8911f] transition-all duration-300 rounded-lg">
                  Rejoindre — Inscription gratuite
                </Link>
              </div>
            </div>

            {/* Côté apporteur */}
            <div className="relative border border-white/10 rounded-2xl p-10 overflow-hidden group hover:border-white/20 transition-all duration-500">
              {/* Accent discret */}
              <div className="absolute top-0 left-0 w-px h-24 bg-gradient-to-b from-white/40 to-transparent" />

              <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-8">Agents · Mandataires · Notaires</p>

              {/* Accroche principale */}
              <h2 className="text-2xl font-bold leading-snug mb-3">
                Vous maîtrisez 90 % du marché.
              </h2>
              <h3 className="text-2xl font-bold text-gray-400 leading-snug mb-6">
                Closia vous aide sur les 10 % restants.
              </h3>

              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Un immeuble à découper, un terrain divisible, un local à transformer — ces biens demandent une analyse métier, une lecture PLU, une vision de valorisation et un réseau d'acheteurs pros. Ce n'est pas le métier d'un agent. <span className="text-white">C'est le métier de Closia.</span>
              </p>

              {/* Les 5 piliers */}
              <div className="space-y-3 mb-8">
                {[
                  { n: '01', titre: 'Analyse expert sous 48h', desc: "Potentiel, risques, axes de valorisation, faisabilité, cohérence prix. Vous gagnez en crédibilité — et vous signez votre mandat exclusif plus facilement." },
                  { n: '02', titre: 'Réseau national d\'acheteurs pros', desc: "Marchands de biens, promoteurs, foncières, lotisseurs. Des acheteurs actifs que vous n'avez pas dans votre réseau." },
                  { n: '03', titre: 'Réponse marché en 72h', desc: "Vous pouvez annoncer à votre vendeur : \"Vous aurez une réponse marché en 72h.\" C'est un argument massif pour signer." },
                  { n: '04', titre: 'Confidentialité totale', desc: "Aucune diffusion publique, aucune fuite, aucun bruit. Vous gardez le contrôle. Le dossier reste propre." },
                ].map((p) => (
                  <div key={p.n} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                    <span className="text-xs font-black text-white/20 group-hover:text-[#c29a6b]/40 transition-colors flex-shrink-0 pt-0.5">{p.n}</span>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{p.titre}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pitch synthèse */}
              <div className="border-l-2 border-white/20 pl-5 mb-8">
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "Closia est votre support expert pour les biens à potentiel. Vous déposez. Nous analysons. Le marché répond en 72h."
                </p>
              </div>

              <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs text-gray-400 leading-relaxed">
                  <span className="text-white font-medium">Un support, pas un concurrent.</span> Closia renforce votre position auprès du vendeur. Le mandat exclusif reste le vôtre. Aucun frais, aucune commission.
                </div>
                <Link href="/auth/register/vendeur" className="inline-flex items-center text-xs tracking-widest uppercase bg-white text-black font-semibold px-6 py-3 hover:bg-gray-100 transition-all duration-300 rounded-lg">
                  Soumettre un dossier gratuitement
                </Link>
                <a href="#analyse" className="inline-flex items-center text-xs tracking-widest uppercase border border-[#c29a6b]/40 text-[#c29a6b] font-semibold px-6 py-3 hover:bg-[#c29a6b]/10 transition-all duration-300 rounded-lg">
                  Demander une analyse préalable
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CHIFFRES ── */}
      <section className="px-6 lg:px-10 py-28">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-3">En chiffres</p>
          <p className="text-lg font-semibold text-white mb-10">La rigueur, mesurable.</p>
          <div className="w-10 h-px bg-white/20 mb-10" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { val: '100 %', label: 'dossiers qualifiés par un expert', gold: true },
              { val: '72h', label: 'délai de disponibilité garanti', gold: false },
              { val: '20 ans', label: "d'expérience terrain", gold: false },
              { val: '0', label: 'biens standards, jamais.', gold: false },
            ].map((s, i) => (
              <div
                key={i}
                className={`p-8 rounded-xl border transition-all duration-300 hover:border-[#c29a6b]/40 hover:bg-[#c29a6b]/5 group ${
                  s.gold
                    ? 'border-[#c29a6b]/30 bg-[#c29a6b]/5'
                    : 'border-white/10 bg-[#111720]'
                }`}
              >
                <div className={`text-3xl font-bold mb-2 ${s.gold ? 'text-[#c29a6b]' : 'text-white group-hover:text-[#c29a6b] transition-colors duration-300'}`}>
                  {s.val}
                </div>
                <div className="text-xs text-gray-400 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Citation */}
          <div className="mt-12 border-l-2 border-white/20 pl-6 max-w-lg">
            <p className="text-base italic text-gray-300 leading-relaxed">
              « Si le dossier passe par nous, c'est qu'il a déjà été filtré.<br />
              C'est ça que vous achetez. »
            </p>
          </div>
        </div>
      </section>

      {/* ── POURQUOI CLOSIA EXISTE ── */}
      <section className="bg-[#111720] px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c29a6b] mb-4">Le constat</p>
          <h2 className="text-3xl font-bold mb-8">Pourquoi Closia existe</h2>
          <div className="w-8 h-px bg-white/20 mb-12" />

          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#c29a6b] mb-3">Le problème côté acheteur</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Les professionnels qui créent réellement de la valeur — marchands, promoteurs, foncières — perdent un temps considérable à trier des dossiers qui n'auraient jamais dû leur parvenir.
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#c29a6b] mb-3">Le problème côté vendeur</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                La grande majorité des agents ont un réseau de 1 ou 2 marchands de biens. Ils ne savent pas valoriser un bien technique ni analyser son potentiel réel. Ces opportunités se perdent dans la masse, mal comprises, mal orientées.
              </p>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#c29a6b] mb-3">Notre réponse</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Closia filtre, analyse et qualifie uniquement les biens où un professionnel peut créer de la valeur. Pas de bruit. Une sélection off-market, experte, exploitable immédiatement.
              </p>
              <div className="mt-6 border-l-2 border-white/20 pl-4">
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  Là où les portails s'arrêtent,<br />Closia commence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── L'EXPERT ── */}
      <section className="px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Texte gauche */}
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-6">L'expert</p>
              <h2 className="text-3xl font-bold mb-6 leading-snug">
                Pourquoi l'expérience<br />compte plus que les données.
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                En immobilier professionnel, la solidité d'un dossier repose sur la lecture qu'on en fait. Un algorithme ne lit pas un PLU. Il ne voit pas une dent creuse. Il n'anticipe pas la stratégie de sortie d'un marchand de biens.
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Chaque opportunité publiée sur Closia est analysée, challengée et qualifiée par un expert dont le parcours couvre l'ensemble du spectre de la valorisation immobilière.
              </p>
            </div>

            {/* Grille expertise droite */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { n: '20 ans', label: 'de transaction immobilière' },
                { n: '↗', label: 'Promotion immobilière' },
                { n: '⊞', label: 'Opérations marchand de biens' },
                { n: '↗', label: 'Lead foncier promoteurs' },
                { n: '⊞', label: 'Développement foncier' },
                { n: '◎', label: 'Réseau professionnel actif' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`relative p-5 rounded-xl border transition-all duration-300 group hover:border-[#c29a6b]/40 hover:bg-[#c29a6b]/5 ${
                    i === 0
                      ? 'border-[#c29a6b]/40 bg-[#c29a6b]/5'
                      : 'border-white/10 bg-[#111720]'
                  }`}
                >
                  <div className={`text-lg font-bold mb-2 ${i === 0 ? 'text-[#c29a6b]' : 'text-white/20 group-hover:text-[#c29a6b]/40 transition-colors'}`}>
                    {item.n}
                  </div>
                  <div className="text-sm text-gray-300 leading-snug">{item.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── NOTRE PARTI PRIS ── */}
      <section className="bg-[#111720] px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">Notre parti pris</p>
          <h2 className="text-3xl font-bold mb-2">Une maison standard n'a pas besoin de nous.</h2>
          <h3 className="text-3xl font-bold text-[#c29a6b] mb-8">Un immeuble à découper, si.</h3>
          <p className="text-sm text-gray-400 mb-2 max-w-2xl leading-relaxed">
            Les portails classiques savent vendre un bien lisible.
          </p>
          <p className="text-sm text-gray-400 mb-16 max-w-2xl leading-relaxed">
            Notre métier commence là où il faut une lecture urbanistique, de l'imagination, une stratégie patrimoniale
            — là où le vendeur voit un bien, et où le professionnel voit une création de valeur.
          </p>

          {/* Ce que nous publions */}
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">Ce que nous publions</p>
          <h3 className="text-2xl font-bold mb-2">Uniquement des biens à potentiel,</h3>
          <p className="text-2xl font-bold text-gray-400 mb-10">jamais des biens standards.</p>

          {/* Slider biens */}
          <div className="mb-8">
            {/* Tabs navigation */}
            <div className="flex gap-2 flex-wrap mb-6">
              {BIENS_SLIDER.map((b, i) => (
                <button key={i} onClick={() => setBienIdx(i)}
                  className={`text-xs px-4 py-2 rounded-full transition-all duration-300 ${i === bienIdx ? 'bg-[#c29a6b] text-black font-semibold' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  {b.titre}
                </button>
              ))}
            </div>

            {/* Contenu actif */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${bienIdx * 100}%)` }}
              >
                {BIENS_SLIDER.map((b, i) => (
                  <div key={i} className="w-full flex-shrink-0">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-8 rounded-2xl border border-[#c29a6b]/20 bg-[#c29a6b]/5">
                        <div className="text-4xl mb-5">{b.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-3">{b.titre}</h3>
                        <p className="text-sm text-gray-300 leading-relaxed mb-6">{b.desc}</p>
                        <div className="border-t border-[#c29a6b]/15 pt-5">
                          <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-2">Exemple concret</p>
                          <p className="text-sm text-gray-400 italic">{b.ex}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        {BIENS_SLIDER.filter((_, idx) => idx !== i).slice(0, 3).map((other, j) => (
                          <button key={j} onClick={() => setBienIdx(BIENS_SLIDER.indexOf(other))}
                            className="text-left p-4 rounded-xl border border-white/10 bg-[#0b1220] hover:border-[#c29a6b]/30 transition-all group flex items-center gap-4">
                            <span className="text-xl opacity-40 group-hover:opacity-100 transition-opacity">{other.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{other.titre}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{other.desc.slice(0, 50)}…</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#c29a6b] ml-auto transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ce que nous refusons */}
          <p className="text-xs tracking-[0.2em] uppercase text-[#c29a6b] mb-4">Ce que nous refusons.</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>→ Biens standards vendables à des particuliers.</p>
            <p>→ Biens sans potentiels de valorisation.</p>
            <p>→ Des prix déjà alignés sur le marché.</p>
          </div>
        </div>
      </section>

      {/* ── MÉTHODE 3 ÉTAPES ── */}
      <section className="px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">Méthode</p>
          <h2 className="text-2xl font-bold mb-2">Trois étapes pour une opportunité qualifiée.</h2>
          <p className="text-sm text-gray-400 mb-16">Une qualification experte, un processus clair, un lead réellement exploitable.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                title: 'Dépôt qualifié',
                desc: "Le vendeur professionnel dépose un bien à potentiel, sous mandat exclusif et non diffusé sur le marché. Le dossier entre en file de qualification expert.",
                detail: 'Sous 48h',
              },
              {
                n: '02',
                title: 'Analyse & diffusion 72h',
                desc: "Lecture métier, axes de valorisation, risques urbains. Si le bien est retenu, il est diffusé 72h en exclusivité auprès de 3 acheteurs pro maximum.",
                detail: 'Max 3 acheteurs',
              },
              {
                n: '03',
                title: 'Lead débloqué',
                desc: "L'acheteur pro achète le lead et accède aux coordonnées complètes du vendeur. Relation directe. Aucune commission sur la transaction.",
                detail: 'Sans commission',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="relative p-7 rounded-xl border border-white/10 bg-[#111720] hover:border-[#c29a6b]/30 transition-all duration-300 group"
              >
                {/* Ligne de connexion entre étapes */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 -right-2 w-4 h-px bg-[#c29a6b]/30 z-10" />
                )}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl font-black text-white/10 group-hover:text-[#c29a6b]/20 transition-colors duration-300">{step.n}</span>
                  <span className="text-xs text-[#c29a6b] tracking-widest uppercase border border-[#c29a6b]/30 px-2.5 py-1 rounded-full">
                    {step.detail}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREUVE SOCIALE ── */}
      <section className="px-6 lg:px-10 py-24 bg-[#111720]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-3">Ils ont utilisé Closia</p>
              <h2 className="text-2xl font-bold">Ce qu'en disent les professionnels.</h2>
            </div>
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <button onClick={() => setTestimonialIdx(i => (i - 1 + TEMOIGNAGES.length) % TEMOIGNAGES.length)}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:border-white hover:text-white transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">{testimonialIdx + 1} / {TEMOIGNAGES.length}</span>
              <button onClick={() => setTestimonialIdx(i => (i + 1) % TEMOIGNAGES.length)}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:border-white hover:text-white transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slider témoignage */}
          <div className="relative overflow-hidden mb-6">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${testimonialIdx * 100}%)` }}
            >
              {TEMOIGNAGES.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-0">
                  <div className={`relative p-8 sm:p-10 rounded-2xl border ${t.type === 'acheteur' ? 'border-[#c29a6b]/20 bg-[#c29a6b]/5' : 'border-white/10 bg-[#0b1220]'}`}>
                    <div className="text-6xl font-serif text-[#c29a6b]/15 leading-none mb-4">"</div>
                    <p className="text-base sm:text-lg text-gray-200 leading-relaxed italic mb-8 max-w-3xl">{t.texte}</p>
                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${t.type === 'acheteur' ? 'bg-[#c29a6b]/20 text-[#c29a6b]' : 'bg-white/10 text-white'}`}>
                        {t.initiale}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.role}</p>
                        <p className="text-xs text-gray-500">{t.region}</p>
                      </div>
                      <span className={`ml-auto text-xs px-3 py-1 rounded-full border ${t.type === 'acheteur' ? 'border-[#c29a6b]/30 text-[#c29a6b]' : 'border-white/10 text-gray-500'}`}>
                        {t.type === 'acheteur' ? 'Acheteur pro' : 'Apporteur'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs points */}
          <div className="flex justify-center gap-2 mb-16">
            {TEMOIGNAGES.map((_, i) => (
              <button key={i} onClick={() => setTestimonialIdx(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === testimonialIdx ? 'w-8 bg-[#c29a6b]' : 'w-2 bg-white/20'}`} />
            ))}
          </div>

          {/* Chiffres clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '< 48h', label: 'Délai de réponse', sub: 'après soumission' },
              { val: '72h', label: 'Diffusion max', sub: 'off-market strict' },
              { val: '3 max', label: 'Acheteurs / lead', sub: 'concurrence maîtrisée' },
              { val: '0 €', label: 'Pour l\'apporteur', sub: 'aucune commission' },
            ].map((s, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-white/10 bg-[#0b1220] hover:border-[#c29a6b]/30 transition-all">
                <div className="text-2xl font-bold text-[#c29a6b] mb-1">{s.val}</div>
                <div className="text-sm font-medium text-white mb-1">{s.label}</div>
                <div className="text-xs text-gray-500">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONFIDENTIALITÉ ── */}
      <section id="confidentialite" className="bg-[#111720] px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c29a6b] mb-4">Engagement de confidentialité</p>
          <h2 className="text-2xl font-bold mb-2">Les biens restent strictement privés.</h2>
          <p className="text-xl text-gray-400 mb-12">C'est ça, la qualité d'un lead.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {[
              { n: '01', icon: '🔍', title: "Pendant l'étude", desc: "Le dossier est analysé en interne par un expert. Aucune donnée vendeur n'est visible tant que la qualification n'est pas validée." },
              { n: '02', icon: '🔒', title: 'Côté acheteur', desc: "Accès strictement réservé aux professionnels. Toute redistribution ou transmission à un tiers entraîne une exclusion immédiate." },
              { n: '03', icon: '⏱', title: 'Pendant la diffusion', desc: "Le bien n'apparaît qu'aux acheteurs professionnels qualifiés. Aucune diffusion publique, aucun partage, aucune capture." },
              { n: '04', icon: '✓', title: 'Côté vendeur', desc: "Le vendeur conserve l'exclusivité (ou co-exclusivité, max 3). Le dossier disparaît automatiquement à expiration." },
            ].map((item, i) => (
              <div
                key={i}
                className="relative p-6 rounded-xl border border-white/10 bg-[#0b1220] hover:border-[#c29a6b]/30 hover:bg-[#c29a6b]/5 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-2xl font-black text-white/5 group-hover:text-[#c29a6b]/15 transition-colors">{item.n}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="border-l-2 border-white/20 pl-5 mb-16">
            <p className="text-sm text-gray-300 italic">Un lead de valeur est un lead qui n'a pas déjà fait le tour du marché.</p>
          </div>

          {/* CTA blocs vendeur / acheteur */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vendeurs */}
            <div id="vendeurs" className={`border p-8 rounded-xl transition-all duration-500 ${
              activeSection === 'vendeurs'
                ? 'border-white bg-white/5 shadow-lg shadow-white/5 scale-[1.02]'
                : 'border-white/10'
            }`}>
              <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">Vendeurs pro.</p>
              <h3 className="text-2xl font-bold mb-6">Agents, mandataires,<br />notaires.</h3>
              <ul className="space-y-2 text-xs text-gray-400 mb-8">
                {[
                  ['Qualification expert', 'Analyse métier sous 24–48h.'],
                  ['Valorisation précise', 'Potentiel, risques, axes de création de valeur.'],
                  ['Diffusion confidentielle', "72h auprès d'acheteurs pro uniquement."],
                  ['Choix exclusif ou co-exclusif', 'Max 3 acheteurs.'],
                  ['Aucun engagement vendeur', 'Aucun frais, aucune commission.'],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2">
                    <span className="text-white font-medium flex-shrink-0">→ {bold} —</span>
                    <span>{rest}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register/vendeur"
                className="inline-flex items-center text-xs tracking-widest uppercase bg-white text-black font-semibold px-6 py-3 hover:bg-gray-100 transition-colors rounded-lg"
              >
                Soumettre un dossier
              </Link>
            </div>

            {/* Acheteurs */}
            <div id="acheteurs" className={`border p-8 rounded-xl transition-all duration-500 ${
              activeSection === 'acheteurs'
                ? 'border-[#c29a6b] bg-[#c29a6b]/10 shadow-lg shadow-[#c29a6b]/10 scale-[1.02]'
                : 'border-[#c29a6b]/40 bg-[#c29a6b]/5'
            }`}>
              <p className="text-xs tracking-[0.2em] uppercase text-[#c29a6b] mb-4">Acheteurs pro.</p>
              <h3 className="text-2xl font-bold mb-6">Marchands, promoteurs,<br />foncières, lotisseurs.</h3>
              <ul className="space-y-2 text-xs text-gray-400 mb-8">
                {[
                  ['Filtrage par potentiel', 'Opportunités à forte valeur ajoutée.'],
                  ['Avis expert intégré', 'Lecture urbanistique, risques, faisabilité.'],
                  ['Dossiers frais', 'Jamais diffusés ailleurs, jamais publics.'],
                  ['Lead débloqué immédiatement', 'Accès direct vendeur.'],
                  ['Aucune commission', 'Relation directe, sans intermédiaire.'],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2">
                    <span className="text-white font-medium flex-shrink-0">→ {bold} —</span>
                    <span>{rest}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/register/acheteur"
                  className="inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3 hover:bg-[#b8911f] transition-colors rounded-lg"
                >
                  Rejoindre le cercle pro
                </Link>
                <span className="text-xs text-gray-500">Inscription gratuite · Accès immédiat aux leads</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFIL EXPERT ── */}
      <section className="px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c29a6b] mb-4">L'expert derrière Closia</p>
          <h2 className="text-2xl font-bold mb-2">Laurent Buffard</h2>
          <p className="text-sm text-gray-400 mb-16">Professionnel de l'immobilier · Fondateur de Closia</p>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Photo + identité */}
            <div>
              <div className="mb-8">
                <img
                  src="/laurent.jpg"
                  alt="Laurent Buffard"
                  className="w-48 h-48 object-cover object-top rounded-full border-2 border-[#c29a6b]/40"
                />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Professionnel de l'immobilier avec une vision globale du marché, j'ai évolué sur l'ensemble des dimensions du secteur.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                {[
                  'Transaction immobilière (accompagnement vendeurs / acquéreurs)',
                  'Formation et montée en compétence de mandataires',
                  'Management et structuration de réseaux commerciaux',
                  'Collaboration avec marchands de biens, investisseurs et promoteurs',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-[#c29a6b] flex-shrink-0 mt-0.5">→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expertise détaillée */}
            <div className="space-y-10">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">Expertise spécifique</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">
                  Au fil de ces expériences, j'ai développé une expertise spécifique : <strong className="text-white">l'identification et la valorisation de biens à fort potentiel.</strong>
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Mon approche repose sur :</p>
                <div className="space-y-2 text-sm text-gray-400">
                  {[
                    "L'analyse approfondie des projets immobiliers",
                    "L'interprétation opérationnelle des règles d'urbanisme (PLU)",
                    "La détection des opportunités de transformation (division, revalorisation, optimisation)",
                    "La compréhension des logiques investisseurs (rentabilité, faisabilité, stratégie de sortie)",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="text-[#c29a6b] flex-shrink-0 mt-0.5">→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-l-2 border-[#c29a6b]/40 pl-5">
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  "Cette vision transversale me permet d'appréhender un bien non pas seulement comme un produit à vendre, mais comme <strong className="text-white not-italic">une opération à valoriser.</strong>"
                </p>
              </div>

              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-3">Approche digitale</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  En parallèle, je m'intéresse à la structuration et à la digitalisation de ces opportunités via la conception de solutions digitales — visant à fluidifier la mise en relation entre apporteurs de biens et professionnels capables de les exploiter.
                </p>
              </div>

              <div className="border border-white/10 p-5">
                <p className="text-xs text-[#c29a6b] tracking-widest uppercase mb-2">En pratique</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  J'analyse régulièrement des biens pour identifier leur potentiel réel et leur capacité à intéresser des investisseurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYSE PRÉALABLE ── */}
      <section id="analyse" className="px-6 lg:px-10 py-24 bg-[#111720]">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c29a6b] mb-4">Service expert</p>
          <h2 className="text-3xl font-bold mb-4">Vous avez un bien à analyser<br />avant de le diffuser ?</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-2xl">
            Avant de soumettre un bien sur la plateforme, certains dossiers méritent une analyse préalable approfondie. Potentiel de valorisation, lecture PLU, faisabilité, risques — obtenez un avis d'expert en toute confidentialité.
          </p>
          <div className="flex items-center gap-3 mb-12">
            <span className="w-2 h-2 rounded-full bg-[#c29a6b]" />
            <p className="text-sm text-[#c29a6b] font-medium">Tous les éléments transmis sont strictement confidentiels et ne seront jamais communiqués à un tiers.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Analyse simple */}
            <div className="relative border border-[#c29a6b]/30 rounded-2xl p-8 bg-[#c29a6b]/5 hover:border-[#c29a6b]/60 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs tracking-widest uppercase text-[#c29a6b] mb-2">Analyse simple</p>
                  <h3 className="text-xl font-bold text-white">Avis expert standard</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#c29a6b]">150 €</p>
                  <p className="text-xs text-gray-500">HT · paiement sécurisé</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-400 mb-8">
                {[
                  'Analyse du potentiel de valorisation',
                  'Lecture urbanistique (PLU)',
                  'Identification des risques',
                  'Axes de création de valeur',
                  'Rapport écrit sous 48h',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-[#c29a6b]">→</span> {item}
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-400 leading-relaxed">🔒 Vos documents et informations restent strictement confidentiels. Aucune transmission à un tiers, aucune diffusion.</p>
              </div>
              <button onClick={() => { setAnalyseType('simple'); setAnalyseModal(true) }}
                className="w-full inline-flex items-center justify-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors">
                Demander une analyse
              </button>
            </div>

            {/* Analyse complexe */}
            <div className="relative border border-white/10 rounded-2xl p-8 bg-[#0b1220] hover:border-white/20 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs tracking-widest uppercase text-gray-500 mb-2">Analyse complexe</p>
                  <h3 className="text-xl font-bold text-white">Étude approfondie sur devis</h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">Sur devis</p>
                  <p className="text-xs text-gray-500">réponse sous 24h</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-400 mb-8">
                {[
                  'Dossiers multi-lots ou atypiques',
                  'Opérations de promotion ou division complexe',
                  'Analyse de faisabilité approfondie',
                  'Étude de marché ciblée',
                  'Accompagnement sur mesure',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-white/40">→</span> {item}
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-400 leading-relaxed">🔒 Confidentialité garantie. Vos éléments ne sont jamais partagés avec des tiers.</p>
              </div>
              <button onClick={() => { setAnalyseType('complexe'); setAnalyseModal(true) }}
                className="w-full inline-flex items-center justify-center text-xs tracking-widest uppercase border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl hover:border-white/40 hover:bg-white/5 transition-colors">
                Demander un devis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL ANALYSE */}
      {analyseModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111720] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{analyseType === 'simple' ? 'Analyse simple — 150 €' : 'Demande de devis'}</h2>
                  <p className="text-xs text-gray-500 mt-1">{analyseType === 'simple' ? 'Rapport expert sous 48h' : 'Réponse sous 24h'}</p>
                </div>
                <button onClick={() => { setAnalyseModal(false); setAnalyseSent(false); setAnalyseType(null) }} className="text-gray-400 hover:text-white">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {analyseSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#c29a6b]/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{analyseType === 'simple' ? 'Demande envoyée !' : 'Devis demandé !'}</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    {analyseType === 'simple'
                      ? 'Nous vous contacterons sous 24h pour finaliser le paiement et démarrer l\'analyse.'
                      : 'Nous vous enverrons un devis personnalisé sous 24h à l\'adresse indiquée.'}
                  </p>
                  <button onClick={() => { setAnalyseModal(false); setAnalyseSent(false); setAnalyseType(null) }}
                    className="btn-primary justify-center">Fermer</button>
                </div>
              ) : (
                <form onSubmit={async e => {
                  e.preventDefault()
                  setAnalyseSending(true)
                  const fd = new FormData()
                  Object.entries(analyseForm).forEach(([k, v]) => fd.append(k, v))
                  fd.append('type', analyseType || '')
                  analyseFiles.forEach(f => fd.append('files', f))
                  await fetch('/api/emails/analyse-demande', { method: 'POST', body: fd })
                  setAnalyseSending(false)
                  setAnalyseSent(true)
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nom complet *</label>
                      <input className="input" required value={analyseForm.nom} onChange={e => setAnalyseForm(f => ({ ...f, nom: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone *</label>
                      <input type="tel" className="input" required value={analyseForm.tel} onChange={e => setAnalyseForm(f => ({ ...f, tel: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input type="email" className="input" required value={analyseForm.email} onChange={e => setAnalyseForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Adresse du bien *</label>
                    <input className="input" placeholder="Adresse, CP, ville" required value={analyseForm.adresse} onChange={e => setAnalyseForm(f => ({ ...f, adresse: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description du bien *</label>
                    <textarea className="input min-h-[80px] resize-none" required placeholder="Type, surface, situation, potentiel identifié…"
                      value={analyseForm.description} onChange={e => setAnalyseForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  {analyseType === 'complexe' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Précisions sur la complexité</label>
                      <textarea className="input min-h-[80px] resize-none" placeholder="Nature de la complexité, attentes particulières…"
                        value={analyseForm.message} onChange={e => setAnalyseForm(f => ({ ...f, message: e.target.value }))} />
                    </div>
                  )}
                  {/* Zone upload fichiers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Documents & photos <span className="text-gray-500 font-normal">(facultatif)</span></label>
                    <div
                      onClick={() => document.getElementById('analyse-files')?.click()}
                      className="border-2 border-dashed border-white/20 rounded-xl p-5 text-center cursor-pointer hover:border-[#c29a6b]/50 transition-colors"
                    >
                      <input id="analyse-files" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.docx"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files) setAnalyseFiles(prev => [...prev, ...Array.from(e.target.files!)])
                        }}
                      />
                      <p className="text-sm text-gray-400">Photos, cadastre, DPE, diagnostics…</p>
                      <p className="text-xs text-gray-600 mt-1">JPG, PNG, PDF, DOCX</p>
                    </div>
                    {analyseFiles.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {analyseFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-300 truncate">{f.name}</span>
                            <button type="button" onClick={() => setAnalyseFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-gray-500 hover:text-red-400 ml-2 flex-shrink-0">
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#c29a6b]/5 border border-[#c29a6b]/20 rounded-lg p-3">
                    <p className="text-xs text-[#c29a6b]">🔒 Tous les éléments transmis sont strictement confidentiels et ne seront jamais communiqués à un tiers.</p>
                  </div>
                  <button type="submit" disabled={analyseSending}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors disabled:opacity-50">
                    {analyseSending ? 'Envoi…' : analyseType === 'simple' ? 'Envoyer ma demande' : 'Demander mon devis'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0d12] border-t border-white/5 px-6 lg:px-10 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 text-xs text-gray-500">
            {/* Col 1 */}
            <div>
              <div className="space-y-2 mb-6">
                <a href="#" className="block hover:text-white transition-colors">CGU</a>
                <a href="#" className="block hover:text-white transition-colors">CGV</a>
                <a href="#" className="block hover:text-white transition-colors">Politique cookies</a>
              </div>
              <p className="text-gray-600">Rcs Lyon : 401 801 204</p>
              <p className="text-gray-600">APE : 6201Z</p>
              <p className="text-gray-600 mt-2">Siège social : 18, avenue Carnot, 69250 Neuville sur Saône (France)</p>
              <p className="text-gray-600 mt-2">Email : contact@closia.eu · Portable : 06 87 76 33 40</p>
            </div>

            {/* Col 2 */}
            <div>
              <p className="text-white font-medium mb-3">Produit</p>
              <div className="space-y-2">
                <a href="#" className="block hover:text-white transition-colors">Fonctionnalités</a>
                <a href="#" className="block hover:text-white transition-colors">Tarifs</a>
                <a href="#" className="block hover:text-white transition-colors">FAQ</a>
              </div>
              <p className="text-white font-medium mt-6 mb-3">Propriété intellectuelle</p>
              <p className="text-gray-600 leading-relaxed">L'ensemble du contenu (textes, images, interface, logique applicative) est protégé par le droit d'auteur. Toute reproduction est interdite sans autorisation.</p>
            </div>

            {/* Col 3 */}
            <div>
              <p className="text-white font-medium mb-3">Mentions Vos droits RGPD</p>
              <p className="text-gray-600 mb-3">Droit de retirer votre consentement à tout moment</p>
              <a href="#" className="text-[#c29a6b] hover:underline">→ Politique de confidentialité</a>

              <div className="mt-8">
                <p className="text-white font-medium mb-3">Responsabilité</p>
                <p className="text-gray-600 leading-relaxed">L'éditeur ne peut être tenu responsable en cas d'erreur de calcul, d'indisponibilité du service ou d'usage non conforme.</p>
              </div>

              <div className="mt-8">
                <p className="text-gray-600">Bubble Group, Inc.</p>
                <p className="text-gray-600">Adresse : 22 W 21st St, New York, NY 10010, USA</p>
                <p className="text-gray-600">Site : https://bubble.io</p>
                <p className="text-gray-600">Téléphone : +1 (844) 932-8225</p>
                <p className="text-gray-600">Directeur de publication : Laurent BUFFARD</p>
              </div>
            </div>

            {/* Col 4 */}
            <div>
              <p className="text-white font-medium mb-3">Contact</p>
              <p className="text-gray-600">Support : contact@closia.eu</p>
              <p className="text-gray-600 mt-1">DPO (Données personnelles) : contact@closia.eu</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-xs text-gray-600">
            © 2026 Closia. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
