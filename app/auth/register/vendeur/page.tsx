'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Building2, Clock, CheckCircle, Archive, LogOut,
  ChevronRight, Timer, Euro, MapPin, FileText, Eye, Trash2, X,
  Upload, ImageIcon, File, AlertCircle, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { soumettreUnBien } from '@/lib/biens'

const TABS = [
  { key: 'tous', label: 'Tous', icon: <Building2 className="w-4 h-4" /> },
  { key: 'pending', label: 'En analyse', icon: <Clock className="w-4 h-4" /> },
  { key: 'diffuse', label: 'Diffusés', icon: <Timer className="w-4 h-4" /> },
  { key: 'archive', label: 'Archivés', icon: <Archive className="w-4 h-4" /> },
]

function StatutBadge({ statut }: { statut: string }) {
  if (statut === 'pending' || statut === 'analyse') return <span className="tag-analysis"><Clock className="w-3 h-3" /> En analyse</span>
  if (statut === 'diffuse') return <span className="tag-live"><Timer className="w-3 h-3" /> Diffusé</span>
  if (statut === 'archive' || statut === 'rejected') return <span className="tag-archived"><Archive className="w-3 h-3" /> Archivé</span>
  return null
}

interface UploadedFile { name: string; size: number; type: string }

function FileDropZone({ label, accept, multiple, files, onFiles, icon }: {
  label: string; accept: string; multiple?: boolean
  files: UploadedFile[]; onFiles: (f: UploadedFile[]) => void; icon: React.ReactNode
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const handleFiles = (fileList: FileList) => {
    const arr = Array.from(fileList).map(f => ({ name: f.name, size: f.size, type: f.type }))
    onFiles(multiple ? [...files, ...arr] : arr)
  }
  const removeFile = (i: number) => onFiles(files.filter((_, idx) => idx !== i))
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all ${dragging ? 'border-[#c29a6b] bg-[#c29a6b]/5' : 'border-white/20 hover:border-white/40'}`}
      >
        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)} />
        <div className="text-gray-400 mb-2">{icon}</div>
        <p className="text-sm text-gray-400">Glissez vos fichiers ou <span className="text-[#c29a6b]">parcourir</span></p>
        <p className="text-xs text-gray-600 mt-1">{accept.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}</p>
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 px-3 py-2 text-xs text-gray-300">
              <span className="flex items-center gap-2 truncate">
                <File className="w-3 h-3 flex-shrink-0 text-[#c29a6b]" />
                <span className="truncate">{f.name}</span>
                <span className="text-gray-600 flex-shrink-0">({(f.size / 1024).toFixed(0)} Ko)</span>
              </span>
              <button onClick={e => { e.stopPropagation(); removeFile(i) }} className="text-gray-500 hover:text-white ml-2 flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardVendeur() {
  const router = useRouter()
  const [tab, setTab] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<UploadedFile[]>([])
  const [docs, setDocs] = useState<UploadedFile[]>([])

  // Champs formulaire
  const [formType, setFormType] = useState('')
  const [formAdresse, setFormAdresse] = useState('')
  const [formCp, setFormCp] = useState('')
  const [formVille, setFormVille] = useState('')
  const [formPrix, setFormPrix] = useState('')
  const [formSurface, setFormSurface] = useState('')
  const [formSituation, setFormSituation] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPotentiel, setFormPotentiel] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      await loadBiens(user.id)
    }
    init()
  }, [])

  async function loadBiens(uid: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('biens')
      .select('*')
      .eq('apporteur_id', uid)
      .order('created_at', { ascending: false })
    if (!error) setBiens(data || [])
    setLoading(false)
  }

  const filtered = tab === 'tous' ? biens : biens.filter(b =>
    tab === 'pending' ? (b.statut === 'pending' || b.statut === 'analyse') :
    tab === 'archive' ? (b.statut === 'archive' || b.statut === 'rejected') :
    b.statut === tab
  )

  const resetModal = () => {
    setStep(1); setPhotos([]); setDocs([])
    setFormType(''); setFormAdresse(''); setFormCp(''); setFormVille('')
    setFormPrix(''); setFormSurface(''); setFormSituation('')
    setFormDescription(''); setFormPotentiel('')
    setShowModal(false)
  }

  const handleSubmit = async () => {
    if (!userId) return
    setSubmitting(true)
    try {
      await soumettreUnBien({
        type: formType,
        adresse: formAdresse,
        cp: formCp,
        ville: formVille,
        prix: Number(formPrix),
        surface: formSurface ? Number(formSurface) : undefined,
        situation: formSituation,
        description: formDescription,
        potentiel: formPotentiel,
        mandat_exclu: true,
      }, userId)
      await loadBiens(userId)
      setStep(3)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#111720] border-r border-white/10 p-6 fixed top-0 left-0">
          <div className="mb-10">
            <img src="/logo.png" alt="Closia" className="h-12 w-auto" />
            <div className="text-xs text-gray-500 mt-2">Espace apporteur</div>
          </div>
          <nav className="flex-1 space-y-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${tab === t.key ? 'bg-[#c29a6b]/15 text-[#c29a6b] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {t.icon} {t.label}
                {t.key !== 'tous' && (
                  <span className="ml-auto text-xs bg-white/10 px-2 py-0.5">
                    {biens.filter(b =>
                      t.key === 'pending' ? (b.statut === 'pending' || b.statut === 'analyse') :
                      t.key === 'archive' ? (b.statut === 'archive' || b.statut === 'rejected') :
                      b.statut === t.key
                    ).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="pt-6 border-t border-white/10">
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
              <h1 className="text-2xl font-bold">Mes biens</h1>
              <p className="text-gray-400 text-sm mt-1">{biens.length} bien{biens.length > 1 ? 's' : ''} soumis</p>
            </div>
            <button onClick={() => { setShowModal(true); setStep(1) }} className="btn-primary">
              <Plus className="w-4 h-4" /> Soumettre un bien
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', val: biens.length, color: 'text-white' },
              { label: 'En analyse', val: biens.filter(b => b.statut === 'pending' || b.statut === 'analyse').length, color: 'text-blue-400' },
              { label: 'Diffusés', val: biens.filter(b => b.statut === 'diffuse').length, color: 'text-[#c29a6b]' },
              { label: 'Archivés', val: biens.filter(b => b.statut === 'archive' || b.statut === 'rejected').length, color: 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#111720] border border-white/10 p-4 rounded-xl">
                <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs mobile */}
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-2">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-shrink-0 text-xs px-4 py-2 transition-all ${tab === t.key ? 'bg-[#c29a6b] text-black font-medium' : 'bg-white/5 text-gray-400'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
          ) : (
            <div className="space-y-4">
              {filtered.map(bien => (
                <div key={bien.id} className="bg-[#111720] border border-white/10 p-6 hover:border-white/20 transition-all rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatutBadge statut={bien.statut} />
                        {(bien.statut === 'pending' || bien.statut === 'analyse') && (
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Réponse sous 48h
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{bien.type}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />
                          {bien.adresse}, {bien.cp} {bien.ville}
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="w-3.5 h-3.5 text-[#c29a6b]" />
                          {Number(bien.prix).toLocaleString('fr-FR')} €
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Déposé le {formatDate(bien.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="border border-white/10 p-2 hover:border-white/30 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Building2 className="w-8 h-8 mx-auto mb-3" />
                  Aucun bien dans cette catégorie.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL SOUMISSION */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111720] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Soumettre un bien</h2>
                  <p className="text-xs text-gray-500 mt-1">Étape {step} / 3</p>
                </div>
                <button onClick={resetModal} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* Étape 1 */}
              {step === 1 && (
                <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type de bien *</label>
                    <select className="input" required value={formType} onChange={e => setFormType(e.target.value)}>
                      <option value="">Sélectionner…</option>
                      <option>Immeuble de rapport</option>
                      <option>Terrain constructible</option>
                      <option>Local commercial</option>
                      <option>Maison + terrain</option>
                      <option>Immeuble mixte</option>
                      <option>Entrepôt / logistique</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Adresse complète *</label>
                    <input className="input" placeholder="12 rue de la Paix" required value={formAdresse} onChange={e => setFormAdresse(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Code postal *</label>
                      <input className="input" placeholder="69000" required value={formCp} onChange={e => setFormCp(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ville *</label>
                      <input className="input" placeholder="Lyon" required value={formVille} onChange={e => setFormVille(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Prix demandé (€) *</label>
                      <input type="number" className="input" placeholder="500000" required value={formPrix} onChange={e => setFormPrix(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Surface (m²)</label>
                      <input type="number" className="input" placeholder="200" value={formSurface} onChange={e => setFormSurface(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Situation du bien *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Bien libre', 'Bien occupé (bail)', 'Bien occupé (titre)', 'En succession'].map(s => (
                        <label key={s} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer bg-white/5 px-3 py-2">
                          <input type="radio" name="situation" value={s} className="accent-[#c29a6b]" required
                            checked={formSituation === s} onChange={() => setFormSituation(s)} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description du bien</label>
                    <textarea className="input min-h-[80px] resize-none" placeholder="État général, particularités, historique…"
                      value={formDescription} onChange={e => setFormDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Potentiel identifié</label>
                    <textarea className="input min-h-[80px] resize-none" placeholder="Division, surélévation, changement d'usage…"
                      value={formPotentiel} onChange={e => setFormPotentiel(e.target.value)} />
                  </div>
                  <div className="border border-[#c29a6b]/30 rounded-xl overflow-hidden">
                    <div className="bg-[#c29a6b]/10 px-4 py-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#c29a6b] flex-shrink-0" />
                      <p className="text-xs font-semibold text-[#c29a6b] uppercase tracking-widest">Conditions requises</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" required className="mt-0.5 accent-[#c29a6b] flex-shrink-0 w-4 h-4" />
                        <div>
                          <p className="text-sm text-white font-medium mb-0.5">Mandat exclusif signé</p>
                          <p className="text-xs text-gray-400">Je certifie détenir un mandat exclusif signé par le vendeur sur ce bien.</p>
                        </div>
                      </label>
                      <div className="border-t border-white/10 pt-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" required className="mt-0.5 accent-[#c29a6b] flex-shrink-0 w-4 h-4" />
                          <div>
                            <p className="text-sm text-white font-medium mb-0.5">Bien non diffusé publiquement</p>
                            <p className="text-xs text-gray-400">Je certifie que ce bien n'est pas diffusé sur des plateformes immobilières.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={resetModal} className="btn-outline flex-1 justify-center">Annuler</button>
                    <button type="submit" className="btn-primary flex-1 justify-center">Suivant <ChevronRight className="w-4 h-4" /></button>
                  </div>
                </form>
              )}

              {/* Étape 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <FileDropZone label="Photos du bien" accept=".jpg,.jpeg,.png,.webp" multiple
                    files={photos} onFiles={setPhotos} icon={<ImageIcon className="w-8 h-8 mx-auto" />} />
                  <div className="border-t border-white/10 pt-6">
                    <p className="text-sm font-medium text-gray-300 mb-4">Documents</p>
                    <div className="space-y-4">
                      <FileDropZone label="Plan cadastral" accept=".pdf,.jpg,.png" files={[]}
                        onFiles={f => setDocs(prev => [...prev, ...f])} icon={<Upload className="w-6 h-6 mx-auto" />} />
                      <FileDropZone label="Diagnostics techniques" accept=".pdf" multiple files={[]}
                        onFiles={f => setDocs(prev => [...prev, ...f])} icon={<Upload className="w-6 h-6 mx-auto" />} />
                      <FileDropZone label="Autres documents" accept=".pdf,.jpg,.png,.docx" multiple files={[]}
                        onFiles={f => setDocs(prev => [...prev, ...f])} icon={<File className="w-6 h-6 mx-auto" />} />
                    </div>
                  </div>
                  {docs.length + photos.length > 0 && (
                    <div className="bg-white/5 p-3 text-xs text-gray-400">
                      {photos.length} photo{photos.length > 1 ? 's' : ''} · {docs.length} document{docs.length > 1 ? 's' : ''} joints
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(1)} className="btn-outline flex-1 justify-center">Retour</button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : <><CheckCircle className="w-4 h-4" /> Soumettre le dossier</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 3 */}
              {step === 3 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#c29a6b]/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[#c29a6b]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Dossier soumis !</h3>
                  <p className="text-gray-400 text-sm mb-2">Votre dossier est en cours d'analyse par notre expert.</p>
                  <p className="text-[#c29a6b] text-sm font-medium mb-8">Réponse garantie sous 48h.</p>
                  <button onClick={resetModal} className="btn-primary justify-center">Fermer</button>
                </div>
              )}

              {step < 3 && (
                <div className="flex justify-center gap-2 mt-6">
                  {[1, 2].map(s => (
                    <div key={s} className={`h-0.5 w-10 transition-colors ${s <= step ? 'bg-[#c29a6b]' : 'bg-white/10'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
