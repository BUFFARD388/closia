'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, FileText, ArrowRight, X } from 'lucide-react'

const TYPE_PROJETS = [
  'Maison individuelle',
  'Immeuble collectif',
  'Extension / surélévation',
  'Changement d\'usage',
  'Division parcellaire avec construction',
  'Local commercial / activité',
  'Autre',
]

export default function CubPage() {
  const searchParams = useSearchParams()
  const statut = searchParams.get('statut')

  const [form, setForm] = useState({
    prenom: '', nom: '', societe: '', email: '', tel: '',
    adresse: '', cp: '', ville: '', parcelle: '',
    type_projet: '', surface: '', description: '', plu_info: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      const res = await fetch('/api/stripe/cub-checkout', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (statut === 'success') {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#c29a6b]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#c29a6b]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Paiement confirmé !</h1>
          <p className="text-gray-400 leading-relaxed mb-4">
            Votre dossier CUb est en cours de préparation. Vous recevrez les trois documents par email
            <strong className="text-white"> sous 72h</strong>.
          </p>
          <div className="bg-[#111720] border border-[#c29a6b]/20 rounded-xl p-4 text-left text-sm text-gray-300 space-y-2 mb-8">
            <p>✓ Note descriptive du projet (CERFA 13410)</p>
            <p>✓ Check-list des pièces à joindre</p>
            <p>✓ Guide de dépôt en mairie</p>
          </div>
          <a href="/" className="text-[#c29a6b] text-sm hover:underline">← Retour à l'accueil</a>
        </div>
      </div>
    )
  }

  if (statut === 'cancel') {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Paiement annulé</h1>
          <p className="text-gray-400 mb-8">Votre demande n'a pas été finalisée. Vous pouvez réessayer.</p>
          <a href="/cub" className="btn-primary inline-flex">Recommencer</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#111720]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/"><img src="/logo.png" alt="Closia" className="h-10" /></a>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Retour</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#c29a6b]/10 border border-[#c29a6b]/20 rounded-full px-4 py-1.5 text-xs text-[#c29a6b] uppercase tracking-widest mb-6">
            <FileText className="w-3.5 h-3.5" /> Service expert
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Préparation dossier<br />
            <span className="text-[#c29a6b]">Certificat d'Urbanisme Opérationnel</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Un dossier complet et conforme, préparé par un expert, pour sécuriser votre projet avant tout engagement.
          </p>
        </div>

        {/* Ce que vous recevez */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { num: '1', title: 'Note descriptive', desc: 'Rédigée et prête à insérer dans le CERFA 13410', color: 'text-[#c29a6b]', border: 'border-[#c29a6b]/20' },
            { num: '2', title: 'Check-list des pièces', desc: 'Personnalisée selon votre projet et votre commune', color: 'text-blue-400', border: 'border-blue-400/20' },
            { num: '3', title: 'Guide de dépôt', desc: 'Délais, interlocuteurs, conseils pratiques', color: 'text-green-400', border: 'border-green-400/20' },
          ].map(item => (
            <div key={item.num} className={`bg-[#111720] border ${item.border} rounded-xl p-5`}>
              <div className={`text-xs font-bold uppercase tracking-widest ${item.color} mb-2`}>Document {item.num}</div>
              <div className="font-semibold text-white mb-1">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div className="bg-[#111720] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Votre demande</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#c29a6b]">290 €</div>
              <div className="text-xs text-gray-500">HT · Livraison sous 72h</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identité */}
            <div>
              <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-4">Vos coordonnées</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Prénom *</label>
                  <input className="input w-full" required value={form.prenom} onChange={set('prenom')} placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Nom *</label>
                  <input className="input w-full" required value={form.nom} onChange={set('nom')} placeholder="Dupont" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Société</label>
                <input className="input w-full" value={form.societe} onChange={set('societe')} placeholder="Nom de votre société (optionnel)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
                  <input type="email" className="input w-full" required value={form.email} onChange={set('email')} placeholder="jean@exemple.fr" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Téléphone *</label>
                  <input className="input w-full" required value={form.tel} onChange={set('tel')} placeholder="06 00 00 00 00" />
                </div>
              </div>
            </div>

            {/* Parcelle */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-4">La parcelle concernée</p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Adresse *</label>
                <input className="input w-full" required value={form.adresse} onChange={set('adresse')} placeholder="12 chemin des Vignes" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Code postal *</label>
                  <input className="input w-full" required value={form.cp} onChange={set('cp')} placeholder="69000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Ville *</label>
                  <input className="input w-full" required value={form.ville} onChange={set('ville')} placeholder="Lyon" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Référence cadastrale</label>
                <input className="input w-full" value={form.parcelle} onChange={set('parcelle')} placeholder="Ex : AB 0123 (disponible sur cadastre.gouv.fr)" />
              </div>
            </div>

            {/* Projet */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-4">Votre projet</p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Type de projet *</label>
                <select className="input w-full" required value={form.type_projet} onChange={set('type_projet')}>
                  <option value="">Sélectionner…</option>
                  {TYPE_PROJETS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Surface de plancher envisagée (m²)</label>
                <input type="number" className="input w-full" value={form.surface} onChange={set('surface')} placeholder="120" />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Description du projet *</label>
                <textarea className="input w-full min-h-[100px] resize-none" required value={form.description} onChange={set('description')}
                  placeholder="Décrivez votre projet : nature de la construction, nombre de niveaux, destination (habitation, commerce…), contexte général…" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Informations PLU connues <span className="text-gray-600">(optionnel)</span>
                </label>
                <textarea className="input w-full min-h-[80px] resize-none" value={form.plu_info} onChange={set('plu_info')}
                  placeholder="Ex : zone UA, secteur protégé, servitudes connues, PPRI… (toute info utile pour personnaliser le dossier)" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#c29a6b] hover:bg-[#b8895a] text-black font-bold text-sm uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirection vers le paiement…</>
                : <><ArrowRight className="w-4 h-4" /> Procéder au paiement — 290 € HT</>}
            </button>

            <p className="text-center text-xs text-gray-600">
              Paiement sécurisé par Stripe · Livraison sous 72h par email
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
