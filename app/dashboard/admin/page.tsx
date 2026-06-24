'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock, CheckCircle, XCircle, Eye, LogOut,
  MapPin, Euro, FileText, ImageIcon, Download, ChevronRight,
  Timer, AlertCircle, X, Send, User, ShoppingCart, Ban, Zap, Loader2, Users
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Grille de prix ──────────────────────────────────────────
function getPrix(prixBien: number) {
  if (prixBien < 300000) return { exclu: 490, deux: 290, trois: 190 }
  if (prixBien <= 1000000) return { exclu: 890, deux: 490, trois: 320 }
  return { exclu: 1490, deux: 790, trois: 520 }
}

function getPrixLabel(prixBien: number, nbAcheteurs: number) {
  const g = getPrix(prixBien)
  if (nbAcheteurs === 1) return g.exclu
  if (nbAcheteurs === 2) return g.deux
  return g.trois
}

function timerColor(h: number) {
  if (h < 24) return 'text-red-400'
  if (h < 48) return 'text-orange-400'
  return 'text-green-400'
}

function heuresRestantes(dateExpiration: string) {
  return Math.max(0, (new Date(dateExpiration).getTime() - Date.now()) / 3600000)
}

const SECTIONS = [
  { key: 'dossiers', label: 'Dossiers', icon: <FileText className="w-4 h-4" />, alert: true },
  { key: 'analyses', label: 'Analyses préalables', icon: <Eye className="w-4 h-4" />, alert: true },
  { key: 'cub', label: 'Dossiers CUb', icon: <FileText className="w-4 h-4" />, alert: true },
  { key: 'live', label: 'En diffusion', icon: <Zap className="w-4 h-4" /> },
  { key: 'achetes', label: 'Leads achetés', icon: <ShoppingCart className="w-4 h-4" /> },
  { key: 'expires', label: 'Sans acquéreur', icon: <Ban className="w-4 h-4" /> },
]

function StatutBadge({ statut }: { statut: string }) {
  if (statut === 'pending') return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20"><AlertCircle className="w-3 h-3" /> À analyser</span>
  if (statut === 'diffuse') return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20"><CheckCircle className="w-3 h-3" /> En diffusion</span>
  if (statut === 'rejected') return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20"><XCircle className="w-3 h-3" /> Refusé</span>
  return null
}

