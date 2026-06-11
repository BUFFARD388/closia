'use client'

import { useState } from 'react'
import { CheckCircle, FileText, Camera, AlertTriangle } from 'lucide-react'

export default function CubDossierView({ dossier }: { dossier: any }) {
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(dossier.statut === 'validee')
  const [error, setError] = useState('')

  // Extraire la note descriptive du rapport
  const rapport = dossier.rapport || ''
  const noteMatch = rapport.match(/## Note descriptive[^\n]*\n([\s\S]*?)(?=## Éléments CERFA|$)/i)
  const cerfahMatch = rapport.match(/## Éléments CERFA[^\n]*\n([\s\S]*?)$/i)
  const noteDescriptive = noteMatch?.[1]?.trim() || rapport.trim()
  const elementsCerfa = cerfahMatch?.[1]?.trim() || ''

  const photos: string[] = Array.isArray(dossier.fichiers) ? dossier.fichiers : []

  async function valider() {
    setValidating(true)
    setError('')
    try {
      const res = await fetch('/api/cub/valider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyseId: dossier.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la validation')
      setValidated(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setValidating(false)
    }
  }

  if (validated) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex flex-col">
        <div className="bg-[#111720] border-b border-white/10 px-6 py-4 flex items-center gap-4">
          <img src="/logo.png" alt="Closia" className="h-9" />
          <div>
            <div className="text-xs text-[#c29a6b] uppercase tracking-widest">Dossier CUb</div>
            <div className="text-sm font-semibold">{dossier.nom}</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Dossier validé ✓</h1>
            <p className="text-gray-400 leading-relaxed mb-6">
              Merci pour votre validation. Le dossier CUb pour le bien situé{' '}
              <strong className="text-white">{dossier.adresse}</strong> va être déposé en mairie.
            </p>
            <div className="bg-[#111720] border border-white/10 rounded-xl p-4 text-sm text-gray-400 text-left">
              <p className="text-[#c29a6b] font-semibold mb-2 text-xs uppercase tracking-widest">Prochaines étapes</p>
              <p className="mb-2">1. Dépôt officiel du dossier en mairie sous 48h</p>
              <p className="mb-2">2. Accusé de réception mairie (sous 15 jours)</p>
              <p>3. Décision dans un délai de <strong className="text-white">2 mois</strong> à compter du dépôt</p>
            </div>
            <p className="mt-6 text-xs text-gray-600">
              Pour toute question : <a href="mailto:contact@closia.net" className="text-[#c29a6b]">contact@closia.net</a> · 06 87 76 33 40
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Header */}
      <div className="bg-[#111720] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Closia" className="h-9" />
          <div>
            <div className="text-xs text-[#c29a6b] uppercase tracking-widest">Dossier CUb — Validation</div>
            <div className="text-sm font-semibold">{dossier.nom}</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Bandeau d'instruction */}
        <div className="bg-[#c29a6b]/10 border border-[#c29a6b]/40 rounded-2xl p-5 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-[#c29a6b] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#c29a6b] mb-1">Action requise — Validation avant dépôt</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Veuillez relire le dossier ci-dessous et vérifier que les informations sont exactes.
              Cliquez sur <strong className="text-white">« Je valide le dossier »</strong> en bas de page pour autoriser
              le dépôt officiel en mairie. Le dépôt sera effectué sous 48h après votre confirmation.
            </p>
          </div>
        </div>

        {/* Infos parcelle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Demandeur', val: dossier.nom },
            { label: 'Type de projet', val: dossier.type_bien || '—' },
            { label: 'Référence cadastrale', val: dossier.parcelle || '—' },
            { label: 'Adresse', val: dossier.adresse },
          ].map(i => (
            <div key={i.label} className="bg-[#111720] border border-white/10 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">{i.label}</div>
              <div className="text-sm font-medium">{i.val}</div>
            </div>
          ))}
        </div>

        {/* Photos transmises */}
        {photos.length > 0 && (
          <div className="bg-[#111720] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10" style={{ borderLeft: '4px solid #6b7280' }}>
              <Camera className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-sm uppercase tracking-widest text-gray-400">Photos transmises ({photos.length})</h2>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded-lg border border-white/10 hover:border-[#c29a6b]/40 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Note descriptive */}
        <div className="bg-[#111720] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10" style={{ borderLeft: '4px solid #c29a6b' }}>
            <FileText className="w-4 h-4 text-[#c29a6b]" />
            <h2 className="font-bold text-sm uppercase tracking-widest">Note descriptive du projet</h2>
          </div>
          <div className="px-6 py-5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {noteDescriptive}
          </div>
        </div>

        {/* Éléments CERFA */}
        {elementsCerfa && (
          <div className="bg-[#111720] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10" style={{ borderLeft: '4px solid #60a5fa' }}>
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-sm uppercase tracking-widest">Informations CERFA</h2>
            </div>
            <div className="px-6 py-5 text-gray-300 text-sm leading-relaxed font-mono whitespace-pre-wrap">
              {elementsCerfa}
            </div>
          </div>
        )}

        {/* Bloc de validation */}
        <div className="bg-[#111720] border border-[#c29a6b]/30 rounded-2xl p-6">
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            En cliquant sur <strong className="text-white">« Je valide le dossier »</strong>, vous confirmez que les informations
            ci-dessus sont exactes et autorisez Laurent Buffard (Closia) à procéder au dépôt officiel
            de votre demande de Certificat d'Urbanisme Opérationnel en mairie.
          </p>

          {error && (
            <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>
          )}

          <button
            onClick={valider}
            disabled={validating}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#c29a6b] hover:bg-[#b8895a] text-black font-bold text-base rounded-xl transition-colors disabled:opacity-50"
          >
            {validating ? (
              <span>Validation en cours…</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Je valide le dossier — Autoriser le dépôt
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-600 mt-3">
            Délai d'instruction mairie : 2 mois à compter du dépôt
          </p>
        </div>

      </div>
    </div>
  )
}
