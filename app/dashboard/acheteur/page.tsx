'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Filter, MapPin, Euro, Timer, Clock, LogOut,
  ShoppingCart, Star, Archive, X, CheckCircle, Lock, Users, Zap
} from 'lucide-react'

const LEADS_DISPO = [
  {
    id: 1, type: 'Immeuble de rapport', cp: '69003', ville: 'Lyon', prix: 980000,
    timer: '61h 20min', shared: 1, surface: 320,
    analyse: 'Division en lots + création d\'ASL. Rendement brut estimé 7,2%. PLU compatible.',
    achat_exclu: 900, achat_partage: 300,
  },
  {
    id: 2, type: 'Terrain constructible', cp: '13008', ville: 'Marseille', prix: 320000,
    timer: '38h 05min', shared: 0, surface: 850,
    analyse: 'Zone UC – R+3 constructible. COS 0.5. Potentiel 8 logements. PC faisable.',
    achat_exclu: 900, achat_partage: 300,
  },
  {
    id: 3, type: 'Local commercial', cp: '33000', ville: 'Bordeaux', prix: 450000,
    timer: '12h 42min', shared: 2, surface: 180,
    analyse: 'Changement destination en logements possible. Zone UC. Travaux estimés 400k€.',
    achat_exclu: 900, achat_partage: 300,
  },
  {
    id: 4, type: 'Maison + terrain', cp: '31000', ville: 'Toulouse', prix: 650000,
    timer: '70h 00min', shared: 0, surface: 1200,
    analyse: 'Terrain détachable 600m². PLU Zone UB R+2. Potentiel division + revente.',
    achat_exclu: 900, achat_partage: 300,
  },
]

const LEADS_ACHETES = [
  {
    id: 10, type: 'Immeuble mixte', cp: '06000', ville: 'Nice', prix: 1250000,
    dateAchat: '22/05/2025', mode: 'exclusif', statut: 'actif',
    contact: 'Jean-Pierre Martin — 06 12 34 56 78 — jp.martin@immo-nice.fr',
  },
]

const TABS = [
  { key: 'disponibles', label: 'Leads disponibles', icon: <Zap className="w-4 h-4" /> },
  { key: 'achetes', label: 'Mes leads achetés', icon: <Star className="w-4 h-4" /> },
  { key: 'archives', label: 'Archivés', icon: <Archive className="w-4 h-4" /> },
]

function timerColor(timer: string) {
  const h = parseInt(timer)
  if (h < 24) return 'text-red-400'
  if (h < 48) return 'text-orange-400'
  return 'text-green-400'
}