export default function DashboardAdmin() {
  const router = useRouter()
  const [section, setSection] = useState('dossiers')
  const [tab, setTab] = useState('tous')
  const [biens, setBiens] = useState<any[]>([])
  const [leadsLive, setLeadsLive] = useState<any[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingLive, setLoadingLive] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [apporteur, setApporteur] = useState<any | null>(null)
  const [decision, setDecision] = useState<'validate' | 'reject' | null>(null)
  const [reponse, setReponse] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [selectedAnalyse, setSelectedAnalyse] = useState<any | null>(null)
  const [rapport, setRapport] = useState('')
  const [savingRapport, setSavingRapport] = useState(false)
  const [sendingRapport, setSendingRapport] = useState(false)
  const [rapportEnvoye, setRapportEnvoye] = useState(false)
  const [generatingRapport, setGeneratingRapport] = useState(false)
  const [corrections, setCorrections] = useState('')
  const [correctingRapport, setCorrectingRapport] = useState(false)
  const [cubs, setCubs] = useState<any[]>([])
  const [selectedCub, setSelectedCub] = useState<any | null>(null)
  const [generatingCub, setGeneratingCub] = useState(false)
  const [sendingCub, setSendingCub] = useState(false)
  const [cubEnvoye, setCubEnvoye] = useState(false)
  const [cubDossier, setCubDossier] = useState<{ note_descriptive: string; checklist: string; guide_depot: string } | null>(null)
  const [analysantBien, setAnalysantBien] = useState(false)
  const [complementsBien, setComplementsBien] = useState('')
  const [screeningBien, setScreeningBien] = useState('')
  const [brouillonValidation, setBrouillonValidation] = useState('')
  const [brouillonRefus, setBrouillonRefus] = useState('')
  const [potentielSynthetise, setPotentielSynthetise] = useState('')
  const [editingLead, setEditingLead] = useState<any | null>(null)
  const [editPotentiel, setEditPotentiel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [savingLead, setSavingLead] = useState(false)

  useEffect(() => { checkAdmin(); loadBiens(); loadAnalyses(); loadCubs() }, [])
  useEffect(() => { if (section === 'live') loadLeadsLive() }, [section])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile && profile.role !== 'admin') {
      router.push('/')
      return
    }
    setAuthChecked(true)
  }

  async function loadBiens() {
    setLoading(true)
    const { data } = await supabase
      .from('biens')
      .select('*, profiles!biens_apporteur_id_fkey(prenom, nom, tel, email, statut_pro)')
      .order('created_at', { ascending: false })
    setBiens(data || [])
    setLoading(false)
  }

  async function loadAnalyses() {
    const { data } = await supabase
      .from('analyses')
      .select('*')
      .neq('type', 'cub')
      .order('created_at', { ascending: false })
    setAnalyses(data || [])
  }

  async function loadCubs() {
    const { data } = await supabase
      .from('analyses')
      .select('*')
      .eq('type', 'cub')
      .order('created_at', { ascending: false })
    setCubs(data || [])
  }

  async function genererDossierCub() {
    if (!selectedCub) return
    setGeneratingCub(true)
    try {
      const msgParts = (selectedCub.message || '').split('\n---\n')
      const objectif = msgParts[0] || ''
      const plu_info = msgParts[1] || ''
      const res = await fetch('/api/cub/generate-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCub.id,
          nom: selectedCub.nom,
          adresse: selectedCub.adresse,
          cp: selectedCub.cp,
          ville: selectedCub.ville,
          parcelle: selectedCub.parcelle,
          type_projet: selectedCub.type_bien,
          objectif,
          surface: selectedCub.surface,
          description: selectedCub.description,
          plu_info,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCubDossier({ note_descriptive: data.note_descriptive, checklist: data.elements_cerfa || '', guide_depot: '' })
      await loadCubs()
    } catch (err: any) {
      alert('Erreur génération CUb : ' + err.message)
    } finally {
      setGeneratingCub(false)
    }
  }

  function telechargerCerfaCub() {
    if (!selectedCub) return
    const note = cubDossier?.note_descriptive || selectedCub.rapport?.replace(/##.*\n/g, '').trim() || ''
    const cerfa = cubDossier?.checklist || ''
    const logoUrl = window.location.origin + '/logo.png'
    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>CERFA 13410 — ${selectedCub.adresse}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a2e;background:#fff;line-height:1.6}
    .header{background:#0b1220;padding:20px 40px;display:flex;align-items:center;justify-content:space-between;color:#fff}
    .header img{height:36px}
    .header-title{font-size:14px;font-weight:700;color:#c29a6b}
    .header-sub{font-size:10px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px}
    .body{padding:32px 40px}
    .cerfa-title{text-align:center;margin-bottom:24px}
    .cerfa-title h1{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border:2px solid #1a1a2e;padding:8px 16px;display:inline-block}
    .cerfa-title p{font-size:10px;color:#6b7280;margin-top:4px}
    .section{margin-bottom:20px;border:1px solid #d1d5db;border-radius:4px;overflow:hidden}
    .section-header{background:#f3f4f6;padding:6px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#374151;border-bottom:1px solid #d1d5db}
    .section-body{padding:12px}
    .field{display:grid;grid-template-columns:200px 1fr;gap:8px;margin-bottom:8px;align-items:start}
    .field-label{font-size:10px;color:#6b7280;font-weight:600;padding-top:1px}
    .field-value{font-size:11px;color:#1a1a2e;border-bottom:1px solid #d1d5db;padding-bottom:3px;min-height:18px}
    .note-block{background:#fffdf9;border:1px solid rgba(194,154,107,.3);border-radius:4px;padding:14px;margin-top:8px}
    .note-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#c29a6b;font-weight:700;margin-bottom:8px}
    .note-text{font-size:11.5px;color:#374151;line-height:1.8;white-space:pre-wrap}
    .footer{padding:12px 40px;background:#f3f4f6;border-top:1px solid #d1d5db;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:1cm 1.5cm}}
  </style>
</head>
<body>
<div class="header">
  <div><img src="${logoUrl}" onerror="this.style.display='none'"/></div>
  <div style="text-align:right">
    <div class="header-title">CERFA 13410 — Demande de CUb</div>
    <div class="header-sub">Certificat d'Urbanisme Opérationnel · Préparé le ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
</div>
<div class="body">
  <div class="cerfa-title">
    <h1>Demande de Certificat d'Urbanisme Opérationnel</h1>
    <p>Article L410-1 b du Code de l'urbanisme — CERFA n° 13410</p>
  </div>

  <div class="section">
    <div class="section-header">1. Identité du demandeur</div>
    <div class="section-body">
      <div class="field"><span class="field-label">Nom et prénom</span><span class="field-value">${selectedCub.nom}</span></div>
      ${selectedCub.societe ? `<div class="field"><span class="field-label">Société</span><span class="field-value">${selectedCub.societe}</span></div>` : ''}
      <div class="field"><span class="field-label">Email</span><span class="field-value">${selectedCub.email}</span></div>
      <div class="field"><span class="field-label">Téléphone</span><span class="field-value">${selectedCub.tel || '—'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">2. Terrain concerné</div>
    <div class="section-body">
      <div class="field"><span class="field-label">Adresse</span><span class="field-value">${selectedCub.adresse}</span></div>
      <div class="field"><span class="field-label">Commune</span><span class="field-value">${selectedCub.ville} (${selectedCub.cp})</span></div>
      <div class="field"><span class="field-label">Référence cadastrale</span><span class="field-value">${selectedCub.parcelle || '[À compléter]'}</span></div>
      ${selectedCub.surface ? `<div class="field"><span class="field-label">Surface de plancher envisagée</span><span class="field-value">${selectedCub.surface} m²</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-header">3. Description du projet envisagé</div>
    <div class="section-body">
      <div class="field"><span class="field-label">Type de projet</span><span class="field-value">${selectedCub.type_bien || '—'}</span></div>
      <div class="note-block">
        <div class="note-label">Note descriptive (rubrique CERFA)</div>
        <div class="note-text">${note.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      </div>
    </div>
  </div>

  ${cerfa ? `<div class="section">
    <div class="section-header">4. Éléments complémentaires</div>
    <div class="section-body">
      <div class="note-text" style="white-space:pre-wrap;font-size:11px;color:#374151">${cerfa.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>
  </div>` : ''}

  <div class="section" style="margin-top:32px">
    <div class="section-header">Signatures</div>
    <div class="section-body" style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:20px">
      <div>
        <p style="font-size:10px;color:#6b7280;margin-bottom:24px;">Le demandeur (ou son mandataire)</p>
        <div style="border-top:1px solid #d1d5db;padding-top:4px;font-size:10px;color:#9ca3af;">Signature + date</div>
      </div>
      <div>
        <p style="font-size:10px;color:#6b7280;margin-bottom:24px;">Préparé par : Laurent Buffard — Closia</p>
        <div style="border-top:1px solid #d1d5db;padding-top:4px;font-size:10px;color:#9ca3af;">contact@closia.net · 06 87 76 33 40</div>
      </div>
    </div>
  </div>
</div>
<div class="footer">
  <span>CLOSIA · closia.net</span>
  <span>Document préparé le ${new Date().toLocaleDateString('fr-FR')} · Confidentiel</span>
</div>
</body></html>`)
    w.document.close()
    w.print()
  }

  async function envoyerCub() {
    if (!selectedCub || !cubDossier) return
    setSendingCub(true)
    try {
      const res = await fetch('/api/emails/envoyer-cub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyseId: selectedCub.id,
          nom: selectedCub.nom,
          email: selectedCub.email,
          adresse: selectedCub.adresse,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCubEnvoye(true)
      await loadCubs()
    } catch (err: any) {
      alert('Erreur envoi CUb : ' + err.message)
    } finally {
      setSendingCub(false)
    }
  }

  async function envoyerRapport() {
    if (!selectedAnalyse || !rapport.trim()) return
    setSendingRapport(true)
    try {
      const res = await fetch('/api/emails/envoyer-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyseId: selectedAnalyse.id,
          nom: selectedAnalyse.nom,
          email: selectedAnalyse.email,
          adresse: selectedAnalyse.adresse,
          description: selectedAnalyse.description,
          rapport,
          fichiers: selectedAnalyse.fichiers || [],
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRapportEnvoye(true)
      await loadAnalyses()
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSendingRapport(false)
    }
  }

  async function genererRapportIA() {
    if (!selectedAnalyse) return
    setGeneratingRapport(true)
    try {
      const res = await fetch('/api/analyses/generate-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type_bien: selectedAnalyse.type_bien,
          adresse: selectedAnalyse.adresse,
          cp: selectedAnalyse.cp,
          ville: selectedAnalyse.ville,
          parcelle: selectedAnalyse.parcelle,
          surface: selectedAnalyse.surface,
          type_operation: selectedAnalyse.type_operation,
          prix_acquisition: selectedAnalyse.prix_acquisition,
          frais_notaire: selectedAnalyse.frais_notaire,
          budget_travaux: selectedAnalyse.budget_travaux,
          prix_revente_cible: selectedAnalyse.prix_revente_cible,
          description: selectedAnalyse.description,
          message: selectedAnalyse.message,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRapport(data.rapport)
    } catch (err: any) {
      alert('Erreur génération IA : ' + err.message)
    } finally {
      setGeneratingRapport(false)
    }
  }

  async function corrigerRapportIA() {
    if (!selectedAnalyse || !corrections.trim() || !rapport.trim()) return
    setCorrectingRapport(true)
    try {
      const res = await fetch('/api/analyses/corriger-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAnalyse.id, corrections, rapport }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRapport(data.rapport)
      setCorrections('')
    } catch (err: any) {
      alert('Erreur correction IA : ' + err.message)
    } finally {
      setCorrectingRapport(false)
    }
  }

  async function sauvegarderRapport() {
    if (!selectedAnalyse) return
    setSavingRapport(true)
    await supabase.from('analyses').update({ rapport }).eq('id', selectedAnalyse.id)
    setSavingRapport(false)
  }

  function imprimerRapport() {
    if (!selectedAnalyse) return

    const logoUrl = window.location.origin + '/logo.png'
    const rapportTexte = rapport || selectedAnalyse.rapport || ''

    // --- Parseur markdown simplifié ---
    function renderInline(text: string): string {
      return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\[À VÉRIFIER\]/gi, '<span style="background:#fff8ed;border:1px solid #e8c87a;border-radius:3px;padding:1px 7px;font-size:11px;color:#b8860b;font-weight:700;">[À VÉRIFIER]</span>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
    }

    function renderLines(lines: string[]): string {
      let html = ''
      let inList = false
      let inTable = false
      let tableRows: string[][] = []

      function flushTable() {
        if (!tableRows.length) return
        const header = tableRows[0]
        const body = tableRows.slice(2) // skip separator row
        html += '<table><thead><tr>' + header.map(c => `<th>${renderInline(c)}</th>`).join('') + '</tr></thead><tbody>'
        body.forEach(row => { html += '<tr>' + row.map(c => `<td>${renderInline(c)}</td>`).join('') + '</tr>' })
        html += '</tbody></table>'
        tableRows = []
        inTable = false
      }

      for (const line of lines) {
        const t = line.trim()
        // Détection ligne de tableau markdown
        if (t.startsWith('|') && t.endsWith('|')) {
          if (inList) { html += '</ul>'; inList = false }
          inTable = true
          const cells = t.slice(1, -1).split('|').map(c => c.trim())
          // Ignorer la ligne séparateur (---|---)
          if (!cells.every(c => /^[-: ]+$/.test(c))) tableRows.push(cells)
          continue
        }
        if (inTable) flushTable()
        if (!t) { if (inList) { html += '</ul>'; inList = false } continue }
        if (/^[-•·]\s+/.test(t)) {
          if (!inList) { html += '<ul>'; inList = true }
          html += `<li>${renderInline(t.replace(/^[-•·]\s+/, ''))}</li>`
        } else {
          if (inList) { html += '</ul>'; inList = false }
          html += `<p>${renderInline(t)}</p>`
        }
      }
      if (inTable) flushTable()
      if (inList) html += '</ul>'
      return html
    }

    // Découpe en sections numérotées
    const allLines = rapportTexte.split('\n')
    const sections: { num: string; title: string; lines: string[] }[] = []
    let cur: { num: string; title: string; lines: string[] } | null = null

    for (const line of allLines) {
      const m = line.match(/^(\d+)[.)]\s+(.+)$/)
      if (m) {
        if (cur) sections.push(cur)
        cur = { num: m[1], title: m[2].trim(), lines: [] }
      } else if (cur) {
        cur.lines.push(line)
      }
    }
    if (cur) sections.push(cur)

    const sectionsHtml = sections.length > 0
      ? sections.map(s => `
          <div class="section-block">
            <div class="section-header">
              <div class="section-num">${s.num}</div>
              <div class="section-title">${s.title}</div>
            </div>
            <div class="section-body">${renderLines(s.lines)}</div>
          </div>`).join('')
      : `<div class="section-body">${renderLines(allLines)}</div>`

    const w = window.open('', '_blank')!
    w.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport d'analyse — ${selectedAnalyse.adresse}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;background:#fff;font-size:13.5px;line-height:1.75}
    /* HEADER */
    .cover{background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 56px 36px;color:#fff;display:flex;align-items:center;justify-content:space-between}
    .cover-left{}
    .cover-logo{height:52px;margin-bottom:20px;display:block}
    .cover-logo-text{font-size:26px;font-weight:700;color:#c29a6b;letter-spacing:6px;margin-bottom:20px}
    .cover-title{font-size:20px;font-weight:600;color:#fff;margin-bottom:6px}
    .cover-sub{font-size:11px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.5px}
    .cover-badge{background:rgba(194,154,107,.12);border:1px solid rgba(194,154,107,.35);border-radius:6px;padding:10px 18px;text-align:center}
    .cover-badge-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);margin-bottom:4px}
    .cover-badge-date{font-size:14px;font-weight:600;color:#c29a6b}
    /* INFO STRIP */
    .info-strip{background:#f7f5f0;border-bottom:1px solid #e8e2d5;padding:24px 56px}
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    .info-item{background:#fff;border:1px solid #e8e2d5;border-radius:8px;padding:12px 14px}
    .info-item.wide{grid-column:1/-1}
    .info-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:3px}
    .info-value{font-size:13px;font-weight:600;color:#1a1a2e}
    /* DESCRIPTION */
    .desc-strip{padding:20px 56px;background:#fffdf9;border-bottom:1px solid #e8e2d5;border-left:4px solid #c29a6b}
    .desc-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#c29a6b;margin-bottom:6px;font-weight:700}
    .desc-text{font-size:13px;color:#4b5563;line-height:1.7}
    /* CONTENT */
    .content{padding:36px 56px 48px}
    /* SECTIONS */
    .section-block{margin-bottom:32px;page-break-inside:avoid}
    .section-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #f0ebe0}
    .section-num{background:#c29a6b;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1a1a2e}
    .section-body{color:#374151;font-size:13.5px;line-height:1.8}
    .section-body p{margin-bottom:9px}
    .section-body ul{padding-left:18px;margin-bottom:9px}
    .section-body li{margin-bottom:5px}
    .section-body strong{color:#1a1a2e;font-weight:600}
    .section-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px}
    .section-body th{background:#1a1a2e;color:#fff;text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    .section-body td{padding:7px 12px;border-bottom:1px solid #e8e2d5;color:#374151;vertical-align:top}
    .section-body tr:nth-child(even) td{background:#f7f5f0}
    /* FOOTER */
    .footer{padding:16px 56px;background:#f7f5f0;border-top:1px solid #e8e2d5;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#9ca3af}
    .footer-brand{font-weight:600;color:#c29a6b;letter-spacing:2px;font-size:12px}
    .confidential{background:#fff8ed;border:1px solid rgba(194,154,107,.4);border-radius:4px;padding:3px 10px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#c29a6b;font-weight:700}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.section-block{page-break-inside:avoid}}
  </style>
</head>
<body>

<div class="cover">
  <div class="cover-left">
    <img src="${logoUrl}" class="cover-logo" onerror="this.style.display='none';document.getElementById('logo-text').style.display='block'"/>
    <div id="logo-text" class="cover-logo-text" style="display:none">CLOSIA</div>
    <div class="cover-title">Rapport d'analyse préalable</div>
    <div class="cover-sub">Document confidentiel — Usage exclusif du destinataire</div>
  </div>
  <div class="cover-badge">
    <div class="cover-badge-label">Généré le</div>
    <div class="cover-badge-date">${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
</div>

<div class="info-strip">
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Client</div><div class="info-value">${selectedAnalyse.nom}</div></div>
    <div class="info-item"><div class="info-label">Téléphone</div><div class="info-value">${selectedAnalyse.tel}</div></div>
    <div class="info-item"><div class="info-label">Email</div><div class="info-value">${selectedAnalyse.email}</div></div>
    <div class="info-item"><div class="info-label">Type de bien</div><div class="info-value">${selectedAnalyse.type_bien || '—'}</div></div>
    <div class="info-item"><div class="info-label">Date de la demande</div><div class="info-value">${new Date(selectedAnalyse.created_at).toLocaleDateString('fr-FR')}</div></div>
    ${selectedAnalyse.parcelle ? `<div class="info-item"><div class="info-label">Parcelle cadastrale</div><div class="info-value">${selectedAnalyse.parcelle}</div></div>` : '<div></div>'}
    <div class="info-item wide"><div class="info-label">Bien analysé</div><div class="info-value">${selectedAnalyse.adresse}</div></div>
  </div>
</div>

${selectedAnalyse.description ? `
<div class="desc-strip">
  <div class="desc-label">Description transmise par le client</div>
  <div class="desc-text">${selectedAnalyse.description}${selectedAnalyse.message ? '<br/><br/><em>' + selectedAnalyse.message + '</em>' : ''}</div>
</div>` : ''}

<div class="content">
  ${sectionsHtml}
</div>

<div class="footer">
  <div class="footer-brand">CLOSIA</div>
  <div>contact@closia.net &nbsp;·&nbsp; 06 87 76 33 40 &nbsp;·&nbsp; closia.net</div>
  <div class="confidential">Confidentiel</div>
</div>

</body>
</html>`)
    w.document.close()
    w.print()
  }

  async function loadLeadsLive() {
    setLoadingLive(true)
    const { data } = await supabase
      .from('biens')
      .select('*, profiles!biens_apporteur_id_fkey(prenom, nom), achats(*, profiles!achats_acheteur_id_fkey(prenom, nom, societe))')
      .eq('statut', 'diffuse')
      .order('date_diffusion', { ascending: false })
    setLeadsLive(data || [])
    setLoadingLive(false)
  }

  const filtered = tab === 'tous' ? biens : biens.filter(b =>
    tab === 'pending' ? b.statut === 'pending' :
    tab === 'diffuse' ? b.statut === 'diffuse' :
    b.statut === 'rejected'
  )

  const openDetail = (bien: any) => {
    setSelected(bien)
    setApporteur(bien.profiles)
    setDecision(null)
    setReponse('')
    setSent(false)
    setScreeningBien('')
    setPotentielSynthetise('')
    setBrouillonValidation('')
    setBrouillonRefus('')
    setComplementsBien('')
  }

  async function analyserBienIA() {
    if (!selected) return
    setAnalysantBien(true)
    try {
      const res = await fetch('/api/biens/analyser-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selected.type,
          prix: selected.prix,
          surface: selected.surface,
          ville: selected.ville,
          cp: selected.cp,
          adresse: selected.adresse,
          situation: selected.situation,
          description: selected.description,
          potentiel: selected.potentiel,
          apporteur: apporteur ? `${apporteur.prenom} ${apporteur.nom}` : '',
          complements: complementsBien,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setScreeningBien(data.screening)
      setPotentielSynthetise(data.potentiel_synthetise || '')
      setBrouillonValidation(data.brouillon_validation)
      setBrouillonRefus(data.brouillon_refus)
      // Sauvegarde persistante du screening en base
      if (data.screening && selected?.id) {
        await supabase.from('biens').update({ screening_ia: data.screening }).eq('id', selected.id)
        await loadBiens()
      }
    } catch (err: any) {
      alert('Erreur analyse IA : ' + err.message)
    } finally {
      setAnalysantBien(false)
    }
  }

  const handleDecision = async () => {
    if (!selected || !reponse.trim()) return
    setSending(true)
    try {
      if (decision === 'validate') {
        const now = new Date()
        const expiration = new Date(now.getTime() + 72 * 3600 * 1000)
        await supabase.from('biens').update({
          statut: 'diffuse',
          reponse_admin: reponse,
          date_diffusion: now.toISOString(),
          date_expiration: expiration.toISOString(),
        }).eq('id', selected.id)
      } else {
        if (selected.photos_urls?.length > 0) {
          const paths = selected.photos_urls.map((url: string) => {
            const parts = url.split('/closia-documents/')
            return parts[1] || ''
          }).filter(Boolean)
          if (paths.length > 0) await supabase.storage.from('closia-documents').remove(paths)
        }
        await supabase.from('biens').update({
          statut: 'rejected',
          reponse_admin: reponse,
          photos_urls: [],
        }).eq('id', selected.id)
      }
      // Notifier les acheteurs si validation
      if (decision === 'validate') {
        fetch('/api/emails/notify-acheteurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bienId: selected.id,
            type: selected.type,
            ville: selected.ville,
            cp: selected.cp,
            prix: selected.prix,
            surface: selected.surface,
          }),
        }).catch(console.warn) // non bloquant
      }

      // Envoyer email au vendeur
      if (apporteur?.email) {
        await fetch('/api/emails/notify-vendeur', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: apporteur.email,
            prenom: apporteur.prenom,
            type: selected.type,
            ville: selected.ville,
            decision,
            message: reponse,
          }),
        })
      }

      await loadBiens()
      setSent(true)
    } catch (err: any) {
      alert('Erreur : ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function sauvegarderLead() {
    if (!editingLead) return
    setSavingLead(true)
    await supabase.from('biens').update({
      potentiel: editPotentiel,
      description: editDescription,
    }).eq('id', editingLead.id)
    await loadLeadsLive()
    setSavingLead(false)
    setEditingLead(null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const pendingCount = biens.filter(b => b.statut === 'pending').length
  const liveCount = biens.filter(b => b.statut === 'diffuse').length
  const analysesPendingCount = analyses.filter(a => a.statut !== 'livree').length
  const cubsPendingCount = cubs.filter(c => !['livree'].includes(c.statut)).length
  const cubsValidesCount = cubs.filter(c => c.statut === 'validee').length

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#c29a6b]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex">

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#111720] border-r border-white/10 p-6 fixed top-0 left-0">
        <div className="mb-10">
          <img src="/logo.png" alt="Closia" className="h-12 w-auto" />
          <div className="text-xs text-[#c29a6b] mt-2 font-medium tracking-widest uppercase">Admin</div>
        </div>
        <nav className="flex-1 space-y-1">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${section === s.key ? 'bg-[#c29a6b]/15 text-[#c29a6b] font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {s.icon} {s.label}
              {s.key === 'dossiers' && pendingCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{pendingCount}</span>
              )}
              {s.key === 'analyses' && analysesPendingCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#c29a6b]/20 text-[#c29a6b]">{analysesPendingCount}</span>
              )}
              {s.key === 'cub' && cubsValidesCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">{cubsValidesCount} ✅</span>
              )}
              {s.key === 'cub' && cubsValidesCount === 0 && cubsPendingCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{cubsPendingCount}</span>
              )}
              {s.key === 'live' && liveCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{liveCount}</span>
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

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10">

        {/* ════ DOSSIERS ════ */}
        {section === 'dossiers' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Dossiers à analyser</h1>
              <p className="text-gray-400 text-sm mt-1">{pendingCount} en attente d'analyse</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total reçus', val: biens.length, color: 'text-white' },
                { label: 'À analyser', val: pendingCount, color: 'text-orange-400' },
                { label: 'Validés', val: biens.filter(b => b.statut === 'diffuse').length, color: 'text-green-400' },
                { label: 'Refusés', val: biens.filter(b => b.statut === 'rejected').length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#111720] border border-white/10 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              {[
                { key: 'tous', label: 'Tous' }, { key: 'pending', label: 'À analyser' },
                { key: 'diffuse', label: 'Validés' }, { key: 'rejected', label: 'Refusés' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`text-xs px-4 py-2 rounded-full transition-all ${tab === t.key ? 'bg-[#c29a6b] text-black font-medium' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : (
              <div className="space-y-3">
                {filtered.map(b => (
                  <div key={b.id} className="bg-[#111720] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        {b.photos_urls?.length > 0 ? (
                          <img src={b.photos_urls[0]} alt={b.type} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0 gap-0.5 ${b.statut === 'rejected' ? 'bg-red-500/10' : 'bg-white/5'}`}>
                            {b.statut === 'rejected' ? <><XCircle className="w-5 h-5 text-red-400" /><span className="text-xs text-red-400">Refusé</span></> : <ImageIcon className="w-5 h-5 text-gray-600" />}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatutBadge statut={b.statut} />
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(b.created_at)}</span>
                          </div>
                          <h3 className="font-semibold">{b.type}</h3>
                          <div className="flex flex-wrap gap-x-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{b.cp} – {b.ville}</span>
                            <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5 text-[#c29a6b]" />{Number(b.prix).toLocaleString('fr-FR')} €</span>
                            {b.profiles && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{b.profiles.prenom} {b.profiles.nom}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => openDetail(b)} className="btn-primary text-xs !py-2 !px-4 flex-shrink-0">
                        Analyser <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16 text-gray-500"><FileText className="w-8 h-8 mx-auto mb-3" />Aucun dossier.</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ════ DOSSIERS CUb ════ */}
        {section === 'cub' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Dossiers CUb</h1>
              <p className="text-gray-400 text-sm mt-1">
                {cubs.filter(c => c.statut === 'validee').length > 0 && <span className="text-green-400 font-semibold">{cubs.filter(c => c.statut === 'validee').length} à déposer en mairie · </span>}
                {cubs.filter(c => ['payee','en_validation'].includes(c.statut)).length} en cours · {cubs.filter(c => c.statut === 'livree').length} clôturés
              </p>
            </div>
            <div className="space-y-3">
              {cubs.length === 0 && (
                <div className="text-center py-16 text-gray-500"><FileText className="w-8 h-8 mx-auto mb-3" />Aucune demande CUb.</div>
              )}
              {cubs.map(c => (
                <div key={c.id} className="bg-[#111720] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {c.statut === 'pending' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20">En attente paiement</span>}
                        {c.statut === 'payee' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">✦ Payée — À traiter</span>}
                        {c.statut === 'en_validation' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">⏳ En attente validation client</span>}
                        {c.statut === 'validee' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold">✅ Validé — À déposer en mairie</span>}
                        {c.statut === 'livree' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-400 border border-white/10"><CheckCircle className="w-3 h-3" /> Déposé en mairie</span>}
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(c.created_at)}</span>
                      </div>
                      <h3 className="font-semibold">{c.nom}</h3>
                      <div className="flex flex-wrap gap-x-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{c.adresse}</span>
                        {c.type_bien && <span className="text-blue-400 text-xs">{c.type_bien}</span>}
                        <span>{c.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedCub(c); setCubDossier(c.rapport ? { note_descriptive: '', checklist: '', guide_depot: '' } : null); setCubEnvoye(false) }}
                      className="btn-primary text-xs !py-2 !px-4 flex-shrink-0">
                      Voir <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ ANALYSES PRÉALABLES ════ */}
        {section === 'analyses' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Analyses préalables</h1>
              <p className="text-gray-400 text-sm mt-1">{analysesPendingCount} en attente · {analyses.filter(a => a.statut === 'livree').length} livrées</p>
            </div>

            <div className="space-y-3">
              {analyses.length === 0 && (
                <div className="text-center py-16 text-gray-500"><Eye className="w-8 h-8 mx-auto mb-3" />Aucune demande d'analyse.</div>
              )}
              {analyses.map(a => (
                <div key={a.id} className="bg-[#111720] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {a.statut === 'payee' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#c29a6b]/15 text-[#c29a6b] border border-[#c29a6b]/20">✦ Payée — À traiter</span>}
                        {a.statut === 'livree' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20"><CheckCircle className="w-3 h-3" /> Livrée</span>}
                        {a.statut === 'pending' && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20">En attente paiement</span>}
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(a.created_at)}</span>
                      </div>
                      <h3 className="font-semibold">{a.nom}</h3>
                      <div className="flex flex-wrap gap-x-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{a.adresse}</span>
                        <span>{a.email}</span>
                        <span>{a.tel}</span>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedAnalyse(a); setRapport(a.rapport || ''); setRapportEnvoye(false) }}
                      className="btn-primary text-xs !py-2 !px-4 flex-shrink-0">
                      Voir <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ EN DIFFUSION ════ */}
        {section === 'live' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Leads en diffusion</h1>
              <p className="text-gray-400 text-sm mt-1">{leadsLive.length} lead{leadsLive.length > 1 ? 's' : ''} en ligne</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'En ligne', val: leadsLive.length, color: 'text-green-400' },
                { label: 'Acheteurs positionnés', val: leadsLive.reduce((a, l) => a + (l.achats?.filter((ac: any) => ac.statut !== 'annule').length || 0), 0), color: 'text-[#c29a6b]' },
                { label: 'Exclusifs pris', val: leadsLive.filter(l => l.achats?.some((ac: any) => ac.mode === 'exclusif' && ac.statut !== 'annule')).length, color: 'text-white' },
                { label: 'Revenus potentiels', val: leadsLive.reduce((a, l) => {
                  const acheteurs = l.achats?.filter((ac: any) => ac.statut !== 'annule') || []
                  if (acheteurs.length === 0) return a
                  return a + getPrixLabel(l.prix, acheteurs.length) * acheteurs.length
                }, 0).toLocaleString('fr-FR') + ' €', color: 'text-[#c29a6b]' },
              ].map(s => (
                <div key={s.label} className="bg-[#111720] border border-white/10 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {loadingLive ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : leadsLive.length === 0 ? (
              <div className="text-center py-16 text-gray-500"><Zap className="w-8 h-8 mx-auto mb-3" />Aucun lead en diffusion.</div>
            ) : (
              <div className="space-y-4">
                {leadsLive.map(lead => {
                  const h = heuresRestantes(lead.date_expiration)
                  const acheteurs = lead.achats?.filter((ac: any) => ac.statut !== 'annule') || []
                  const exclusifPris = acheteurs.some((ac: any) => ac.mode === 'exclusif')
                  const grille = getPrix(lead.prix)

                  return (
                    <div key={lead.id} className="bg-[#111720] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                              <Zap className="w-3 h-3" /> En ligne
                            </span>
                            <span className={`text-xs font-bold flex items-center gap-1 ${timerColor(h)}`}>
                              <Timer className="w-3 h-3" /> {Math.floor(h)}h {Math.floor((h % 1) * 60)}min restantes
                            </span>
                          </div>

                          {lead.photos_urls?.length > 0 && (
                            <img src={lead.photos_urls[0]} alt={lead.type} className="w-full h-40 object-cover rounded-xl mb-4" />
                          )}

                          <h3 className="font-semibold text-lg mb-1">{lead.type}</h3>
                          <div className="flex flex-wrap gap-x-4 text-sm text-gray-400 mb-4">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c29a6b]" />{lead.adresse}, {lead.cp} {lead.ville}</span>
                            <span className="flex items-center gap-1"><Euro className="w-3.5 h-3.5 text-[#c29a6b]" />{Number(lead.prix).toLocaleString('fr-FR')} €</span>
                            {lead.profiles && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{lead.profiles.prenom} {lead.profiles.nom}</span>}
                          </div>

                          {/* Potentiel affiché */}
                          {lead.potentiel && (
                            <div className="bg-[#c29a6b]/8 border border-[#c29a6b]/20 rounded-lg p-3 mb-4">
                              <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-1">✦ Potentiel affiché aux acheteurs</p>
                              <p className="text-xs text-gray-300 leading-relaxed">{lead.potentiel}</p>
                            </div>
                          )}

                          <button
                            onClick={() => { setEditingLead(lead); setEditPotentiel(lead.potentiel || ''); setEditDescription(lead.description || '') }}
                            className="text-xs px-3 py-1.5 border border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors mb-4 flex items-center gap-1.5">
                            <FileText className="w-3 h-3" /> Modifier le potentiel / description
                          </button>

                          {/* Barre timer */}
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Temps écoulé</span>
                              <span>{Math.floor(72 - h)}h / 72h</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${h < 24 ? 'bg-red-400' : h < 48 ? 'bg-orange-400' : 'bg-green-400'}`}
                                style={{ width: `${((72 - h) / 72) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Panel acheteurs + grille */}
                        <div className="lg:w-72 flex-shrink-0 space-y-3">
                          {/* Grille de prix */}
                          <div className="bg-[#0b1220] rounded-xl border border-white/10 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Grille de prix</p>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-[#c29a6b] font-medium">Exclusif (1 acheteur)</span>
                                <span className="text-white font-bold">{grille.exclu} €</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Partagé × 2</span>
                                <span className="text-gray-300">{grille.deux} € / acheteur</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Partagé × 3</span>
                                <span className="text-gray-300">{grille.trois} € / acheteur</span>
                              </div>
                            </div>
                          </div>

                          {/* Acheteurs */}
                          <div className="bg-[#0b1220] rounded-xl border border-white/10 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs text-gray-500 uppercase tracking-widest">Acheteurs</p>
                              <span className="text-xs text-[#c29a6b]">
                                {acheteurs.length} / {exclusifPris ? '1 (exclu)' : '3'}
                              </span>
                            </div>

                            {acheteurs.length === 0 ? (
                              <p className="text-xs text-gray-600 italic">Aucun acheteur pour l'instant</p>
                            ) : (
                              <div className="space-y-3">
                                {acheteurs.map((ac: any, i: number) => (
                                  <div key={i} className="text-xs border-t border-white/5 pt-2 first:border-0 first:pt-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-white font-medium">{ac.profiles?.societe || `${ac.profiles?.prenom} ${ac.profiles?.nom}`}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${ac.mode === 'exclusif' ? 'bg-[#c29a6b]/20 text-[#c29a6b]' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {ac.mode === 'exclusif' ? 'Exclu' : 'Partagé'}
                                      </span>
                                    </div>
                                    <p className="text-gray-500 mt-0.5">{formatDate(ac.created_at)}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Revenu estimé</span>
                                <span className="text-[#c29a6b] font-bold">
                                  {acheteurs.length === 0 ? '—' : `${(getPrixLabel(lead.prix, acheteurs.length) * acheteurs.length).toLocaleString('fr-FR')} €`}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-500">Exclusivité</span>
                                <span className={exclusifPris ? 'text-red-400' : 'text-green-400'}>
                                  {exclusifPris ? 'Prise' : 'Disponible'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ════ LEADS ACHETÉS ════ */}
        {section === 'achetes' && (
          <div className="text-center py-16 text-gray-500">
            <ShoppingCart className="w-8 h-8 mx-auto mb-3" />
            <p>Section en cours de développement.</p>
          </div>
        )}

        {/* ════ SANS ACQUÉREUR ════ */}
        {section === 'expires' && (
          <div className="text-center py-16 text-gray-500">
            <Ban className="w-8 h-8 mx-auto mb-3" />
            <p>Section en cours de développement.</p>
          </div>
        )}
      </main>

      {/* PANEL DÉTAIL CUb */}
      {selectedCub && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-end">
          <div className="bg-[#111720] border-l border-white/10 w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Dossier CUb — {selectedCub.nom}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedCub.adresse}</p>
                </div>
                <button onClick={() => setSelectedCub(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* Infos client */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-3">Client</p>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>👤 {selectedCub.nom}</p>
                  {selectedCub.societe && <p>🏢 {selectedCub.societe}</p>}
                  <p>✉️ {selectedCub.email}</p>
                  <p>📞 {selectedCub.tel}</p>
                </div>
              </div>

              {/* Infos projet */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {selectedCub.type_bien && <div className="bg-white/5 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Type de projet</div><div className="text-sm font-medium">{selectedCub.type_bien}</div></div>}
                {selectedCub.surface && <div className="bg-white/5 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Surface envisagée</div><div className="text-sm font-medium">{selectedCub.surface} m²</div></div>}
                {selectedCub.parcelle && <div className="bg-white/5 rounded-lg p-3 col-span-2"><div className="text-xs text-gray-500 mb-1">Référence cadastrale</div><div className="text-sm font-medium">{selectedCub.parcelle}</div></div>}
              </div>

              {selectedCub.description && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Description du projet</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedCub.description}</p>
                </div>
              )}
              {selectedCub.message && (
                <div className="mb-4">
                  {(() => {
                    const parts = (selectedCub.message || '').split('\n---\n')
                    const objectif = parts[0]
                    const plu = parts[1]
                    return (
                      <>
                        {objectif && <div className="mb-2"><span className="text-xs text-gray-500 uppercase tracking-widest mr-2">Objectif :</span><span className="text-sm text-gray-300">{objectif}</span></div>}
                        {plu && <div><span className="text-xs text-gray-500 uppercase tracking-widest mr-2">PLU :</span><span className="text-sm text-gray-400 italic">{plu}</span></div>}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Photos du client */}
              {Array.isArray(selectedCub.fichiers) && selectedCub.fichiers.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Photos transmises ({selectedCub.fichiers.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCub.fichiers.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="relative group block">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-white/10 group-hover:border-[#c29a6b]/40 transition-colors" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Download className="w-4 h-4 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Bannière validation client */}
              {selectedCub.statut === 'validee' && (
                <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-400 text-sm">Dossier validé par le client</p>
                    <p className="text-xs text-gray-400 mt-1">Le client a approuvé les éléments. Le dossier est prêt à être déposé en mairie.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/cub/marquer-depose', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ analyseId: selectedCub.id }),
                      })
                      if (res.ok) {
                        await loadCubs()
                        setSelectedCub((prev: any) => prev ? { ...prev, statut: 'livree' } : prev)
                      }
                    }}
                    className="text-xs px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition-colors flex-shrink-0"
                  >
                    Marquer déposé ✓
                  </button>
                </div>
              )}

              {selectedCub.statut === 'livree' && (
                <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <p className="text-sm text-gray-500">Dossier déposé en mairie — délai d'instruction : 2 mois.</p>
                </div>
              )}

              {/* Génération IA */}
              <div className="border-t border-white/10 pt-6">
                {cubEnvoye ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                    <p className="font-semibold mb-1">Envoyé pour validation !</p>
                    <p className="text-sm text-gray-400">Le client a reçu un email avec le lien de validation.</p>
                    <button onClick={() => setSelectedCub(null)} className="btn-primary mt-6 justify-center">Fermer</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!cubDossier ? (
                      <button onClick={genererDossierCub} disabled={generatingCub}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                        {generatingCub ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</> : <><Zap className="w-4 h-4" /> Générer le dossier CUb avec l'IA</>}
                      </button>
                    ) : (
                      <>
                        {/* Note descriptive */}
                        <div className="border border-[#c29a6b]/30 rounded-xl p-4">
                          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Note descriptive du projet</p>
                          <textarea
                            className="input min-h-[180px] resize-y text-sm w-full"
                            value={cubDossier.note_descriptive}
                            onChange={e => setCubDossier(d => d ? { ...d, note_descriptive: e.target.value } : d)}
                          />
                        </div>

                        {/* Éléments CERFA */}
                        <div className="border border-blue-500/30 rounded-xl p-4">
                          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Éléments CERFA pré-remplis</p>
                          <textarea
                            className="input min-h-[140px] resize-y text-sm w-full font-mono"
                            value={cubDossier.checklist}
                            onChange={e => setCubDossier(d => d ? { ...d, checklist: e.target.value } : d)}
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button onClick={genererDossierCub} disabled={generatingCub}
                            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
                            {generatingCub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Regénérer
                          </button>
                          <button onClick={telechargerCerfaCub}
                            className="flex items-center gap-2 px-4 py-2.5 border border-[#c29a6b]/40 rounded-xl text-sm text-[#c29a6b] hover:bg-[#c29a6b]/10 transition-colors">
                            <Download className="w-4 h-4" /> CERFA
                          </button>
                          <button onClick={envoyerCub} disabled={sendingCub}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#c29a6b] hover:bg-[#b8895a] text-black font-semibold rounded-xl transition-colors disabled:opacity-50">
                            {sendingCub ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : <><Send className="w-4 h-4" /> Envoyer pour validation</>}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL ANALYSE */}
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

              {selected.photos_urls?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Photos ({selected.photos_urls.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.photos_urls.map((url: string, i: number) => (
                      <div key={i} className="relative group">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <a href={url} download target="_blank" rel="noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Download className="w-5 h-5 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Prix demandé', val: `${Number(selected.prix).toLocaleString('fr-FR')} €` },
                  { label: 'Surface', val: selected.surface ? `${selected.surface} m²` : '—' },
                  { label: 'Situation', val: selected.situation || '—' },
                ].map(i => (
                  <div key={i.label} className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{i.label}</div>
                    <div className="text-sm font-medium">{i.val}</div>
                  </div>
                ))}
              </div>

              {/* Grille de prix applicable */}
              <div className="bg-[#c29a6b]/5 border border-[#c29a6b]/20 rounded-xl p-4 mb-6">
                <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-3">Grille de prix applicable</p>
                {(() => { const g = getPrix(selected.prix); return (
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 mb-1">Exclusif</p>
                      <p className="text-white font-bold text-base">{g.exclu} €</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 mb-1">Partagé × 2</p>
                      <p className="text-white font-bold text-base">{g.deux} €</p>
                      <p className="text-gray-500">/ acheteur</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 mb-1">Partagé × 3</p>
                      <p className="text-white font-bold text-base">{g.trois} €</p>
                      <p className="text-gray-500">/ acheteur</p>
                    </div>
                  </div>
                )})()}
              </div>

              {apporteur && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                  <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-3">Apporteur</p>
                  <p className="font-medium text-sm">{apporteur.prenom} {apporteur.nom} — {apporteur.statut_pro || '—'}</p>
                  {apporteur.tel && <p className="text-xs text-gray-400 mt-1">{apporteur.tel}</p>}
                </div>
              )}

              {selected.description && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.potentiel && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Potentiel identifié</p>
                  <div className="border-l-2 border-[#c29a6b]/40 pl-4">
                    <p className="text-sm text-gray-300 italic">{selected.potentiel}</p>
                  </div>
                </div>
              )}

              {selected.reponse_admin && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Réponse envoyée</p>
                  <div className={`p-4 rounded-xl border text-sm leading-relaxed ${selected.statut === 'diffuse' ? 'border-green-500/20 bg-green-500/5 text-green-300' : 'border-red-500/20 bg-red-500/5 text-red-300'}`}>
                    {selected.reponse_admin}
                  </div>
                </div>
              )}

              {/* ── ANALYSE IA ── */}
              <div className="border border-[#c29a6b]/30 bg-[#c29a6b]/5 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-[#c29a6b] uppercase tracking-widest font-semibold">Analyse IA du dossier</p>
                </div>

                {/* Résultat sauvegardé en base (visible quel que soit le statut) */}
                {(selected.screening_ia || screeningBien) && (
                  <div className="bg-[#0b1220] rounded-lg p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                    {screeningBien || selected.screening_ia}
                  </div>
                )}

                {selected.statut === 'pending' && (
                  <>
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-1.5 block">
                        Compléments d'information <span className="text-gray-600">(PLU, marché local, vérifications terrain…)</span>
                      </label>
                      <textarea
                        className="input min-h-[90px] resize-none rounded-xl text-sm w-full"
                        placeholder="Ex : PLU consulté — zone UB, COS 0.4, division possible sous conditions. Marché tendu sur le secteur, prix au m² ~3 200 €. Bien en limite de PPRI à vérifier…"
                        value={complementsBien}
                        onChange={e => setComplementsBien(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={analyserBienIA}
                      disabled={analysantBien}
                      className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-[#c29a6b] text-black font-semibold hover:bg-[#b8895a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                    >
                      {analysantBien ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse en cours…</> : <><Zap className="w-3.5 h-3.5" /> {selected.screening_ia ? 'Relancer l\'analyse' : 'Analyser avec l\'IA'}</>}
                    </button>

                    {screeningBien && (
                      <>
                        {/* Synthèse potentiel acheteurs */}
                        {potentielSynthetise && (
                          <div className="mb-3 border border-[#c29a6b]/40 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-[#c29a6b] uppercase tracking-widest font-semibold">✦ Synthèse potentiel (acheteurs)</p>
                              <button
                                onClick={async () => {
                                  await supabase.from('biens').update({ potentiel: potentielSynthetise }).eq('id', selected.id)
                                  await loadBiens()
                                  setSelected((prev: any) => prev ? { ...prev, potentiel: potentielSynthetise } : prev)
                                }}
                                className="text-xs px-3 py-1 rounded-lg bg-[#c29a6b] text-black font-semibold hover:bg-[#b8895a] transition-colors"
                              >
                                Appliquer au bien
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed italic">{potentielSynthetise}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button
                            onClick={() => { setDecision('validate'); setReponse(brouillonValidation) }}
                            className="text-xs p-3 rounded-lg border border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10 transition-colors text-left"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mb-1" />
                            Utiliser le brouillon de validation
                          </button>
                          <button
                            onClick={() => { setDecision('reject'); setReponse(brouillonRefus) }}
                            className="text-xs p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                          >
                            <XCircle className="w-3.5 h-3.5 mb-1" />
                            Utiliser le brouillon de refus
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {!selected.screening_ia && !screeningBien && selected.statut !== 'pending' && (
                  <p className="text-xs text-gray-500 italic">Aucune analyse IA enregistrée pour ce bien.</p>
                )}
              </div>

              <div className="border-t border-white/10 pt-6">
                {sent ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-[#c29a6b] mx-auto mb-3" />
                    <p className="font-semibold mb-1">Décision enregistrée</p>
                    <p className="text-sm text-gray-400">
                      {decision === 'reject' ? 'Bien refusé. Photos et documents supprimés.' : 'Bien validé et mis en diffusion pour 72h.'}
                    </p>
                    <button onClick={() => setSelected(null)} className="btn-primary mt-6 justify-center">Fermer</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Votre décision</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button onClick={() => setDecision('validate')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${decision === 'validate' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 text-gray-400 hover:border-green-500/50'}`}>
                        <CheckCircle className="w-4 h-4" /> Valider & diffuser
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
                        <button onClick={handleDecision} disabled={!reponse.trim() || sending}
                          className={`w-full justify-center flex items-center gap-2 py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${decision === 'validate' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {decision === 'validate' ? 'Valider et diffuser' : 'Refuser et notifier'}
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
      {/* PANEL DÉTAIL ANALYSE */}
      {selectedAnalyse && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-end">
          <div className="bg-[#111720] border-l border-white/10 w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Analyse préalable — {selectedAnalyse.nom}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedAnalyse.adresse}</p>
                </div>
                <button onClick={() => setSelectedAnalyse(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Infos client */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-3">Client</p>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>👤 {selectedAnalyse.nom}</p>
                  {selectedAnalyse.societe && <p>🏢 {selectedAnalyse.societe}</p>}
                  <p>✉️ {selectedAnalyse.email}</p>
                  <p>📞 {selectedAnalyse.tel}</p>
                </div>
              </div>

              {/* Infos bien */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {selectedAnalyse.type_bien && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <div className="text-sm font-medium">{selectedAnalyse.type_bien}</div>
                  </div>
                )}
                {selectedAnalyse.parcelle && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Parcelle cadastrale</div>
                    <div className="text-sm font-medium">{selectedAnalyse.parcelle}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Description du bien</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedAnalyse.description}</p>
              </div>

              {/* Message complexité */}
              {selectedAnalyse.message && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Précisions</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedAnalyse.message}</p>
                </div>
              )}

              {/* Documents */}
              {selectedAnalyse.fichiers?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Documents ({selectedAnalyse.fichiers.length})</p>
                  <div className="space-y-2">
                    {selectedAnalyse.fichiers.map((f: any, i: number) => (
                      <a key={i} href={f.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:border-[#c29a6b]/40 transition-all">
                        <Download className="w-4 h-4 text-[#c29a6b]" />
                        <span className="text-sm text-gray-300">{f.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rédaction du rapport */}
              <div className="border-t border-white/10 pt-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Rapport d'analyse</p>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={genererRapportIA} disabled={generatingRapport}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#c29a6b] hover:bg-[#b8911f] text-black font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {generatingRapport ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Génération en cours…</>
                      ) : (
                        <>✦ Générer avec l'IA</>
                      )}
                    </button>
                    <button onClick={sauvegarderRapport} disabled={savingRapport}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition-colors disabled:opacity-50">
                      {savingRapport ? 'Sauvegarde…' : '💾 Sauvegarder'}
                    </button>
                    <button onClick={imprimerRapport}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                      🖨️ PDF
                    </button>
                  </div>
                </div>
                {generatingRapport && (
                  <div className="bg-[#c29a6b]/5 border border-[#c29a6b]/20 rounded-xl p-4 mb-3 text-sm text-[#c29a6b] text-center">
                    ✦ Analyse en cours — collecte des données PLU, risques et marché local…
                  </div>
                )}
                <textarea
                  value={rapport}
                  onChange={e => setRapport(e.target.value)}
                  placeholder={`Cliquez sur "Générer avec l'IA" pour produire un premier rapport automatiquement, ou rédigez directement ici.\n\n• Potentiel de valorisation\n• Lecture PLU\n• Risques identifiés\n• Axes de création de valeur\n• Recommandations`}
                  className="input min-h-[280px] resize-y rounded-xl text-sm leading-relaxed w-full"
                />
              </div>

              {/* Corrections expert */}
              {rapport.trim() && (
                <div className="mb-6 bg-[#c29a6b]/5 border border-[#c29a6b]/20 rounded-xl p-4">
                  <p className="text-xs text-[#c29a6b] uppercase tracking-widest mb-2 font-semibold">✏️ Corrections expert</p>
                  <p className="text-xs text-gray-500 mb-3">Indiquez vos remarques (ex : "Zone PLU = A agricole, supprimer la division"). Claude corrigera le rapport.</p>
                  <textarea
                    value={corrections}
                    onChange={e => setCorrections(e.target.value)}
                    placeholder={"Ex : Section 2 : zone A agricole, pas constructible. Supprimer toute mention de division foncière.\nSection 9 : bien non éligible à la diffusion."}
                    className="input min-h-[100px] resize-y rounded-xl text-sm leading-relaxed w-full mb-3"
                  />
                  <button
                    onClick={corrigerRapportIA}
                    disabled={!corrections.trim() || correctingRapport}
                    className="text-xs px-4 py-2 rounded-lg bg-[#c29a6b] hover:bg-[#b8911f] text-black font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                    {correctingRapport ? <><Loader2 className="w-3 h-3 animate-spin" /> Correction en cours…</> : '🔄 Générer le rapport corrigé'}
                  </button>
                </div>
              )}

              {/* Statut & action */}
              <div className="border-t border-white/10 pt-6">
                {rapportEnvoye ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="font-semibold text-green-400 mb-1">Rapport envoyé et archivé</p>
                    <p className="text-sm text-gray-400 mb-6">Le rapport a été envoyé à <strong>{selectedAnalyse.email}</strong> et la demande est archivée.</p>
                    <button onClick={() => { setSelectedAnalyse(null); setRapport(''); setRapportEnvoye(false) }}
                      className="btn-primary justify-center">Fermer</button>
                  </div>
                ) : selectedAnalyse.statut === 'livree' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-green-400 py-2">
                      <CheckCircle className="w-5 h-5" /> Analyse envoyée et archivée
                    </div>
                    <button onClick={imprimerRapport}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-widest uppercase py-3 rounded-xl transition-colors">
                      🖨️ Réimprimer le rapport
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!rapport.trim() && (
                      <p className="text-xs text-center text-gray-500 italic">Rédigez le rapport ci-dessus pour pouvoir l’envoyer.</p>
                    )}
                    <button
                      onClick={imprimerRapport}
                      disabled={!rapport.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-widest uppercase py-3 rounded-xl transition-colors">
                      🖨️ Aperçu / Imprimer en PDF
                    </button>
                    <button
                      onClick={envoyerRapport}
                      disabled={!rapport.trim() || sendingRapport}
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-widest uppercase py-3.5 rounded-xl transition-colors">
                      {sendingRapport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendingRapport ? 'Envoi en cours…' : `Envoyer à ${selectedAnalyse.email}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL ÉDITION LEAD LIVE ════ */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111720] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Modifier le lead en diffusion</h2>
                  <p className="text-xs text-gray-400 mt-1">{editingLead.type} · {editingLead.cp} {editingLead.ville}</p>
                </div>
                <button onClick={() => setEditingLead(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#c29a6b] uppercase tracking-widest mb-2">✦ Potentiel de valorisation <span className="text-gray-500 normal-case">(visible aux acheteurs)</span></label>
                  <textarea
                    className="input min-h-[100px] resize-none w-full text-sm"
                    value={editPotentiel}
                    onChange={e => setEditPotentiel(e.target.value)}
                    placeholder="Division en 3 lots, rénovation puis revente, surélévation possible…"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Description <span className="text-gray-600 normal-case">(verrouillée, visible après achat)</span></label>
                  <textarea
                    className="input min-h-[80px] resize-none w-full text-sm"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Description détaillée du bien…"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingLead(null)} className="btn-outline flex-1 justify-center text-sm">Annuler</button>
                <button onClick={sauvegarderLead} disabled={savingLead} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
                  {savingLead ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</> : <><CheckCircle className="w-4 h-4" /> Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
