import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Formatage du rapport en HTML email ─────────────────────
function renderInline(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[À VÉRIFIER\]/gi, '<span style="background:#fff8ed;border:1px solid #e8c87a;border-radius:3px;padding:1px 6px;font-size:11px;color:#b8860b;font-weight:700;">[À VÉRIFIER]</span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:600;">$1</strong>')
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
    html += '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;">'
    html += '<thead><tr>' + header.map(c => `<th style="background:#1e293b;color:#c29a6b;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">${renderInline(c)}</th>`).join('') + '</tr></thead>'
    html += '<tbody>' + body.map((row, i) => '<tr>' + row.map(c => `<td style="padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.06);color:#d1d5db;background:${i%2===0?'rgba(255,255,255,0.02)':'transparent'};vertical-align:top;">${renderInline(c)}</td>`).join('') + '</tr>').join('') + '</tbody>'
    html += '</table>'
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
    if (/^[-•·]\s+/.test(t)) {
      if (!inList) { html += '<ul style="padding-left:18px;margin:8px 0;">'; inList = true }
      html += `<li style="margin-bottom:5px;color:#d1d5db;">${renderInline(t.replace(/^[-•·]\s+/, ''))}</li>`
    } else {
      if (inList) { html += '</ul>'; inList = false }
      html += `<p style="margin:0 0 9px;color:#d1d5db;">${renderInline(t)}</p>`
    }
  }
  if (inTable) flushTable()
  if (inList) html += '</ul>'
  return html
}

function formatRapportHtml(texte: string): string {
  const allLines = texte.split('\n')
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

  if (sections.length === 0) return renderLines(allLines)

  return sections.map(s => `
    <div style="margin-bottom:28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(194,154,107,0.2);">
        <div style="background:#c29a6b;color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;text-align:center;line-height:24px;">${s.num}</div>
        <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#fff;">${s.title}</span>
      </div>
      <div style="font-size:14px;line-height:1.8;">${renderLines(s.lines)}</div>
    </div>`).join('')
}

export async function POST(req: Request) {
  try {
    const { analyseId, nom, email, adresse, description, rapport, fichiers } = await req.json()
    const rapportUrl = `https://closia.net/rapport/${analyseId}`

    const filesHtml = fichiers?.length > 0
      ? `<div style="background:#1a1a1a;border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="color:#9ca3af;font-size:11px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">Documents transmis</p>
          ${fichiers.map((f: any) => `<p style="margin:4px 0;"><a href="${f.url}" style="color:#c29a6b;">${f.name}</a></p>`).join('')}
        </div>`
      : ''

    // Email au client avec le rapport
    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: email,
      subject: `📋 Votre rapport d'analyse — ${adresse}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0b1220;color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- En-tête -->
          <div style="background:linear-gradient(135deg,#111720 0%,#0b1220 100%);padding:36px 40px 28px;border-bottom:1px solid rgba(194,154,107,0.25);">
            <p style="font-size:20px;font-weight:800;color:#c29a6b;letter-spacing:5px;margin:0 0 4px;font-family:Georgia,serif;">CLOSIA</p>
            <p style="color:#6b7280;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Analyse préalable · Confidentiel</p>
          </div>

          <!-- Corps -->
          <div style="padding:36px 40px;">

            <p style="color:#d1d5db;font-size:15px;margin:0 0 6px;">Bonjour <strong style="color:#fff;">${nom}</strong>,</p>
            <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 28px;">
              Voici l'analyse du bien que vous m'avez soumis. Elle a pour objectif de vous donner une lecture rapide du potentiel de valorisation et de vous aider à décider de la suite à donner à ce dossier.
            </p>

            <!-- Fiche du bien -->
            <div style="background:#111720;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #c29a6b;border-radius:8px;padding:18px 20px;margin-bottom:32px;">
              <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-weight:700;">Bien analysé</p>
              <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">${adresse}</p>
              <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6;">${description}</p>
            </div>

            <!-- Rapport -->
            <div style="margin-bottom:32px;">
              ${formatRapportHtml(rapport)}
            </div>

            ${filesHtml}

            <!-- Lien PDF -->
            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:10px;padding:18px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div>
                <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 4px;">📄 Télécharger le rapport en PDF</p>
                <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5;">Ouvrez ce lien dans votre navigateur pour consulter, imprimer ou enregistrer ce rapport en PDF.</p>
              </div>
              <a href="${rapportUrl}" style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;flex-shrink:0;">
                Voir le rapport
              </a>
            </div>

            <!-- CTA Closia -->
            <div style="background:linear-gradient(135deg,rgba(194,154,107,0.08) 0%,rgba(194,154,107,0.03) 100%);border:1px solid rgba(194,154,107,0.25);border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
              <p style="color:#c29a6b;font-size:13px;fon