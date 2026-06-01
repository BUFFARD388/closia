'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Clock, CheckCircle, XCircle, Eye, LogOut,
  MapPin, Euro, FileText, ImageIcon, Download, ChevronRight,
  Timer, AlertCircle, X, Send, User, ShoppingCart, Ban, Zap
} from 'lucide-react'

// ── Données dossiers à analyser ──
const DOSSIERS = [
  {
    id: 1, type: 'Terrain constructible', adresse: '45 Avenue du Prado',
    cp: '13008', ville: 'Marseille', prix: 320000, surface: 850,
    situation: 'Bien libre',
    description: "Grande parcelle en zone UC. Vendeur souhaitant céder rapidement suite à succession.",
    potentiel: "Zone UC permettant R+3. COS 0.5. Potentiel 8 logements. Dent creuse idéale pour promoteur.",
    apporteur: { nom: 'Sophie Renard', tel: '06 78 90 12 34', email: 'sophie.renard@immo.fr', statut: 'Agent immobilier' },
    dateDepot: '29/05/2025 à 14h32', statut: 'pending',
    photos: ['facade.jpg', 'jardin.jpg', 'vue_aerienne.jpg'],
    docs: ['cadastre.pdf', 'titre_propriete.pdf'],
  },
  {
    id: 2, type: 'Immeuble mixte', adresse: '7 Rue Victor Hugo',
    cp: '38000', ville: 'Grenoble', prix: 780000, surface: 420,
    situation: 'Bien occupé (bail)',
    description: "Immeuble R+3, rez-de-chaussée commercial + 6 appartements. Baux échus sur 4 logements.",
    potentiel: "Restructuration complète possible. Repositionnement haut de gamme ou découpe en lots.",
    apporteur: { nom: 'Marc Dubois', tel: '06 12 45 78 90', email: 'm.dubois@mandataire.fr', statut: 'Mandataire immobilier' },
    dateDepot: '28/05/2025 à 09h15', statut: 'pending',
    photos: ['facade_immeuble.jpg', 'hall.jpg', 'appartement_type.jpg'],
    docs: ['diagnostics_dpe.pdf', 'cadastre.pdf', 'bail_commercial.pdf'],
  },
  {
    id: 3, type: 'Local commercial', adresse: '22 Place Bellecour',
    cp: '69002', ville: 'Lyon', prix: 290000, surface: 95,
    situation: 'Bien libre',
    description: "Local en rez-de-chaussée, ancienne agence bancaire. Plateau brut après déménagement.",
    potentiel: "Changement de destination en logement possible selon PLU zone UA.",
    apporteur: { nom: 'Pierre Lefebvre', tel: '06 55 44 33 22', email: 'p.lefebvre@notaires.fr', statut: 'Notaire' },
    dateDepot: '27/05/2025 à 16h50', statut: 'validated', reponse: "Dossier validé. Potentiel confirmé après lecture PLU UA. Diffusion en cours.",
  },
  {
    id: 4, type: 'Maison + terrain', adresse: '14 Chemin des Roses',
    cp: '69250', ville: 'Neuville-sur-Saône', prix: 480000, surface: 1800,
    situation: 'Bien libre',
    description: "Maison de 140m² avec grand terrain arboré.",
    potentiel: "Terrain détachable estimé 900m² mais prix déjà aligné marché.",
    apporteur: { nom: 'Julie Martin', tel: '06 23 45 67 89', email: 'j.martin@laforet.fr', statut: 'Agent immobilier' },
    dateDepot: '26/05/2025 à 11h20', statut: 'rejected',
    reponse: "Dossier non retenu. Prix aligné marché, marge insuffisante pour valorisation.",
  },
]

