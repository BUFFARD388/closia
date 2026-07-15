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
    } else if (/^\d+\.\s+/.test(t)) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<p style="margin:0 0 6px;padding-left:4px;">${renderInline(t)}</p>`
    } else {
      if (inList) { html += '</ul>'; inList = false }
      html += `<p>${renderInline(t)}</p>`
    }
  }
  if (inTable) flushTable()
  if (inList) html += '</ul>'
  return html
}

function parseRapport(texte: string): { preamble: string; sections: { num: string; title: string; body: string }[] } {
  const allLines = texte.split('\n')
  const sections: { num: string; title: string; lines: string[] }[] = []
  const preambleLines: string[] = []
  let cur: { num: string; title: string; lines: string[] } | null = null

  for (const line of allLines) {
    const m = line.match(/^##?\s*(\d+)[.)]\s+(.+)$/) || line.match(/^(\d+)[.)]\s+(.+)$/)
    if (m) {
      if (cur) sections.push(cur)
      cur = { num: m[1], title: m[2].replace(/\*\*/g, '').trim(), lines: [] }
    } else if (cur) {
      cur.lines.push(line)
    } else {
      // Preamble: content before the first numbered section
      const t = line.trim()
      if (t && !t.startsWith('---') && !/^#+\s/.test(t)) preambleLines.push(line)
    }
  }
  if (cur) sections.push(cur)
  return {
    preamble: renderLines(preambleLines),
    sections: sections.map(s => ({ num: s.num, title: s.title, body: renderLines(s.lines) }))
  }
}

export default function RapportView({ analyse }: { analyse: any }) {
  // Nouveau format : le rapport est du HTML riche généré directement par l'IA
  // (composants section-block/box/estimation-grid/conclusion-block). Ancien format :
  // texte markdown-like, parsé ligne par ligne. On garde la compatibilité avec les
  // rapports déjà générés avant ce changement.
  const isHtmlFormat = /<div\s+class="section-block"/.test(analyse.rapport || '')
  const { preamble, sections } = isHtmlFormat ? { preamble: '', sections: [] as { num: string; title: string; body: string }[] } : parseRapport(analyse.rapport)
  const date = new Date(analyse.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Première photo transmise par le demandeur
  const photos: { name: string; url: string }[] = Array.isArray(analyse.fichiers) ? analyse.fichiers : []
  const coverPhoto = photos.find(f => /\.(jpe?g|png|webp|gif|heic|avif)$/i.test(f.name)) || photos[0]

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
        .cover-logo-img { height: 48px; width: auto; display: block; margin-bottom: 16px; object-fit: contain }
        .cover-photo { width: 100%; height: 260px; object-fit: cover; object-position: center; display: block }
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
        .section-block { margin-bottom: 32px }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #f0ebe0; page-break-after: avoid }
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
        .box { border-radius: 7px; padding: 14px 18px; margin: 12px 0; font-size: 13px; line-height: 1.7 }
        .box-title { font-weight: 700; margin-bottom: 5px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px }
        .box-blue { background: #eef4fb; border: 1px solid #cfe0f3; color: #1f2937 }
        .box-gold { background: #fdf6ea; border: 1px solid #e8c87a; color: #92660b }
        .box-red { background: #fdf2f2; border: 1px solid #f3c6c6; color: #b42318 }
        .box-green { background: #f1f8f0; border: 1px solid #c3e0bd; color: #276022 }
        .estimation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0 }
        .estimation-card { border-radius: 8px; padding: 18px 20px; text-align: center; border: 1.5px solid #e8e2d5 }
        .estimation-card.low { background: #f9f8f5; border-color: #e8e2d5 }
        .estimation-card.high { background: #1a1a2e; border-color: #1a1a2e }
        .estimation-card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; margin-bottom: 6px }
        .estimation-card.high .estimation-card-label { color: #c29a6b }
        .estimation-card-value { font-family: Georgia, serif; font-size: 26px; color: #1a1a2e; line-height: 1 }
        .estimation-card.high .estimation-card-value { color: #fff }
        .estimation-card-sub { font-size: 11px; color: #9ca3af; margin-top: 4px }
        .estimation-card.high .estimation-card-sub { color: rgba(255,255,255,.5) }
        .conclusion-block { background: #1a1a2e; border-radius: 10px; padding: 24px 28px; color: #fff; margin-top: 12px; page-break-inside: avoid }
        .conclusion-block h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #c29a6b; font-weight: 700; margin-bottom: 14px }
        .conclusion-rec { display: flex; flex-direction: column; gap: 8px }
        .conclusion-rec-item { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 6px; padding: 10px 14px; display: flex; gap: 12px; align-items: flex-start }
        .conclusion-rec-num { background: #c29a6b; color: #1a1a2e; font-size: 11px; font-weight: 800; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px }
        .conclusion-rec-text { font-size: 12.5px; color: #e5e7eb; line-height: 1.6 }
        .conclusion-rec-text strong { color: #fff }
        .conclusion-quote { border-left: 3px solid #c29a6b; padding: 10px 16px; margin-top: 16px; background: rgba(255,255,255,.04); border-radius: 0 6px 6px 0; font-style: italic; font-size: 12.5px; color: #cbd5e1; line-height: 1.7 }
        .disclaimer { margin-top: 20px; padding: 12px 16px; background: #f7f5f0; border-radius: 6px; font-size: 11px; color: #6b7280; line-height: 1.6; border: 1px solid #e8e2d5; font-style: italic }
        .footer { padding: 16px 56px; background: #f7f5f0; border-top: 1px solid #e8e2d5; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af }
        .footer-brand { font-weight: 600; color: #c29a6b; letter-spacing: 2px; font-size: 12px }
        .confidential { background: #fff8ed; border: 1px solid rgba(194,154,107,.4); border-radius: 4px; padding: 3px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #c29a6b; font-weight: 700 }
        .print-btn { position: fixed; bottom: 28px; right: 28px; background: #c29a6b; color: #fff; border: none; border-radius: 50px; padding: 14px 28px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(194,154,107,.4); display: flex; align-items: center; gap: 8px; z-index: 999 }
        .print-btn:hover { background: #a8835a }
        @page { margin: 1.2cm 1.5cm }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact }
          .print-btn { display: none }
          .section-block { page-break-inside: auto; break-inside: auto }
          .section-header { page-break-after: avoid; break-after: avoid; page-break-inside: avoid; break-inside: avoid }
          .section-body table { page-break-inside: auto; break-inside: auto }
          .section-body tr { page-break-inside: avoid; break-inside: avoid }
          .box { page-break-inside: avoid; break-inside: avoid }
          .estimation-grid { page-break-inside: avoid; break-inside: avoid }
          .conclusion-block { page-break-inside: avoid; break-inside: avoid }
          .cover-photo { height: 220px }
          .footer { position: relative; margin-top: 24px }
        }
      `}</style>

      <div className="cover">
        <div>
          <img src="/logo.png" alt="Closia" className="cover-logo-img" />
          <div className="cover-title">Rapport d&apos;analyse préalable</div>
          <div className="cover-sub">Document confidentiel — Usage exclusif du destinataire</div>
        </div>
        <div className="cover-badge">
          <div className="cover-badge-label">Généré le</div>
          <div className="cover-badge-date">{date}</div>
        </div>
      </div>

      {coverPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverPhoto.url} alt="Photo du bien" className="cover-photo" />
      )}

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
        {isHtmlFormat ? (
          <div dangerouslySetInnerHTML={{ __html: analyse.rapport }} />
        ) : (
          <>
            {preamble && <div className="section-body" style={{marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid #f0ebe0'}} dangerouslySetInnerHTML={{ __html: preamble }} />}
            {sections.map(s => (
              <div key={s.num} className="section-block">
                <div className="section-header">
                  <div className="section-num">{s.num}</div>
                  <div className="section-title">{s.title}</div>
                </div>
                <div className="section-body" dangerouslySetInnerHTML={{ __html: s.body }} />
              </div>
            ))}
          </>
        )}
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
