'use client'

import { useEffect } from 'react'

function renderInline(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[À VÉRIFIER\]/gi, '<mark>[À VÉRIFIER]</mark>')
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
    const body = tableRows.slice(2)
    html += '<table><thead><tr>' + header.map(c => `<th>${renderInline(c)}</th>`).join('') + '</tr></thead><tbody>'
    body.forEach(row => { html += '<tr>' + row.map(c => `<td>${renderInline(c)}</td>`).join('') + '</tr>' })
    html += '</tbody></table>'
    tableRows = []
    inTable = false
  }

  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('|') && t.endsWith('|')) {
      if (inList) { html += '</ul>'; inList = false }
      inTable = true
      const cells = t.slice(1, -1).split('|').map(c => c.trim())
      if (!cells.every(c => /^[-: ]+$/.test(c))) tableRows.push(cells)
      continue
    }
    if (inTable) flushTable()
    if (!t) { if (inList) { html += '</ul>'; inList = false } continue }
    if (/^#{1,3}\s+/.test(t)) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h3>${renderInline(t.replace(/^#{1,3}\s+/, ''))}</h3>`
    } else if (/^[-•·]\s+/.test(t)) {
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

function parseRapport(texte: string): { num: string; title: string; body: string }[] {
  const allLines = texte.split('\n')
  const sections: { num: string; title: string; lines: string[] }[] = []
  let cur: { num: string; title: string; lines: string[] } | null = null

  for (const line of allLines) {
    const m = line.match(/^##?\s*(\d+)[.)]\s+(.+)$/) || line.match(/^(\d+)[.)]\s+(.+)$/)
    if (m) {
      if (cur) sections.push(cur)
      cur = { num: m[1], title: m[2].replace(/\*\*/g, '').trim(), lines: [] }
    } else if (cur) {
      cur.lines.push(line)
    }
  }
  if (cur) sections.push(cur)
  return sections.map(s => ({ num: s.num, title: s.title, body: renderLines(s.lines) }))
}

export default function RapportView({ analyse }: { analyse: any }) {
  const sections = parseRapport(analyse.rapport)
  const date = new Date(analyse.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; background: #fff; font-size: 13.5px; line-height: 1.75 }
        .cover { background: linear-gradient(135deg, #0b1220 0%, #1b2a4a 100%); padding: 40px 56px 36px; color: #fff; display: flex; align-items: center; justify-content: space-between }
        .cover-logo { font-size: 26px; font-weight: 700; color: #c29a6b; letter-spacing: 6px; margin-bottom: 16px }
        .cover-title { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 4px }
        .cover-sub { font-size: 11px; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: 1.5px }
        .cover-badge { background: rgba(194,154,107,.12); border: 1px solid rgba(194,154,107,.35); border-radius: 6px; padding: 12px 20px; text-align: center }
        .cover-badge-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,.5); margin-bottom: 4px }
        .cover-badge-date { font-size: 14px; font-weight: 600; color: #c29a6b }
        .info-strip { background: #f7f5f0; border-bottom: 1px solid #e8e2d5; padding: 24px 56px }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px }
        .info-item { background: #fff; border: 1px solid #e8e2d5; border-radius: 8px; padding: 12px 14px }
        .info-item.wide { grid-column: 1 / -1 }
        .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 3px }
        .info-value { font-size: 13px; font-weight: 600; color: #1a1a2e }
        .desc-strip { padding: 18px 56px; background: #fffdf9; border-bottom: 1px solid #e8e2d5; border-left: 4px solid #c29a6b }
        .desc-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #c29a6b; margin-bottom: 6px; font-weight: 700 }
        .desc-text { font-size: 13px; color: #4b5563; line-height: 1.7 }
        .content { padding: 36px 56px 48px }
        .section-block { margin-bottom: 32px; page-break-inside: avoid }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #f0ebe0 }
        .section-num { background: #c29a6b; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0 }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e }
        .section-body { color: #374151; font-size: 13.5px; line-height: 1.8 }
        .section-body p { margin-bottom: 9px }
        .section-body h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c29a6b; margin: 16px 0 8px }
        .section-body ul { padding-left: 18px; margin-bottom: 9px }
        .section-body li { margin-bottom: 5px }
        .section-body strong { color: #1a1a2e; font-weight: 600 }
        .section-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12.5px }
        .section-body th { background: #1a1a2e; color: #fff; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px }
        .section-body td { padding: 7px 12px; border-bottom: 1px solid #e8e2d5; color: #374151; vertical-align: top }
        .section-body tr:nth-child(even) td { background: #f7f5f0 }
        .section-body mark { background: #fff8ed; border: 1px solid #e8c87a; border-radius: 3px; padding: 1px 6px; font-size: 11px; color: #b8860b; font-weight: 700 }
        .footer { padding: 16px 56px; background: #f7f5f0; border-top: 1px solid #e8e2d5; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af }
        .footer-brand { font-weight: 600; color: #c29a6b; letter-spacing: 2px; font-size: 12px }
        .confidential { background: #fff8ed; border: 1px solid rgba(194,154,107,.4); border-radius: 4px; padding: 3px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #c29a6b; font-weight: 700 }
        .print-btn { position: fixed; bottom: 28px; right: 28px; background: #c29a6b; color: #fff; border: none; border-radius: 50px; padding: 14px 28px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(194,154,107,.4); display: flex; align-items: center; gap: 8px; z-index: 999 }
        .print-btn:hover { background: #a8835a }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact }
          .print-btn { display: none }
          .section-block { page-break-inside: avoid }
        }
      `}</style>

      <div className="cover">
        <div>
          <div className="cover-logo">CLOSIA</div>
          <div className="cover-title">Rapport d&apos;analyse préalable</div>
          <div className="cover-sub">Document confidentiel — Usage exclusif du destinataire</div>
        </div>
        <div className="cover-badge">
          <div className="cover-badge-label">Généré le</div>
          <div className="cover-badge-date">{date}</div>
        </div>
      </div>

      <div className="info-strip">
        <div className="info-grid">
          <div className="info-item"><div className="info-label">Client</div><div className="info-value">{analyse.nom}</div></div>
          <div className="info-item"><div className="info-label">Type de bien</div><div className="info-value">{analyse.type_bien || '—'}</div></div>
          <div className="info-item"><div className="info-label">Surface</div><div className="info-value">{analyse.surface ? `${analyse.surface} m²` : '—'}</div></div>
          {analyse.parcelle && <div className="info-item"><div className="info-label">Parcelle cadastrale</div><div className="info-value">{analyse.parcelle}</div></div>}
          <div className={`info-item ${analyse.parcelle ? '' : 'wide'}`}><div className="info-label">Bien analysé</div><div className="info-value">{analyse.adresse}</div></div>
        </div>
      </div>

      {analyse.description && (
        <div className="desc-strip">
          <div className="desc-label">Description</div>
          <div className="desc-text">{analyse.description}</div>
        </div>
      )}

      <div className="content">
        {sections.map(s => (
          <div key={s.num} className="section-block">
            <div className="section-header">
              <div className="section-num">{s.num}</div>
              <div className="section-title">{s.title}</div>
            </div>
            <div className="section-body" dangerouslySetInnerHTML={{ __html: s.body }} />
          </div>
        ))}
      </div>

      <div className="footer">
        <div className="footer-brand">CLOSIA</div>
        <div>contact@closia.net · 06 87 76 33 40 · closia.net</div>
        <div className="confidential">Confidentiel</div>
      </div>

      <button className="print-btn" onClick={() => window.print()}>
        🖨️ Imprimer / Télécharger en PDF
      </button>
    </>
  )
}
