'use client'

export default function CubDossierView({ dossier }: { dossier: any }) {

  function renderInline(text: string): string {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
        if (!cells.every(c => /^[-:| ]+$/.test(c))) tableRows.push(cells)
        continue
      }
      if (inTable) flushTable()
      if (!t) { if (inList) { html += '</ul>'; inList = false } continue }
      if (/^#{1,3}\s/.test(t)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h4>${renderInline(t.replace(/^#{1,3}\s+/, ''))}</h4>`
      } else if (/^[-•*]\s+/.test(t)) {
        if (!inList) { html += '<ul>'; inList = true }
        html += `<li>${renderInline(t.replace(/^[-•*]\s+/, ''))}</li>`
      } else if (/^\d+\.\s/.test(t)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<p class="numbered">${renderInline(t)}</p>`
      } else if (t.startsWith('>')) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<blockquote>${renderInline(t.replace(/^>\s*/, ''))}</blockquote>`
      } else {
        if (inList) { html += '</ul>'; inList = false }
        html += `<p>${renderInline(t)}</p>`
      }
    }
    if (inTable) flushTable()
    if (inList) html += '</ul>'
    return html
  }

  // Découper le rapport en 3 sections
  const rapport = dossier.rapport || ''
  const sec1Match = rapport.match(/##\s*1[.)]\s*Note descriptive[^\n]*\n([\s\S]*?)(?=##\s*2[.)]|$)/i)
  const sec2Match = rapport.match(/##\s*2[.)]\s*Check[^\n]*\n([\s\S]*?)(?=##\s*3[.)]|$)/i)
  const sec3Match = rapport.match(/##\s*3[.)]\s*Guide[^\n]*\n([\s\S]*?)$/i)

  const sections = [
    { num: '1', title: 'Note descriptive du projet', content: sec1Match?.[1]?.trim() || '', color: '#c29a6b' },
    { num: '2', title: 'Check-list des pièces à joindre', content: sec2Match?.[1]?.trim() || '', color: '#60a5fa' },
    { num: '3', title: 'Guide de dépôt en mairie', content: sec3Match?.[1]?.trim() || '', color: '#34d399' },
  ]

  const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/logo.png' : 'https://closia.net/logo.png'

  function imprimer() {
    const w = window.open('', '_blank')!
    const sectionsHtml = sections.map(s => `
      <div class="section-block">
        <div class="section-header" style="border-left:4px solid ${s.color};">
          <div class="section-num" style="background:${s.color};">${s.num}</div>
          <div class="section-title">${s.title}</div>
        </div>
        <div class="section-body">${renderLines(s.content.split('\n'))}</div>
      </div>
    `).join('')

    w.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Dossier CUb — ${dossier.adresse}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;background:#fff;font-size:13px;line-height:1.75}
    .cover{background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:36px 56px 32px;color:#fff;display:flex;align-items:center;justify-content:space-between}
    .cover-logo{height:48px;margin-bottom:16px;display:block}
    .cover-title{font-size:18px;font-weight:600;color:#fff;margin-bottom:4px}
    .cover-sub{font-size:10px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.5px}
    .cover-badge{background:rgba(194,154,107,.12);border:1px solid rgba(194,154,107,.35);border-radius:6px;padding:10px 18px;text-align:center}
    .cover-badge-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);margin-bottom:4px}
    .cover-badge-date{font-size:13px;font-weight:600;color:#c29a6b}
    .info-strip{background:#f7f5f0;border-bottom:1px solid #e8e2d5;padding:20px 56px}
    .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .info-item{background:#fff;border:1px solid #e8e2d5;border-radius:6px;padding:10px 12px}
    .info-item.wide{grid-column:1/-1}
    .info-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:2px}
    .info-value{font-size:12px;font-weight:600;color:#1a1a2e}
    .content{padding:32px 56px 48px}
    .section-block{margin-bottom:28px;page-break-inside:auto}
    .section-header{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:8px 12px;background:#f7f5f0;border-radius:6px;page-break-after:avoid}
    .section-num{background:#c29a6b;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
    .section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1a1a2e}
    .section-body{color:#374151;font-size:12.5px;line-height:1.8;padding:0 4px}
    .section-body p{margin-bottom:8px}
    .section-body h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#1a1a2e;margin:14px 0 6px;font-weight:700}
    .section-body ul{padding-left:18px;margin-bottom:8px}
    .section-body li{margin-bottom:4px}
    .section-body blockquote{border-left:3px solid #c29a6b;padding:6px 12px;background:#fffdf9;color:#6b7280;font-size:11px;font-style:italic;margin:8px 0}
    .section-body table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px;page-break-inside:auto}
    .section-body th{background:#1a1a2e;color:#fff;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
    .section-body td{padding:6px 10px;border-bottom:1px solid #e8e2d5;color:#374151;vertical-align:top}
    .section-body tr{page-break-inside:avoid}
    .section-body tr:nth-child(even) td{background:#f7f5f0}
    .footer{padding:14px 56px;background:#f7f5f0;border-top:1px solid #e8e2d5;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af}
    .footer-brand{font-weight:600;color:#c29a6b;letter-spacing:2px;font-size:11px}
    .confidential{background:#fff8ed;border:1px solid rgba(194,154,107,.4);border-radius:4px;padding:2px 8px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#c29a6b;font-weight:700}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .section-header{page-break-after:avoid;break-after:avoid}
      .section-body tr{page-break-inside:avoid;break-inside:avoid}
      @page{margin:1.2cm 1.5cm}
    }
  </style>
</head>
<body>
<div class="cover">
  <div>
    <img src="${logoUrl}" class="cover-logo" onerror="this.style.display='none'"/>
    <div class="cover-title">Dossier Certificat d'Urbanisme Opérationnel</div>
    <div class="cover-sub">Document confidentiel — Usage exclusif du destinataire</div>
  </div>
  <div class="cover-badge">
    <div class="cover-badge-label">Généré le</div>
    <div class="cover-badge-date">${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
</div>
<div class="info-strip">
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Demandeur</div><div class="info-value">${dossier.nom}</div></div>
    <div class="info-item"><div class="info-label">Type de projet</div><div class="info-value">${dossier.type_bien || '—'}</div></div>
    <div class="info-item"><div class="info-label">Date</div><div class="info-value">${new Date(dossier.created_at).toLocaleDateString('fr-FR')}</div></div>
    ${dossier.parcelle ? `<div class="info-item"><div class="info-label">Référence cadastrale</div><div class="info-value">${dossier.parcelle}</div></div>` : ''}
    ${dossier.surface ? `<div class="info-item"><div class="info-label">Surface envisagée</div><div class="info-value">${dossier.surface} m²</div></div>` : ''}
    <div class="info-item wide"><div class="info-label">Parcelle concernée</div><div class="info-value">${dossier.adresse}</div></div>
  </div>
</div>
<div class="content">${sectionsHtml}</div>
<div class="footer">
  <div class="footer-brand">CLOSIA</div>
  <div>contact@closia.net · 06 87 76 33 40 · closia.net</div>
  <div class="confidential">Confidentiel</div>
</div>
</body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Header */}
      <div className="bg-[#111720] border-b border-white/10 px-6 py-4 flex items-center justify-between print-btn">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Closia" className="h-9" />
          <div>
            <div className="text-xs text-[#c29a6b] uppercase tracking-widest">Dossier CUb</div>
            <div className="text-sm font-semibold">{dossier.nom}</div>
          </div>
        </div>
        <button onClick={imprimer}
          className="flex items-center gap-2 text-sm bg-[#c29a6b] text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-[#b8895a] transition-colors">
          Télécharger / Imprimer PDF
        </button>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Infos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Demandeur', val: dossier.nom },
            { label: 'Projet', val: dossier.type_bien || '—' },
            { label: 'Parcelle', val: dossier.parcelle || '—' },
            { label: 'Adresse', val: dossier.adresse },
          ].map(i => (
            <div key={i.label} className="bg-[#111720] border border-white/10 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">{i.label}</div>
              <div className="text-sm font-medium">{i.val}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        {sections.map(s => (
          <div key={s.num} className="bg-[#111720] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10" style={{ borderLeftWidth: 4, borderLeftColor: s.color }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0" style={{ background: s.color }}>
                {s.num}
              </div>
              <h2 className="font-bold text-sm uppercase tracking-widest">{s.title}</h2>
            </div>
            <div className="px-6 py-5 prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderLines(s.content.split('\n')) }} />
          </div>
        ))}
      </div>
    </div>
  )
}