export default function DashboardAcheteur() {
  const [tab, setTab] = useState('disponibles')
  const [search, setSearch] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [selectedLead, setSelectedLead] = useState<typeof LEADS_DISPO[0] | null>(null)
  const [buyMode, setBuyMode] = useState<'exclu' | 'partage' | null>(null)
  const [payStep, setPayStep] = useState<'choose' | 'pay' | 'confirm'>('choose')

  const filtered = LEADS_DISPO.filter(l => {
    if (prixMax && l.prix > parseInt(prixMax)) return false
    if (typeFilter !== 'Tous' && l.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.cp.includes(q) && !l.ville.toLowerCase().includes(q) && !l.type.toLowerCase().includes(q)) return false
    }
    return true
  })

  const openBuy = (lead: typeof LEADS_DISPO[0]) => {
    setSelectedLead(lead)
    setBuyMode(null)
    setPayStep('choose')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-navy-800 border-r border-navy-700 p-6 fixed top-0 left-0">
        <div className="mb-10">
          <img src="/logo.png" alt="Closia" className="h-12 w-auto" />
          <div className="text-xs text-gray-500 mt-1">Espace acheteur pro</div>
        </div>
        <nav className="flex-1 space-y-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                tab === t.key ? 'bg-gold-500/15 text-gold-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-navy-700'
              }`}
            >
              {t.icon} {t.label}
              {t.key === 'disponibles' && (
                <span className="ml-auto text-xs bg-gold-500/20 text-gold-400 rounded-full px-2 py-0.5 font-medium">
                  {LEADS_DISPO.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="pt-6 border-t border-navy-700">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {tab === 'disponibles' ? 'Leads disponibles' : tab === 'achetes' ? 'Mes leads achetés' : 'Archivés'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {tab === 'disponibles' && `${filtered.length} opportunité${filtered.length > 1 ? 's' : ''} en ce moment`}
              {tab === 'achetes' && `${LEADS_ACHETES.length} lead${LEADS_ACHETES.length > 1 ? 's' : ''} acheté${LEADS_ACHETES.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Tabs mobile */}
        <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 text-sm px-4 py-2 rounded-full transition-all ${
                tab === t.key ? 'bg-gold-500 text-navy-900 font-medium' : 'bg-navy-700 text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ============ LEADS DISPONIBLES ============ */}
        {tab === 'disponibles' && (
          <>
            {/* Filtres */}
            <div className="card mb-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className="input pl-9" placeholder="CP, ville, type…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  {['Tous', 'Immeuble de rapport', 'Terrain constructible', 'Local commercial', 'Maison + terrain'].map(t => <option key={t}>{t}</option>)}
                </select>
                <div className="relative">
                  <Euro className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className="input pl-9" type="number" placeholder="Prix max (€)" value={prixMax} onChange={e => setPrixMax(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Grid leads */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(lead => (
                <div key={lead.id} className="card hover:border-gold-500/40 transition-all flex flex-col">
                  {/* Status row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="tag-live"><Timer className="w-3 h-3" /> En ligne</span>
                    <span className={`text-xs flex items-center gap-1 font-medium ${timerColor(lead.timer)}`}>
                      <Clock className="w-3 h-3" /> {lead.timer}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">{lead.type}</h3>

                  {/* Infos */}
                  <div className="space-y-1.5 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold-500" />{lead.cp} – {lead.ville}</div>
                    <div className="flex items-center gap-2"><Euro className="w-3.5 h-3.5 text-gold-500" />{lead.prix.toLocaleString('fr-FR')} €</div>
                  </div>

                  {/* Extrait analyse (flouté) */}
                  <div className="bg-navy-700/50 rounded-lg p-3 mb-4 relative overflow-hidden">
                    <p className="text-xs text-gray-400 blur-sm select-none line-clamp-2">{lead.analyse}</p>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-gold-500 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Acheter pour voir l'analyse
                      </span>
                    </div>
                  </div>

                  {/* Concurrence */}
                  <div className="text-xs text-gray-500 mb-4">
                    {lead.shared === 0
                      ? <span className="text-gold-400 font-medium">✦ Exclusivité disponible</span>
                      : <span>{lead.shared}/3 acheteur{lead.shared > 1 ? 's' : ''} en concurrence</span>}
                  </div>

                  {/* Prix */}
                  <div className="pt-4 border-t border-navy-700 mt-auto">
                    <div className="flex gap-3 text-xs text-gray-400 mb-3">
                      <span>Exclusif : <strong className="text-white">{lead.achat_exclu}€</strong></span>
                      <span>Partagé : <strong className="text-white">{lead.achat_partage}€</strong></span>
                    </div>
                    <button
                      onClick={() => openBuy(lead)}
                      className="btn-primary w-full justify-center text-sm !py-2.5"
                    >
                      <ShoppingCart className="w-4 h-4" /> Acheter ce lead
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-500">
                  <Filter className="w-8 h-8 mx-auto mb-3" />
                  Aucun lead ne correspond à vos filtres.
                </div>
              )}
            </div>
          </>
        )}

        {/* ============ LEADS ACHETÉS ============ */}
        {tab === 'achetes' && (
          <div className="space-y-4">
            {LEADS_ACHETES.map(lead => (
              <div key={lead.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge ${lead.mode === 'exclusif' ? 'bg-gold-500/20 text-gold-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {lead.mode === 'exclusif' ? <><Lock className="w-3 h-3" /> Exclusif</> : <><Users className="w-3 h-3" /> Partagé</>}
                      </span>
                      <span className="text-xs text-gray-500">Acheté le {lead.dateAchat}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{lead.type}</h3>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gold-500" /> {lead.cp} – {lead.ville}
                      <span className="mx-2">·</span>
                      <Euro className="w-3.5 h-3.5 text-gold-500" /> {lead.prix.toLocaleString('fr-FR')} €
                    </p>

                    {/* Contact vendeur — visible car lead acheté */}
                    <div className="mt-4 bg-navy-700/60 rounded-xl p-4 border border-navy-600">
                      <div className="flex items-center gap-2 text-gold-500 text-sm font-medium mb-2">
                        <CheckCircle className="w-4 h-4" /> Coordonnées vendeur
                      </div>
                      <p className="text-sm text-gray-300">{lead.contact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {LEADS_ACHETES.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <ShoppingCart className="w-8 h-8 mx-auto mb-3" />
                Vous n'avez pas encore acheté de lead.
              </div>
            )}
          </div>
        )}

        {/* ============ ARCHIVÉS ============ */}
        {tab === 'archives' && (
          <div className="text-center py-16 text-gray-500">
            <Archive className="w-8 h-8 mx-auto mb-3" />
            Aucun lead archivé.
          </div>
        )}
      </main>

      {/* ============ MODAL ACHAT ============ */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1926] border border-white/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Acheter ce lead</h2>
                <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Récap bien */}
              <div className="bg-navy-700/50 rounded-xl p-4 mb-6">
                <div className="font-semibold">{selectedLead.type}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {selectedLead.cp} – {selectedLead.ville} · {selectedLead.prix.toLocaleString('fr-FR')} €
                </div>
              </div>

              {payStep === 'choose' && (
                <>
                  <h3 className="font-semibold mb-2">Choisissez votre formule</h3>
                  <p className="text-xs text-gray-500 mb-5">L'exclusivité garantit un accès immédiat. La liste d'attente est soumise à conditions.</p>

                  <div className="space-y-4 mb-6">

                    {/* Exclusivité */}
                    <button
                      onClick={() => setBuyMode('exclu')}
                      disabled={selectedLead.shared > 0}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                        buyMode === 'exclu' ? 'border-[#c29a6b] bg-[#1a1200]' : 'border-[#c29a6b]/40 bg-[#0f1926] hover:border-[#c29a6b] hover:bg-[#141a0a]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-white mb-1">
                            <Lock className="w-4 h-4 text-[#c29a6b]" /> Accès immédiat — Exclusivité
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Accès instantané aux coordonnées complètes du vendeur. Vous êtes seul. Aucun concurrent. Aucun risque.
                          </p>
                          {selectedLead.shared > 0 && (
                            <p className="text-xs text-red-400 mt-1">Non disponible — un acheteur est déjà en liste d'attente.</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[#c29a6b] font-black text-2xl">900 €</div>
                          <div className="text-xs text-gray-500">accès immédiat</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {['✓ Accès immédiat', '✓ Aucun concurrent', '✓ Garanti'].map(t => (
                          <span key={t} className="text-xs bg-[#c29a6b]/10 text-[#c29a6b] px-2.5 py-1 rounded-full">{t}</span>
                        ))}
                      </div>
                    </button>

                    {/* Liste d'attente */}
                    <button
                      onClick={() => setBuyMode('partage')}
                      disabled={selectedLead.shared >= 3}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                        buyMode === 'partage' ? 'border-blue-500 bg-[#0a1020]' : 'border-white/20 bg-[#0f1926] hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-white mb-1">
                            <Users className="w-4 h-4 text-blue-400" /> Liste d'attente
                            {selectedLead.shared >= 3 && <span className="text-xs text-red-400 font-normal">(complète)</span>}
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Votre prix final dépend du nombre d'acheteurs en liste à la fin des 72h.
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-white font-black text-2xl">300–900 €</div>
                          <div className="text-xs text-gray-500">prix variable</div>
                        </div>
                      </div>

                      {/* Grille des scénarios */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                          { n: '3 acheteurs', prix: '300 €', color: 'text-green-400', bg: 'bg-[#0a1a0a] border-green-500/30' },
                          { n: '2 acheteurs', prix: '450 €', color: 'text-orange-400', bg: 'bg-[#1a100a] border-orange-500/30' },
                          { n: '1 acheteur (vous)', prix: '900 €', color: 'text-red-400', bg: 'bg-[#1a0a0a] border-red-500/30' },
                        ].map(s => (
                          <div key={s.n} className={`rounded-lg border p-2.5 text-center ${s.bg}`}>
                            <div className={`font-bold text-sm ${s.color}`}>{s.prix}</div>
                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.n}</div>
                          </div>
                        ))}
                      </div>

                      {/* Avertissement exclusivité prioritaire */}
                      <div className="mt-3 flex items-start gap-2 bg-[#1a0e00] border border-orange-500/30 rounded-lg p-3">
                        <span className="text-orange-400 flex-shrink-0 text-sm">⚠</span>
                        <p className="text-xs text-orange-300 leading-relaxed">
                          Si un acheteur choisit l'exclusivité durant les 72h, il est <strong>prioritaire</strong> et vous perdez l'accès au lead. Vous serez remboursé intégralement.
                        </p>
                      </div>
                    </button>
                  </div>

                  <button
                    disabled={!buyMode}
                    onClick={() => setPayStep('pay')}
                    className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8911f] transition-colors"
                  >
                    {buyMode === 'exclu' ? 'Accéder immédiatement — 900 €' : buyMode === 'partage' ? 'Rejoindre la liste d\'attente' : 'Choisissez une formule'}
                  </button>
                </>
              )}

              {payStep === 'pay' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setPayStep('choose')} className="text-gray-400 hover:text-white">
                      ←
                    </button>
                    <h3 className="font-semibold">Paiement sécurisé</h3>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5 ml-auto opacity-60" />
                  </div>

                  {buyMode === 'exclu' ? (
                    /* ── PAIEMENT IMMÉDIAT EXCLUSIF ── */
                    <>
                      <div className="bg-[#1a1200] border border-[#c29a6b]/40 rounded-xl p-4 mb-6 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">🔒 Exclusivité — Accès immédiat</p>
                          <p className="text-xs text-gray-400 mt-0.5">Coordonnées débloquées dès le paiement confirmé</p>
                        </div>
                        <span className="font-black text-[#c29a6b] text-2xl">900 €</span>
                      </div>
                      <form onSubmit={e => { e.preventDefault(); setPayStep('confirm') }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de carte</label>
                          <input className="input font-mono" placeholder="4242 4242 4242 4242" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Expiration</label>
                            <input className="input" placeholder="MM / AA" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">CVC</label>
                            <input className="input" placeholder="123" required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Nom sur la carte</label>
                          <input className="input" placeholder="JEAN DUPONT" required />
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Lock className="w-3 h-3" /> Paiement sécurisé via Stripe. Données bancaires jamais stockées.
                        </p>
                        <button type="submit" className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors">
                          Payer 900 € — Accès immédiat
                        </button>
                      </form>
                    </>
                  ) : (
                    /* ── INSCRIPTION LISTE D'ATTENTE — AUCUN PAIEMENT ── */
                    <>
                      <div className="bg-[#060d1a] border border-blue-500/30 rounded-xl p-5 mb-6">
                        <p className="text-sm font-semibold text-white mb-3">⏳ Liste d'attente — Inscription sans paiement</p>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                          Aucun paiement aujourd'hui. À la clôture du lead (72h max), vous recevrez un email avec votre prix final selon le nombre d'acheteurs inscrits.
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { n: '3 acheteurs', prix: '300 €', color: 'text-green-400', bg: 'bg-green-500/10' },
                            { n: '2 acheteurs', prix: '450 €', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                            { n: 'Seul', prix: '900 €', color: 'text-red-400', bg: 'bg-red-500/10' },
                          ].map(s => (
                            <div key={s.n} className={`rounded-lg p-2.5 text-center ${s.bg}`}>
                              <div className={`font-bold text-sm ${s.color}`}>{s.prix}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{s.n}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                          <span className="text-orange-400 flex-shrink-0">⚠</span>
                          <p className="text-xs text-orange-300 leading-relaxed">
                            Si un acheteur choisit l'exclusivité durant les 72h, il est prioritaire. Vous perdez votre place dans la liste mais ne payez rien.
                          </p>
                        </div>
                      </div>
                      <form onSubmit={e => { e.preventDefault(); setPayStep('confirm') }} className="space-y-4">
                        <p className="text-xs text-gray-400">
                          Confirmez votre email pour recevoir la notification de paiement à la clôture du lead.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Email de confirmation</label>
                          <input type="email" className="input" placeholder="vous@societe.fr" required />
                        </div>
                        <button type="submit" className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors">
                          Confirmer mon inscription — Sans paiement
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}

              {payStep === 'confirm' && (
                <div className="py-4">
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${buyMode === 'exclu' ? 'bg-[#c29a6b]/20' : 'bg-blue-500/20'}`}>
                      <CheckCircle className={`w-8 h-8 ${buyMode === 'exclu' ? 'text-[#c29a6b]' : 'text-blue-400'}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {buyMode === 'exclu' ? 'Paiement confirmé !' : 'Inscription confirmée !'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {buyMode === 'exclu'
                        ? 'Votre place exclusive est réservée sur ce lead.'
                        : 'Vous êtes inscrit sur la liste d\'attente. Aucun paiement débité.'}
                    </p>
                  </div>

                  {/* Exclusif → coordonnées immédiates */}
                  {buyMode === 'exclu' ? (
                    <>
                      <div className="bg-[#c29a6b]/10 border border-[#c29a6b]/30 rounded-xl p-5 mb-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#c29a6b] mb-3">
                          <CheckCircle className="w-4 h-4" /> Coordonnées vendeur déverrouillées
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-300">
                          <p>📍 14 Avenue Jean Jaurès, {selectedLead.cp} {selectedLead.ville}</p>
                          <p>👤 Sophie Renard — Agent immobilier</p>
                          <p>📞 06 78 90 12 34</p>
                          <p>✉️ sophie.renard@immo-prestige.fr</p>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 text-sm text-gray-400 space-y-1">
                        <p>✓ Vous êtes le seul acheteur sur ce lead</p>
                        <p>✓ 900 € débités — aucune charge supplémentaire</p>
                        <p>✓ Le lead est retiré de la plateforme immédiatement</p>
                      </div>
                    </>
                  ) : (
                    /* Liste d'attente → coordonnées à la clôture */
                    <>
                      <div className="bg-[#080e18] border border-white/20 rounded-xl p-5 mb-5">
                        <div className="flex items-center gap-3 mb-4">
                          <Timer className="w-5 h-5 text-[#c29a6b] flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-white">Coordonnées disponibles à la clôture</p>
                            <p className="text-xs text-gray-400">À l'issue des 72h de diffusion</p>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 flex items-center justify-center gap-3 mb-3">
                          <Lock className="w-4 h-4 text-gray-600" />
                          <p className="text-sm text-gray-600 blur-sm select-none">Jean Dupont · 06 XX XX XX XX · contact@...</p>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Vous recevrez un email dès la clôture du lead.</p>
                      </div>
                      <div className="bg-[#060d1a] border border-blue-500/30 rounded-xl p-4 mb-5 text-sm text-gray-300 space-y-1.5">
                        <p className="font-semibold text-white mb-2">Votre position en liste d'attente</p>
                        <p>→ À la clôture, prix final communiqué (300 / 450 / 900 €)</p>
                        <p>→ 24h pour payer et recevoir les coordonnées</p>
                        <p className="text-orange-300">→ Si un exclusif se positionne, place perdue — sans frais</p>
                        <div className="pt-2 border-t border-blue-500/20 mt-2">
                          <button
                            onClick={() => { setBuyMode('exclu'); setPayStep('pay') }}
                            className="w-full text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8911f] transition-colors"
                          >
                            💡 Passer en exclusivité — Accès immédiat
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => { setSelectedLead(null); setTab('achetes') }}
                    className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors"
                  >
                    Voir mes leads
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
