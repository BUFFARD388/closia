'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, FileText, ArrowRight, X, ClipboardCheck, MapPin, Clock, Camera } from 'lucide-react'

const TYPE_PROJETS = [
  'Maison individuelle',
  'Immeuble collectif',
  'Extension / surélévation',
  'Changement d\'usage',
  'Division parcellaire avec construction',
  'Local commercial / activité',
  'Validation faisabilité avant vente',
  'Autre',
]

function CubContent() {
  const searchParams = useSearchParams()
  const statut = searchParams.get('statut')

  const [form, setForm] = useState({
    prenom: '', nom: '', societe: '', email: '', tel: '',
    adresse: '', cp: '', ville: '', parcelle: '',
    type_projet: '', surface: '', description: '', plu_info: '',
    objectif: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function compressPhoto(file: File, maxPx = 1600, quality = 0.75): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
          else { width = Math.round(width * maxPx / height); height = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => {
          resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file)
        }, 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (photos.length === 0) {
      setError('Veuillez joindre au moins une photo du terrain ou du bien.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Compression des photos avant envoi (max 1600px, qualité 75%)
      const compressed = await Promise.all(photos.map(f => compressPhoto(f)))

      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      compressed.forEach(f => fd.append('photos', f))

      const res = await fetch('/api/stripe/cub-checkout', { method: 'POST', body: fd })

      if (!res.ok) {
        const text = await res.text()
        if (text.includes('Entity Too Large') || res.status === 413) {
          throw new Error('Photos trop volumineuses. Réduisez leur taille ou le nombre de photos.')
        }
        throw new Error(`Erreur serveur (${res.status})`)
      }

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
            Votre demande est bien enregistrée. Laurent vous contactera
            <strong className="text-white"> sous 48h</strong> pour vous soumettre le dossier préparé et valider les éléments avant dépôt officiel en mairie.
          </p>
          <div className="bg-[#111720] border border-[#c29a6b]/20 rounded-xl p-5 text-left text-sm text-gray-300 space-y-3 mb-8">
            <p className="flex items-start gap-2"><span className="text-[#c29a6b] flex-shrink-0">01</span> Préparation du dossier CERFA + plans</p>
            <p className="flex items-start gap-2"><span className="text-[#c29a6b] flex-shrink-0">02</span> Envoi pour relecture et validation</p>
            <p className="flex items-start gap-2"><span className="text-[#c29a6b] flex-shrink-0">03</span> Dépôt officiel en mairie après validation</p>
            <div className="border-t border-white/10 pt-3 mt-3">
              <p className="text-xs text-gray-500">⏱ Délai d'instruction par la mairie : <strong className="text-gray-300">2 mois</strong> à partir du dépôt</p>
            </div>
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#c29a6b]/10 border border-[#c29a6b]/20 rounded-full px-4 py-1.5 text-xs text-[#c29a6b] uppercase tracking-widest mb-6">
            <FileText className="w-3.5 h-3.5" /> Service expert · Clé en main
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Dépôt dossier<br />
            <span className="text-[#c29a6b]">Certificat d'Urbanisme Opérationnel</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            De la préparation du dossier au dépôt officiel en mairie — avec validation de votre client avant envoi.
          </p>
        </div>

        {/* Deux cas d'usage */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#111720] border border-[#c29a6b]/20 rounded-xl p-5">
            <div className="text-[#c29a6b] mb-3"><ClipboardCheck className="w-5 h-5" /></div>
            <p className="text-sm font-semibold text-white mb-1">Valider un projet avant construction</p>
            <p className="text-xs text-gray-500 leading-relaxed">Obtenez une réponse officielle de la mairie sur la faisabilité de votre projet.</p>
          </div>
          <div className="bg-[#111720] border border-white/10 rounded-xl p-5">
            <div className="text-gray-400 mb-3"><MapPin className="w-5 h-5" /></div>
            <p className="text-sm font-semibold text-white mb-1">Sécuriser une vente avant achat</p>
            <p className="text-xs text-gray-500 leading-relaxed">Votre client veut savoir si un terrain est valorisable avant de s'engager.</p>
          </div>
        </div>

        {/* Process 4 étapes */}
        <div className="bg-[#111720] border border-white/10 rounded-2xl p-6 mb-10">
          <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-5">Ce que nous faisons pour vous</p>
          <div className="space-y-4">
            {[
              { n: '01', title: 'CERFA 13410 complété', desc: 'Nous remplissons l\'intégralité du formulaire réglementaire selon votre projet.' },
              { n: '02', title: 'Plans avec insertion cadastrale', desc: 'Réalisation des plans de situation et de masse intégrés au cadastre.' },
              { n: '03', title: 'Validation par votre client', desc: 'Échange avec vous pour valider les documents avant dépôt officiel.' },
              { n: '04', title: 'Dépôt officiel en mairie', desc: 'Nous déposons le dossier complet. Délai d\'instruction : 2 mois.' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-4">
                <span className="text-xs font-black text-[#c29a6b]/50 flex-shrink-0 pt-0.5 w-6">{step.n}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-white/10 flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-[#c29a6b] flex-shrink-0" />
            <span>Délai d'instruction mairie : <strong className="text-gray-300">2 mois</strong> à compter du dépôt.</span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-[#111720] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Votre demande</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#c29a6b]">490 €</div>
              <div className="text-xs text-gray-500">HT · Service complet</div>
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
                <label className="block text-sm text-gray-400 mb-1.5">Société <span className="text-gray-600">(optionnel)</span></label>
                <input className="input w-full" value={form.societe} onChange={set('societe')} placeholder="Agence, cabinet, réseau…" />
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
                <label className="block text-sm text-gray-400 mb-1.5">Référence cadastrale <span className="text-gray-600">(optionnel)</span></label>
                <input className="input w-full" value={form.parcelle} onChange={set('parcelle')} placeholder="Ex : AB 0123 (disponible sur cadastre.gouv.fr)" />
              </div>
            </div>

            {/* Projet */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-4">Votre projet</p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Objectif principal *</label>
                <select className="input w-full" required value={form.objectif} onChange={set('objectif')}>
                  <option value="">Sélectionner…</option>
                  <option value="Valider faisabilité avant vente">Valider la faisabilité avant une vente / acquisition</option>
                  <option value="Déposer pour construire">Déposer pour autoriser un projet de construction</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Type de projet *</label>
                <select className="input w-full" required value={form.type_projet} onChange={set('type_projet')}>
                  <option value="">Sélectionner…</option>
                  {TYPE_PROJETS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Surface de plancher envisagée (m²) <span className="text-gray-600">(optionnel)</span></label>
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
                  placeholder="Ex : zone UA, secteur protégé, servitudes connues, PPRI…" />
              </div>
            </div>

            {/* Photos — OBLIGATOIRE */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-1">Photos du terrain / bien</p>
              <p className="text-xs text-gray-500 mb-4">
                <span className="text-red-400 font-semibold">Obligatoire</span> — requis pour le dossier de dépôt en mairie. Joignez des photos de l'ensemble de la parcelle (façades, limites, accès, environnement proche).
              </p>

              <div
                onClick={() => document.getElementById('cub-photos')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${photos.length === 0 ? 'border-red-500/30 hover:border-red-500/60' : 'border-[#c29a6b]/40 hover:border-[#c29a6b]/70'}`}
              >
                <input
                  id="cub-photos"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files) setPhotos(prev => [...prev, ...Array.from(e.target.files!)])
                  }}
                />
                <Camera className={`w-8 h-8 mx-auto mb-3 ${photos.length === 0 ? 'text-red-400/50' : 'text-[#c29a6b]/50'}`} />
                <p className="text-sm text-gray-400">Cliquez pour ajouter des photos</p>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP · Plusieurs fichiers acceptés</p>
              </div>

              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photos.map((f, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-24 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={() => document.getElementById('cub-photos')?.click()}
                    className="h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
                  >
                    <span className="text-xs text-gray-500">+ Ajouter</span>
                  </div>
                </div>
              )}

              {photos.length === 0 && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Au moins une photo est requise pour valider la demande
                </p>
              )}
            </div>

            <div className="bg-[#c29a6b]/5 border border-[#c29a6b]/20 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
              <p className="text-[#c29a6b] font-medium mb-1">Comment ça se passe après le paiement ?</p>
              Nous préparons votre dossier (CERFA + plans cadastraux) et vous revenons sous 48h pour une validation avant dépôt. Une fois validé, nous déposons en mairie — délai d'instruction : <strong className="text-gray-300">2 mois</strong>.
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
                : <><ArrowRight className="w-4 h-4" /> Procéder au paiement — 490 € HT</>}
            </button>

            <p className="text-center text-xs text-gray-600">
              Paiement sécurisé par Stripe · Service complet inclus · Délai d'instruction mairie : 2 mois
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#c29a6b]" />
      </div>
    }>
      <CubContent />
    </Suspense>
  )
}