// ── Données leads en diffusion ──
const LEADS_LIVE = [
  {
    id: 10, type: 'Local commercial', adresse: '22 Place Bellecour',
    cp: '69002', ville: 'Lyon', prix: 290000,
    apporteur: 'Pierre Lefebvre',
    dateDebut: '27/05/2025 à 18h00',
    heuresRestantes: 14,
    minutesRestantes: 32,
    acheteurs: [
      { nom: 'Invest Lyon SAS', mode: 'partage', dateAchat: '27/05 à 19h12', montant: 300 },
    ],
    maxAcheteurs: 3,
    exclusifDispo: true,
  },
  {
    id: 11, type: 'Terrain constructible', adresse: '8 Allée des Pins',
    cp: '06200', ville: 'Nice', prix: 540000,
    apporteur: 'Karim Bensaid',
    dateDebut: '28/05/2025 à 10h00',
    heuresRestantes: 38,
    minutesRestantes: 15,
    acheteurs: [
      { nom: 'Côte Promo SARL', mode: 'exclusif', dateAchat: '28/05 à 11h05', montant: 900 },
    ],
    maxAcheteurs: 1,
    exclusifDispo: false,
  },
  {
    id: 12, type: 'Immeuble de rapport', adresse: '3 Rue du Faubourg',
    cp: '31000', ville: 'Toulouse', prix: 860000,
    apporteur: 'Anne-Claire Vidal',
    dateDebut: '29/05/2025 à 08h30',
    heuresRestantes: 61,
    minutesRestantes: 45,
    acheteurs: [],
    maxAcheteurs: 3,
    exclusifDispo: true,
  },
]

// ── Données leads achetés ──
const LEADS_ACHETES = [
  {
    id: 20, type: 'Immeuble mixte', adresse: '14 Rue Montgolfier',
    cp: '69001', ville: 'Lyon', prix: 1100000,
    apporteur: 'Sophie Renard',
    acheteur: { nom: 'Valorim Group', profil: 'Marchand de biens', tel: '04 72 00 11 22', email: 'contact@valorim.fr' },
    mode: 'exclusif', montant: 900,
    dateAchat: '22/05/2025 à 14h30',
    statut: 'en_cours',
  },
  {
    id: 21, type: 'Terrain constructible', adresse: '55 Route de Vienne',
    cp: '38200', ville: 'Vienne', prix: 420000,
    apporteur: 'Marc Dubois',
    acheteur: { nom: 'Rhône Promotion', profil: 'Promoteur', tel: '04 74 85 12 34', email: 'direction@rhone-promo.fr' },
    mode: 'partage', montant: 300,
    dateAchat: '20/05/2025 à 09h15',
    statut: 'signe',
  },
  {
    id: 22, type: 'Local commercial', adresse: '7 Cours Lafayette',
    cp: '69003', ville: 'Lyon', prix: 380000,
    apporteur: 'Julie Martin',
    acheteur: { nom: 'Est Invest', profil: 'Foncière', tel: '04 78 62 33 44', email: 'invest@est-invest.fr' },
    mode: 'partage', montant: 300,
    dateAchat: '18/05/2025 à 16h45',
    statut: 'en_cours',
  },
]

// ── Données leads expirés sans acquéreur ──
const LEADS_EXPIRES = [
  {
    id: 30, type: 'Maison + terrain', adresse: '22 Chemin du Moulin',
    cp: '01000', ville: 'Bourg-en-Bresse', prix: 350000,
    apporteur: 'Thomas Girard',
    dateDebut: '10/05/2025', dateFin: '13/05/2025',
    raison: "Prix trop élevé par rapport au potentiel identifié. Aucun acheteur intéressé.",
  },
  {
    id: 31, type: 'Local commercial', adresse: '18 Rue Mercière',
    cp: '69002', ville: 'Lyon', prix: 650000,
    apporteur: 'Nadia Bousquet',
    dateDebut: '05/05/2025', dateFin: '08/05/2025',
    raison: "Zone saturée. Acheteurs pro déjà positionnés sur des biens similaires.",
  },
]

const SECTIONS = [
  { key: 'dossiers', label: 'Dossiers', icon: <FileText className="w-4 h-4" />, count: DOSSIERS.filter(d => d.statut === 'pending').length, alert: true },
  { key: 'live', label: 'En diffusion', icon: <Zap className="w-4 h-4" />, count: LEADS_LIVE.length },
  { key: 'achetes', label: 'Leads achetés', icon: <ShoppingCart className="w-4 h-4" />, count: LEADS_ACHETES.length },
  { key: 'expires', label: 'Sans acquéreur', icon: <Ban className="w-4 h-4" />, count: LEADS_EXPIRES.length },
]

function timerColor(h: number) {
  if (h < 24) return 'text-red-400'
  if (h < 48) return 'text-orange-400'
  return 'text-green-400'
}

function StatutBadge({ statut }: { statut: string }) {
  if (statut === 'pending') return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20"><AlertCircle className="w-3 h-3" /> À analyser</span>
  if (statut === 'validated') return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20"><CheckCircle className="w-3 h-3" /> Validé</span>
  if (statut === 'rejected') return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20"><XCircle className="w-3 h-3" /> Refusé</span>
  return null
}

