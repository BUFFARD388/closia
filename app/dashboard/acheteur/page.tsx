'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Filter, MapPin, Euro, Timer, Clock, LogOut,
  ShoppingCart, Star, X, CheckCircle, Lock, Users, Zap, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Grille de prix ──────────────────────────────────────────
function getPrix(prixBien: number) {
  if (prixBien < 300000) return { exclu: 490, deux: 290, trois: 190 }
  if (prixBien <= 1000000) return { exclu: 890, deux: 490, trois: 320 }
  return { exclu: 1490, deux: 790, trois: 520 }
}

function heuresRestantes(dateExpiration: string) {
  return Math.max(0, (new Date(dateExpiration).getTime() - Date.now()) / 3600000)
}

function timerColor(h: number) {
  if (h < 24) return 'text-red-400'
  if (h < 48) return 'text-orange-400'
  return 'text-green-400'
}

const TABS = [
  { key: 'disponibles', label: 'Leads disponibles', icon: <Zap className="w-4 h-4" /> },
  { key: 'achetes', label: 'Mes leads achetés', icon: <Star className="w-4 h-4" /> },
]

export default function DashboardAcheteur() {
  const router = useRouter()
  const [tab, setTab] = useState('disponibles')
  const [search, setSearch] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [leads, setLeads] = useState<any[]>([])
  const [leadsAchetes, setLeadsAchetes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [buyMode, setBuyMode] = useState<'exclu' | 'partage' | null>(null)
  const [payStep, setPayStep] = useState<'choose' | 'pay' | 'confirm' | 'exemple'>('choose')

  useEffect(() => { init() }, [])

  // Gérer le retour de Stripe (succès ou annulation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const achatId = params.get('achatId')

    if (params.get('payment') === 'success' && achatId) {
      setTab('achetes')
      supabase.from('achats').update({ statut: 'confirme' }).eq('id', achatId).then(async () => {
        const { data: achat } = await supabase
          .from('achats')
          .select('*, biens(*)')
          .eq('id', achatId)
          .single()
        if (achat && userProfile) {
          await fetch('/api/emails/confirm-achat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userProfile.email,
              prenom: userProfile.prenom,
              type: achat.biens?.type,
              ville: achat.biens?.ville,
              cp: achat.biens?.cp,
              mode: 'exclusif',
              montant: achat.montant_paye,
            }),
          })
        }
        window.history.replaceState({}, '', '/dashboard/acheteur')
      })
    }

    if (params.get('payment') === 'cancel' && achatId) {
      // Annuler l'achat si l'utilisateur a abandonné le paiement
      supabase.from('achats').update({ statut: 'annule' }).eq('id', achatId).then(() => {
        window.history.replaceState({}, '', '/dashboard/acheteur')
      })
    }
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUserId(user.id)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setUserProfile(profile)
    await loadLeads(user.id)
  }

  async function loadLeads(uid: string) {
    setLoading(true)
    // Leads en diffusion avec leurs achats
    const { data: biensData } = await supabase
      .from('biens')
      .select('*, achats(*)')
      .eq('statut', 'diffuse')
      .gt('date_expiration', new Date().toISOString())
      .order('date_diffusion', { ascending: false })
    setLeads(biensData || [])

    // Mes achats avec infos apporteur
    const { data: achatData } = await supabase
      .from('achats')
      .select('*, biens(*, profiles!biens_apporteur_id_fkey(prenom, nom, tel, email, statut_pro))')
      .eq('acheteur_id', uid)
      .neq('statut', 'annule')
    setLeadsAchetes(achatData || [])

    setLoading(false)
  }

  const achetesIds = new Set(leadsAchetes.map((a: any) => a.bien_id))

  const filtered = leads.filter(l => {
    if (achetesIds.has(l.id)) return false // masquer les leads déjà achetés
    // masquer les leads achetés en exclusivité par quelqu'un d'autre
    const achatsActifs = l.achats?.filter((a: any) => a.statut !== 'annule') || []
    if (achatsActifs.some((a: any) => a.mode === 'exclusif')) return false
    if (prixMax && l.prix > parseInt(prixMax)) return false
    if (typeFilter !== 'Tous' && l.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.cp?.includes(q) && !l.ville?.toLowerCase().includes(q) && !l.type?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const openBuy = (lead: any) => {
    setSelectedLead(lead)
    setBuyMode(null)
    setPayStep('choose')
  }

  const handleBuy = async () => {
    if (!selectedLead || !buyMode || !userId) return

    // Bloquer l'achat pour les biens exemples
    if (selectedLead.type?.includes('Exemple')) {
      setPayStep('exemple')
      return
    }

    const grille = getPrix(selectedLead.prix)
    const montant = buyMode === 'exclu' ? grille.exclu : grille.trois

    // Créer l'achat en base
    const { data: achat, error } = await supabase.from('achats').insert({
      bien_id: selectedLead.id,
      acheteur_id: userId,
      mode: buyMode === 'exclu' ? 'exclusif' : 'partage',
      statut: 'reserve',
      montant,
    }).select().single()

    if (error) { alert('Erreur : ' + error.message); return }

    if (buyMode === 'partage') {
      await loadLeads(userId)
      // Email confirmation liste d'attente
      await fetch('/api/emails/confirm-achat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile?.email,
          prenom: userProfile?.prenom,
          type: selectedLead.type,
          ville: selectedLead.ville,
          cp: selectedLead.cp,
          mode: 'partage',
          montant: null,
        }),
      })
      setPayStep('confirm')
      return
    }

    // Paiement Stripe pour l'exclusif
    const acheteurs = selectedLead.achats?.filter((a: any) => a.statut !== 'annule') || []
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bienId: selectedLead.id,
        bienType: selectedLead.type,
        bienVille: selectedLead.ville,
        prixBien: selectedLead.prix,
        mode: 'exclusif',
        nbAcheteurs: acheteurs.length + 1,
        achatId: achat.id,
      }),
    })
    const { url, error: stripeError } = await res.json()
    if (stripeError) { alert('Erreur Stripe : ' + stripeError); return }
    window.location.href = url
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-navy-800 border-r border-navy-700 p-6 fixed top-0 left-0">
        <div className="mb-8">
          <img src="/logo.png" alt="Closia" className="h-12 w-auto" />
          <div className="text-xs text-gray-500 mt-1">Espace acheteur pro</div>
          {userProfile && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#c29a6b]/20 flex items-center justify-center text-[#c29a6b] text-xs font-bold flex-shrink-0">
                {userProfile.prenom?.[0]}{userProfile.nom?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{userProfile.prenom} {userProfile.nom}</p>
                {userProfile.societe && <p className="text-xs text-gray-500">{userProfile.societe}</p>}
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${tab === t.key ? 'bg-gold-500/15 text-gold-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-navy-700'}`}>
              {t.icon} {t.label}
              {t.key === 'disponibles' && filtered.length > 0 && (
                <span className="ml-auto text-xs bg-gold-500/20 text-gold-400 rounded-full px-2 py-0.5">{filtered.length}</span>
              )}
              {t.key === 'achetes' && leadsAchetes.length > 0 && (
                <span className="ml-auto text-xs bg-gold-500/20 text-gold-400 rounded-full px-2 py-0.5">{leadsAchetes.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="pt-6 border-t border-navy-700">
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {tab === 'disponibles' ? 'Leads disponibles' : tab === 'achetes' ? 'Mes leads achetés' : 'Archivés'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {tab === 'disponibles' && `${filtered.length} opportunité${filtered.length > 1 ? 's' : ''} en ce moment`}
              {tab === 'achetes' && `${leadsAchetes.length} lead${leadsAchetes.length > 1 ? 's' : ''} acheté${leadsAchetes.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Tabs mobile */}
        <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 text-sm px-4 py-2 rounded-full transition-all ${tab === t.key ? 'bg-gold-500 text-navy-900 font-medium' : 'bg-navy-700 text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ LEADS DISPONIBLES ════ */}
        {tab === 'disponibles' && (
          <>
            <div className="card mb-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className="input pl-9" placeholder="CP, ville, type…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  {['Tous', 'Immeuble de rapport', 'Terrain constructible', 'Local commercial', 'Maison + terrain', 'Immeuble mixte'].map(t => <option key={t}>{t}</option>)}
                </select>
                <div className="relative">
                  <Euro className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className="input pl-9" type="number" placeholder="Prix max (€)" value={prixMax} onChange={e => setPrixMax(e.target.value)} />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(lead => {
                  const h = heuresRestantes(lead.date_expiration)
                  const acheteurs = lead.achats?.filter((a: any) => a.statut !== 'annule') || []
                  const exclusifPris = acheteurs.some((a: any) => a.mode === 'exclusif')
                  const grille = getPrix(lead.prix)
                  const dejaPositionne = acheteurs.some((a: any) => a.acheteur_id === userId)

                  const isExemple = lead.type?.includes('Exemple')

                  return (
                    <div key={lead.id} className={`card hover:border-gold-500/40 transition-all flex flex-col ${isExemple ? 'border-dashed border-white/20' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="tag-live"><Timer className="w-3 h-3" /> En ligne</span>
                          {isExemple && (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-gray-400 tracking-widest uppercase">Exemple</span>
                          )}
                        </div>
                        <span className={`text-xs flex items-center gap-1 font-medium ${timerColor(h)}`}>
                          <Clock className="w-3 h-3" /> {Math.floor(h)}h {Math.floor((h % 1) * 60)}min
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg mb-3">{lead.type.replace(' — Exemple', '')}</h3>

                      <div className="space-y-1.5 mb-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold-500" />{lead.cp} – {lead.ville}</div>
                        <div className="flex items-center gap-2"><Euro className="w-3.5 h-3.5 text-gold-500" />{Number(lead.prix).toLocaleString('fr-FR')} €</div>
                        {lead.surface && <div className="flex items-center gap-2"><span className="text-gold-500 text-xs font-medium">m²</span>{lead.surface} m²</div>}
                      </div>

                      <div className="bg-navy-700/50 rounded-lg p-3 mb-4 relative overflow-hidden">
                        <p className="text-xs text-gray-400 blur-sm select-none line-clamp-2">{lead.potentiel || lead.description || 'Analyse disponible après achat.'}</p>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-gold-500 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Acheter pour voir l'analyse
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        {exclusifPris
                          ? <span className="text-red-400">Exclusivité prise</span>
                          : acheteurs.length === 0
                            ? <span className="text-gold-400 font-medium">✦ Exclusivité disponible</span>
                            : <span>{acheteurs.length}/3 acheteur{acheteurs.length > 1 ? 's' : ''} en liste</span>}
                      </div>

                      <div className="pt-4 border-t border-navy-700 mt-auto">
                        <div className="flex gap-3 text-xs text-gray-400 mb-3">
                          <span>Exclusif : <strong className="text-white">{grille.exclu} €</strong></span>
                          <span>Partagé : <strong className="text-white">{grille.trois}–{grille.deux} €</strong></span>
                        </div>
                        {dejaPositionne ? (
                          <div className="text-center text-xs text-green-400 py-2 bg-green-500/10 rounded-xl">✓ Vous êtes déjà positionné</div>
                        ) : (
                          <button onClick={() => openBuy(lead)} className="btn-primary w-full justify-center text-sm !py-2.5">
                            <ShoppingCart className="w-4 h-4" /> Acheter ce lead
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {filtered.length === 0 && (
                  <div className="col-span-3 text-center py-16 text-gray-500">
                    <Filter className="w-8 h-8 mx-auto mb-3" />
                    {leads.length === 0 ? 'Aucun lead en diffusion pour le moment.' : 'Aucun lead ne correspond à vos filtres.'}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════ LEADS ACHETÉS ════ */}
        {tab === 'achetes' && (
          <div className="space-y-4">
            {leadsAchetes.map(achat => {
              const bien = achat.biens
              return (
                <div key={achat.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${achat.mode === 'exclusif' ? 'bg-[#c29a6b]/20 text-[#c29a6b]' : 'bg-blue-500/20 text-blue-400'}`}>
                          {achat.mode === 'exclusif' ? <><Lock className="w-3 h-3" /> Exclusif</> : <><Users className="w-3 h-3" /> Partagé</>}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${achat.statut === 'confirme' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {achat.statut === 'confirme' ? '✓ Confirmé' : '⏳ En attente'}
                        </span>
                      </div>
                      {bien && (
                        <>
                          <h3 className="font-semibold text-lg">{bien.type}</h3>
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gold-500" /> {bien.cp} – {bien.ville}
                            <span className="mx-2">·</span>
                            <Euro className="w-3.5 h-3.5 text-gold-500" /> {Number(bien.prix).toLocaleString('fr-FR')} €
                          </p>
                          {achat.statut === 'confirme' ? (
                            <div className="mt-4 space-y-4">
                              {/* Coordonnées apporteur */}
                              <div className="bg-[#c29a6b]/10 border border-[#c29a6b]/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-[#c29a6b] text-sm font-medium mb-3">
                                  <CheckCircle className="w-4 h-4" /> Coordonnées apporteur
                                </div>
                                {bien.profiles ? (
                                  <div className="space-y-1.5 text-sm text-gray-300">
                                    <p>👤 {bien.profiles.prenom} {bien.profiles.nom} — {bien.profiles.statut_pro || 'Apporteur'}</p>
                                    {bien.profiles.tel && <p>📞 {bien.profiles.tel}</p>}
                                    {bien.profiles.email && <p>✉️ {bien.profiles.email}</p>}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400">Coordonnées en cours de chargement…</p>
                                )}
                              </div>

                              {/* Détails du bien */}
                              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Dossier complet</p>
                                <div className="space-y-2 text-sm text-gray-300">
                                  <p>📍 {bien.adresse}, {bien.cp} {bien.ville}</p>
                                  {bien.surface && <p>📐 {bien.surface} m²</p>}
                                  {bien.situation && <p>🏠 {bien.situation}</p>}
                                </div>
                                {bien.description && (
                                  <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 mb-1">Description</p>
                                    <p className="text-sm text-gray-300 leading-relaxed">{bien.description}</p>
                                  </div>
                                )}
                                {bien.potentiel && (
                                  <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 mb-1">Potentiel identifié</p>
                                    <p className="text-sm text-[#c29a6b] italic leading-relaxed">{bien.potentiel}</p>
                                  </div>
                                )}
                              </div>

                              {/* Photos */}
                              {bien.photos_urls?.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Photos ({bien.photos_urls.length})</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {bien.photos_urls.map((url: string, i: number) => (
                                      <a key={i} href={url} target="_blank" rel="noreferrer">
                                        <img src={url} alt={`Photo ${i+1}`} className="w-full h-20 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : achat.mode === 'exclusif' ? (
                            <div className="mt-4 bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                              <p className="text-xs text-orange-300">Paiement en cours de confirmation…</p>
                            </div>
                          ) : (
                            <div className="mt-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                              {(() => {
                                const h = achat.biens?.date_expiration ? heuresRestantes(achat.biens.date_expiration) : 0
                                const expired = h <= 0
                                return (
                                  <>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs text-blue-300 font-semibold">⏳ Lead partagé — en attente de clôture</p>
                                      {!expired && (
                                        <span className={`text-xs font-bold flex items-center gap-1 ${timerColor(h)}`}>
                                          <Clock className="w-3 h-3" /> {Math.floor(h)}h {Math.floor((h % 1) * 60)}min restantes
                                        </span>
                                      )}
                                    </div>
                                    {expired
                                      ? <p className="text-xs text-orange-300">La période est terminée — un email de paiement va vous être envoyé.</p>
                                      : <p className="text-xs text-gray-400">À la clôture, vous recevrez un email avec le lien de paiement au prix final selon le nombre d'acheteurs.</p>
                                    }
                                    {!expired && (
                                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-blue-400 transition-all"
                                          style={{ width: `${Math.min(100, ((72 - h) / 72) * 100)}%` }} />
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {leadsAchetes.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <ShoppingCart className="w-8 h-8 mx-auto mb-3" />
                Vous n'avez pas encore acheté de lead.
              </div>
            )}
          </div>
        )}

      </main>

      {/* ════ MODAL ACHAT ════ */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1926] border border-white/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Acheter ce lead</h2>
                <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-navy-700/50 rounded-xl p-4 mb-6">
                <div className="font-semibold">{selectedLead.type}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {selectedLead.cp} – {selectedLead.ville} · {Number(selectedLead.prix).toLocaleString('fr-FR')} €
                </div>
              </div>

              {payStep === 'choose' && (() => {
                const grille = getPrix(selectedLead.prix)
                const acheteurs = selectedLead.achats?.filter((a: any) => a.statut !== 'annule') || []
                const exclusifPris = acheteurs.some((a: any) => a.mode === 'exclusif')

                return (
                  <>
                    <h3 className="font-semibold mb-2">Choisissez votre formule</h3>
                    <div className="flex flex-col gap-1.5 mb-5">
                      <p className="text-xs text-gray-500">L'exclusivité garantit un accès immédiat. La liste d'attente est soumise à conditions.</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {[
                          '✦ Mandat exclusif confirmé',
                          '✦ Non diffusé sur d\'autres plateformes',
                          '✦ Première diffusion',
                        ].map(item => (
                          <span key={item} className="text-xs px-3 py-1 rounded-full bg-[#c29a6b]/10 text-[#c29a6b] border border-[#c29a6b]/20">{item}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      {/* Exclusivité */}
                      <button onClick={() => setBuyMode('exclu')} disabled={exclusifPris || acheteurs.length > 0}
                        className={`w-full p-5 rounded-xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${buyMode === 'exclu' ? 'border-[#c29a6b] bg-[#1a1200]' : 'border-[#c29a6b]/40 bg-[#0f1926] hover:border-[#c29a6b]'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-white mb-1">
                              <Lock className="w-4 h-4 text-[#c29a6b]" /> Accès immédiat — Exclusivité
                            </div>
                            <p className="text-xs text-gray-400">Accès instantané aux coordonnées. Seul acheteur. Aucun concurrent.</p>
                            {(exclusifPris || acheteurs.length > 0) && (
                              <p className="text-xs text-red-400 mt-1">Non disponible — des acheteurs sont déjà positionnés.</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[#c29a6b] font-black text-2xl">{grille.exclu} €</div>
                            <div className="text-xs text-gray-500">accès immédiat</div>
                          </div>
                        </div>
                      </button>

                      {/* Liste d'attente */}
                      <button onClick={() => setBuyMode('partage')} disabled={acheteurs.length >= 3 || exclusifPris}
                        className={`w-full p-5 rounded-xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${buyMode === 'partage' ? 'border-blue-500 bg-[#0a1020]' : 'border-white/20 bg-[#0f1926] hover:border-white/40'}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-white mb-1">
                              <Users className="w-4 h-4 text-blue-400" /> Accès partagé
                              {acheteurs.length >= 3 && <span className="text-xs text-red-400">(complet)</span>}
                            </div>
                            <p className="text-xs text-gray-400">Prix calculé à la clôture des 72h selon le nombre d'acheteurs.</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-white font-black text-2xl">{grille.trois}–{grille.exclu} €</div>
                            <div className="text-xs text-gray-500">prix variable</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {[
                            { n: '3 acheteurs', prix: `${grille.trois} €`, color: 'text-green-400', bg: 'bg-[#0a1a0a] border-green-500/30' },
                            { n: '2 acheteurs', prix: `${grille.deux} €`, color: 'text-orange-400', bg: 'bg-[#1a100a] border-orange-500/30' },
                            { n: 'Seul', prix: `${grille.exclu} €`, color: 'text-red-400', bg: 'bg-[#1a0a0a] border-red-500/30' },
                          ].map(s => (
                            <div key={s.n} className={`rounded-lg border p-2.5 text-center ${s.bg}`}>
                              <div className={`font-bold text-sm ${s.color}`}>{s.prix}</div>
                              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.n}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-start gap-2 bg-[#1a0e00] border border-orange-500/30 rounded-lg p-3">
                            <span className="text-orange-400 flex-shrink-0 text-sm">⚠</span>
                            <p className="text-xs text-orange-300">Si un acheteur choisit l'exclusivité durant les 72h, il est prioritaire et vous perdez l'accès sans frais.</p>
                          </div>
                          <div className="flex items-start gap-2 bg-[#0a0a1a] border border-blue-500/20 rounded-lg p-3">
                            <span className="text-blue-400 flex-shrink-0 text-sm">ℹ</span>
                            <p className="text-xs text-blue-300">
                              <strong className="text-white">Prix garanti selon le nombre d'acheteurs à la clôture.</strong>{' '}
                              Si vous êtes le seul inscrit à la fin des 72h, le prix sera de <strong className="text-white">{grille.exclu} €</strong> (tarif 1 acheteur).
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <button disabled={!buyMode} onClick={() => setPayStep('pay')}
                      className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8911f] transition-colors">
                      {buyMode === 'exclu' ? `Accéder immédiatement — ${grille.exclu} €` : buyMode === 'partage' ? "Rejoindre la liste d'attente" : 'Choisissez une formule'}
                    </button>
                  </>
                )
              })()}

              {payStep === 'pay' && (() => {
                const grille = getPrix(selectedLead.prix)
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => setPayStep('choose')} className="text-gray-400 hover:text-white">←</button>
                      <h3 className="font-semibold">
                        {buyMode === 'exclu' ? 'Paiement sécurisé' : "Confirmer l'inscription"}
                      </h3>
                    </div>

                    {buyMode === 'exclu' ? (
                      <>
                        <div className="bg-[#1a1200] border border-[#c29a6b]/40 rounded-xl p-4 mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">🔒 Exclusivité — Accès immédiat</p>
                            <p className="text-xs text-gray-400 mt-0.5">Coordonnées débloquées dès confirmation</p>
                          </div>
                          <span className="font-black text-[#c29a6b] text-2xl">{grille.exclu} €</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">Le paiement Stripe sera intégré prochainement. Pour valider, confirmez votre intention.</p>
                        <button onClick={handleBuy}
                          className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors">
                          Confirmer — {grille.exclu} €
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-[#060d1a] border border-blue-500/30 rounded-xl p-5 mb-6">
                          <p className="text-sm font-semibold text-white mb-2">⏳ Inscription sans paiement</p>
                          <p className="text-xs text-gray-400">Aucun paiement aujourd'hui. À la clôture du lead, vous recevrez votre prix final.</p>
                        </div>
                        <button onClick={handleBuy}
                          className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors">
                          Confirmer mon inscription — Sans paiement
                        </button>
                      </>
                    )}
                  </>
                )
              })()}

              {payStep === 'exemple' && (
                <div className="py-4 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/10 border border-white/20">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Bien exemple</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Ce dossier est un exemple de démonstration.<br />
                    Les vrais leads seront disponibles très prochainement — vous serez notifié par email dès la première diffusion.
                  </p>
                  <button onClick={() => setSelectedLead(null)}
                    className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors">
                    Compris
                  </button>
                </div>
              )}

              {payStep === 'confirm' && (
                <div className="py-4 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${buyMode === 'exclu' ? 'bg-[#c29a6b]/20' : 'bg-blue-500/20'}`}>
                    <CheckCircle className={`w-8 h-8 ${buyMode === 'exclu' ? 'text-[#c29a6b]' : 'text-blue-400'}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {buyMode === 'exclu' ? 'Achat confirmé !' : 'Inscription confirmée !'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {buyMode === 'exclu'
                      ? 'Votre accès exclusif est enregistré. Les coordonnées seront disponibles après intégration du paiement.'
                      : "Vous êtes inscrit sur la liste d'attente. Aucun paiement débité."}
                  </p>
                  <button onClick={() => { setSelectedLead(null); setTab('achetes') }}
                    className="w-full justify-center inline-flex items-center text-xs tracking-widest uppercase bg-[#c29a6b] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8911f] transition-colors">
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

