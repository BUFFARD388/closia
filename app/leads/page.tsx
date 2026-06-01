'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, MapPin, Euro, Timer, Clock, ArrowLeft } from 'lucide-react'

const LEADS = [
  { id: 1, type: 'Immeuble de rapport', cp: '69003', ville: 'Lyon', prix: 980000, timer: '61h 20min', shared: 1, surface: 320 },
  { id: 2, type: 'Terrain constructible', cp: '13008', ville: 'Marseille', prix: 320000, timer: '38h 05min', shared: 0, surface: 850 },
  { id: 3, type: 'Local commercial', cp: '33000', ville: 'Bordeaux', prix: 450000, timer: '12h 42min', shared: 2, surface: 180 },
  { id: 4, type: 'Maison + terrain', cp: '31000', ville: 'Toulouse', prix: 650000, timer: '70h 00min', shared: 0, surface: 1200 },
  { id: 5, type: 'Immeuble mixte', cp: '06000', ville: 'Nice', prix: 1250000, timer: '55h 15min', shared: 1, surface: 480 },
  { id: 6, type: 'Entrepôt / logistique', cp: '67000', ville: 'Strasbourg', prix: 780000, timer: '22h 30min', shared: 0, surface: 2100 },
]

const TYPES = ['Tous', 'Immeuble de rapport', 'Terrain constructible', 'Local commercial', 'Maison + terrain', 'Immeuble mixte', 'Entrepôt / logistique']

function timerColor(timer: string) {
  const h = parseInt(timer)
  if (h < 24) return 'text-red-400'
  if (h < 48) return 'text-orange-400'
  return 'text-green-400'
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [prixMax, setPrixMax] = useState('')
  const [exclOnly, setExclOnly] = useState(false)

  const filtered = LEADS.filter(l => {
    if (typeFilter !== 'Tous' && l.type !== typeFilter) return false
    if (prixMax && l.prix > parseInt(prixMax)) return false
    if (exclOnly && l.shared > 0) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.cp.includes(q) && !l.ville.toLowerCase().includes(q) && !l.type.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-navy-900/90 backdrop-blur-md border-b border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <img src="/logo.png" alt="Closia" className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm !py-2 !px-4">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm !py-2 !px-4">S'inscrire</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Leads disponibles</h1>
          <p className="text-gray-400 text-sm">{filtered.length} bien{filtered.length > 1 ? 's' : ''} en ligne · Connectez-vous pour accéder aux détails</p>
        </div>

        {/* FILTRES */}
        <div className="card rounded-xl mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative lg:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input pl-9"
                placeholder="CP, ville ou type…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Type */}
            <select
              className="input"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>

            {/* Prix max */}
            <div className="relative">
              <Euro className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input pl-9"
                type="number"
                placeholder="Prix max (€)"
                value={prixMax}
                onChange={e => setPrixMax(e.target.value)}
              />
            </div>

            {/* Exclusivité */}
            <label className="flex items-center gap-3 cursor-pointer select-none bg-navy-700 rounded-xl px-4 py-3 border border-navy-600">
              <div
                onClick={() => setExclOnly(!exclOnly)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${exclOnly ? 'bg-gold-500' : 'bg-navy-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${exclOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">Exclusivité dispo.</span>
            </label>
          </div>
        </div>

        {/* GRID LEADS */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Filter className="w-8 h-8 mx-auto mb-3" />
            Aucun lead ne correspond à vos filtres.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(lead => (
              <div key={lead.id} className="card rounded-xl hover:border-gold-500/40 transition-all group">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="tag-live">
                    <Timer className="w-3 h-3" /> En ligne
                  </span>
                  <span className={`text-xs flex items-center gap-1 font-medium ${timerColor(lead.timer)}`}>
                    <Clock className="w-3 h-3" /> {lead.timer}
                  </span>
                </div>

                {/* Infos principales */}
                <h3 className="font-semibold text-lg mb-3">{lead.type}</h3>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
                    {lead.cp} – {lead.ville}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Euro className="w-4 h-4 text-gold-500 flex-shrink-0" />
                    {lead.prix.toLocaleString('fr-FR')} €
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-4 h-4 text-center text-gold-500 flex-shrink-0 text-xs font-bold">m²</span>
                    {lead.surface.toLocaleString('fr-FR')} m²
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-navy-700 flex items-center justify-between">
                  <div>
                    {lead.shared === 0 ? (
                      <span className="text-xs text-gold-400 font-medium">Exclusivité disponible</span>
                    ) : (
                      <span className="text-xs text-gray-500">{lead.shared}/2 acheteur{lead.shared > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <Link
                    href="/auth/login"
                    className="text-sm text-gold-500 font-medium hover:underline flex items-center gap-1"
                  >
                    Acheter le lead →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bannière connexion */}
        <div className="mt-12 card bg-gradient-to-r from-gold-500/10 to-navy-800 border-gold-500/30 text-center py-10">
          <h2 className="text-xl font-bold mb-2">Accédez aux informations complètes</h2>
          <p className="text-gray-400 mb-6 text-sm">Adresse exacte, coordonnées vendeur, analyse détaillée, photos. Créez un compte gratuit.</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register?role=acheteur" className="btn-primary">Créer mon compte</Link>
            <Link href="/auth/login" className="btn-secondary">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