export default function DashboardAdmin() {
  const [section, setSection] = useState('dossiers')
  const [tab, setTab] = useState('tous')
  const [selected, setSelected] = useState<typeof DOSSIERS[0] | null>(null)
  const [decision, setDecision] = useState<'validate' | 'reject' | null>(null)
  const [reponse, setReponse] = useState('')
  const [sent, setSent] = useState(false)

  const filtered = tab === 'tous' ? DOSSIERS : DOSSIERS.filter(d => d.statut === tab)

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex">

      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#111720] border-r border-white/10 p-6 fixed top-0 left-0">
        <div className="mb-10">
          <img src="/logo.png" alt="Closia" className="h-12 w-auto" />
          <div className="text-xs text-[#c29a6b] mt-2 font-medium tracking-widest uppercase">Admin</div>
        </div>

        <nav className="flex-1 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                section === s.key ? 'bg-[#c29a6b]/15 text-[#c29a6b] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.icon} {s.label}
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                s.alert && (s.count ?? 0) > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-400'
              }`}>
                {s.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <Link href="/dashboard/acheteur" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
            <Eye className="w-4 h-4" /> Vue acheteur
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10">

        {/* ════════ DOSSIERS ════════ */}
        {section === 'dossiers' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Dossiers à analyser</h1>
              <p className="text-gray-400 text-sm mt-1">{DOSSIERS.filter(d => d.statut === 'pending').length} en attente d'analyse</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total reçus', val: DOSSIERS.length, color: 'text-white' },
                { label: 'À analyser', val: DOSSIERS.filter(d => d.statut === 'pending').length, color: 'text-orange-400' },
                { label: 'Validés', val: DOSSIERS.filter(d => d.statut === 'validated').length, color: 'text-green-400' },
                { label: 'Refusés', val: DOSSIERS.filter(d => d.statut === 'rejected').length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#111720] border border-white/10 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filtres tabs */}
            <div className="flex gap-2 mb-6">
              {['tous', 'pending', 'validated', 'rejected'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`text-xs px-4 py-2 rounded-full transition-all ${tab === t ? 'bg-[#c29a6b] text-black font-medium' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  {t === 'tous' ? 'Tous' : t === 'pending' ? 'À analyser' : t === 'validated' ? 'Validés' : 'Refusés'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map(d => (
                <div key={d.id} className="bg-[#111720] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatutBadge statut={d.statut} />
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{d.dateDepot}</span>
                      </div>
                      <h3 className="font-semibold">{d.type}</h3>
                      <div className="flex flex-wrap gap-x-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{d.cp} – {d.ville}</span>
                        <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5 text-[#c29a6b]" />{d.prix.toLocaleString('fr-FR')} €</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{d.apporteur.nom}</span>
                      </div>
                    </div>
                    <button onClick={() => { setSelected(d); setDecision(null); setReponse(''); setSent(false) }}
                      className="btn-primary text-xs !py-2 !px-4 flex-shrink-0">
                      Analyser <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════ EN DIFFUSION ════════ */}
        {section === 'live' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Leads en diffusion</h1>
              <p className="text-gray-400 text-sm mt-1">{LEADS_LIVE.length} lead{LEADS_LIVE.length > 1 ? 's' : ''} actuellement en ligne</p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'En ligne', val: LEADS_LIVE.length, color: 'text-green-400' },
                { label: 'Leads achetés', val: LEADS_LIVE.reduce((a, l) => a + l.acheteurs.length, 0), color: 'text-[#c29a6b]' },
                { label: 'Revenus générés', val: LEADS_LIVE.reduce((a, l) => a + l.acheteurs.reduce((b, ac) => b + ac.montant, 0), 0).toLocaleString('fr-FR') + ' €', color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-[#111720] border border-white/10 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {LEADS_LIVE.map(lead => (
                <div key={lead.id} className="bg-[#111720] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                          <Zap className="w-3 h-3" /> En ligne
                        </span>
                        <span className={`text-xs font-bold flex items-center gap-1 ${timerColor(lead.heuresRestantes)}`}>
                          <Timer className="w-3 h-3" /> {lead.heuresRestantes}h {lead.minutesRestantes}min restantes
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{lead.type}</h3>
                      <div className="flex flex-wrap gap-x-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.adresse}, {lead.cp} {lead.ville}</span>
                        <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.prix.toLocaleString('fr-FR')} €</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{lead.apporteur}</span>
                      </div>

                      {/* Barre de progression temps */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Temps écoulé</span>
                          <span>{72 - lead.heuresRestantes}h / 72h</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${lead.heuresRestantes < 24 ? 'bg-red-400' : lead.heuresRestantes < 48 ? 'bg-orange-400' : 'bg-green-400'}`}
                            style={{ width: `${((72 - lead.heuresRestantes) / 72) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Acheteurs */}
                    <div className="lg:w-72 flex-shrink-0">
                      <div className="bg-[#0b1220] rounded-xl border border-white/10 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Acheteurs</p>
                          <span className="text-xs text-[#c29a6b]">{lead.acheteurs.length} / {lead.maxAcheteurs}</span>
                        </div>

                        {lead.acheteurs.length === 0 ? (
                          <p className="text-xs text-gray-600 italic">Aucun acheteur pour l'instant</p>
                        ) : (
                          <div className="space-y-2">
                            {lead.acheteurs.map((ac, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <div>
                                  <p className="text-white font-medium">{ac.nom}</p>
                                  <p className="text-gray-500">{ac.dateAchat}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`font-semibold ${ac.mode === 'exclusif' ? 'text-[#c29a6b]' : 'text-gray-300'}`}>{ac.montant} €</p>
                                  <p className="text-gray-500 capitalize">{ac.mode}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Exclusivité</span>
                            <span className={lead.exclusifDispo ? 'text-green-400' : 'text-red-400'}>
                              {lead.exclusifDispo ? 'Disponible' : 'Prise'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-500">Revenus lead</span>
                            <span className="text-white font-semibold">
                              {lead.acheteurs.reduce((a, ac) => a + ac.montant, 0)} €
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════ LEADS ACHETÉS ════════ */}
        {section === 'achetes' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Leads achetés</h1>
              <p className="text-gray-400 text-sm mt-1">{LEADS_ACHETES.length} transaction{LEADS_ACHETES.length > 1 ? 's' : ''} réalisée{LEADS_ACHETES.length > 1 ? 's' : ''}</p>
            </div>

            {/* Stats revenus */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Revenus totaux', val: LEADS_ACHETES.reduce((a, l) => a + l.montant, 0).toLocaleString('fr-FR') + ' €', color: 'text-[#c29a6b]' },
                { label: 'Leads exclusifs', val: LEADS_ACHETES.filter(l => l.mode === 'exclusif').length, color: 'text-white' },
                { label: 'Leads partagés', val: LEADS_ACHETES.filter(l => l.mode === 'partage').length, color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-[#111720] border border-white/10 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {LEADS_ACHETES.map(lead => (
                <div key={lead.id} className="bg-[#111720] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                          lead.mode === 'exclusif'
                            ? 'bg-[#c29a6b]/15 text-[#c29a6b] border-[#c29a6b]/20'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                        }`}>
                          {lead.mode === 'exclusif' ? '🔒 Exclusif' : '👥 Partagé'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                          lead.statut === 'signe' ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-gray-400'
                        }`}>
                          {lead.statut === 'signe' ? '✓ Signé' : '⏳ En cours'}
                        </span>
                        <span className="text-xs text-gray-500">{lead.dateAchat}</span>
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{lead.type}</h3>
                      <div className="flex flex-wrap gap-x-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.adresse}, {lead.cp} {lead.ville}</span>
                        <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.prix.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>

                    {/* Acheteur + revenus */}
                    <div className="flex gap-4 flex-shrink-0">
                      <div className="bg-[#0b1220] rounded-xl border border-white/10 p-4 min-w-[200px]">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Acheteur</p>
                        <p className="text-sm font-semibold text-white">{lead.acheteur.nom}</p>
                        <p className="text-xs text-gray-400">{lead.acheteur.profil}</p>
                        <p className="text-xs text-gray-500 mt-1">{lead.acheteur.tel}</p>
                        <p className="text-xs text-gray-500">{lead.acheteur.email}</p>
                      </div>
                      <div className="bg-[#c29a6b]/10 border border-[#c29a6b]/20 rounded-xl p-4 text-center min-w-[100px] flex flex-col items-center justify-center">
                        <p className="text-xs text-gray-500 mb-1">Revenu</p>
                        <p className="text-2xl font-bold text-[#c29a6b]">{lead.montant} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════ SANS ACQUÉREUR ════════ */}
        {section === 'expires' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Leads sans acquéreur</h1>
              <p className="text-gray-400 text-sm mt-1">{LEADS_EXPIRES.length} lead{LEADS_EXPIRES.length > 1 ? 's' : ''} expirés — bien retourné à l'apporteur</p>
            </div>

            <div className="bg-[#111720] border border-orange-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Ces biens ont été diffusés 72h sans trouver d'acquéreur. Ils ont automatiquement été retournés aux apporteurs, qui peuvent désormais les diffuser librement sur d'autres plateformes.
              </p>
            </div>

            <div className="space-y-4">
              {LEADS_EXPIRES.map(lead => (
                <div key={lead.id} className="bg-[#111720] border border-white/10 rounded-xl p-6 opacity-75 hover:opacity-100 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                          <Ban className="w-3 h-3" /> Expiré
                        </span>
                        <span className="text-xs text-gray-500">{lead.dateDebut} → {lead.dateFin}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{lead.type}</h3>
                      <div className="flex flex-wrap gap-x-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.cp} – {lead.ville}</span>
                        <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.prix.toLocaleString('fr-FR')} €</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{lead.apporteur}</span>
                      </div>
                      <div className="border-l-2 border-red-500/30 pl-4">
                        <p className="text-xs text-gray-500 italic">{lead.raison}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── PANEL ANALYSE DOSSIER ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-end">
          <div className="bg-[#111720] border-l border-white/10 w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1"><StatutBadge statut={selected.statut} /></div>
                  <h2 className="text-xl font-bold">{selected.type}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selected.adresse}, {selected.cp} {selected.ville}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Prix demandé', val: `${selected.prix?.toLocaleString('fr-FR')} €` },
                  { label: 'Surface', val: `${selected.surface} m²` },
                  { label: 'Situation', val: selected.situation },
                ].map(i => (
                  <div key={i.label} className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{i.label}</div>
                    <div className="text-sm font-medium">{i.val}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-3">Apporteur</p>
                <p className="font-medium text-sm">{selected.apporteur.nom} — {selected.apporteur.statut}</p>
                <p className="text-xs text-gray-400 mt-1">{selected.apporteur.tel} · {selected.apporteur.email}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Potentiel identifié</p>
                <div className="border-l-2 border-[#c29a6b]/40 pl-4">
                  <p className="text-sm text-gray-300 italic">{selected.potentiel}</p>
                </div>
              </div>

              {selected.photos && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Photos ({selected.photos.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.photos.map((p, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg aspect-square flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-xs text-gray-500 truncate w-full text-center px-1">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.docs && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Documents ({selected.docs.length})</p>
                  <div className="space-y-2">
                    {selected.docs.map((doc, i) => (
                      <button key={i} className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:border-white/30 transition-colors text-left">
                        <span className="flex items-center gap-2 text-sm text-gray-300">
                          <FileText className="w-4 h-4 text-[#c29a6b]" />{doc}
                        </span>
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-6">
                {selected.statut !== 'pending' ? (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Réponse envoyée</p>
                    <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                      selected.statut === 'validated' ? 'border-green-500/20 bg-green-500/5 text-green-300' : 'border-red-500/20 bg-red-500/5 text-red-300'
                    }`}>{selected.reponse}</div>
                  </div>
                ) : sent ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-[#c29a6b] mx-auto mb-3" />
                    <p className="font-semibold mb-1">Réponse envoyée</p>
                    <p className="text-sm text-gray-400">L'apporteur a été notifié par email.</p>
                    <button onClick={() => setSelected(null)} className="btn-primary mt-6 justify-center">Fermer</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Votre décision</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button onClick={() => setDecision('validate')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${decision === 'validate' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 text-gray-400 hover:border-green-500/50'}`}>
                        <CheckCircle className="w-4 h-4" /> Valider
                      </button>
                      <button onClick={() => setDecision('reject')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${decision === 'reject' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/10 text-gray-400 hover:border-red-500/50'}`}>
                        <XCircle className="w-4 h-4" /> Refuser
                      </button>
                    </div>
                    {decision && (
                      <div className="space-y-3">
                        <textarea className="input min-h-[120px] resize-none rounded-xl" value={reponse} onChange={e => setReponse(e.target.value)}
                          placeholder={decision === 'validate' ? "Message de validation à l'apporteur…" : "Motif de refus à transmettre à l'apporteur…"} />
                        <button onClick={() => reponse.trim() && setSent(true)} disabled={!reponse.trim()}
                          className={`w-full justify-center flex items-center gap-2 py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${decision === 'validate' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                          <Send className="w-4 h-4" />
                          {decision === 'validate' ? "Valider et notifier" : "Refuser et notifier"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
