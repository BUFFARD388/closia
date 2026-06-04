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
  for (const line of lines) {
    const t = line.trim()
    if (!t) { if (inList) { html += '</ul>'; inList = false } continue }
    if (/^[-•·]\s+/.test(t)) {
      if (!inList) { html += '<ul style="padding-left:18px;margin:8px 0;">'; inList = true }
      html += `<li style="margin-bottom:5px;color:#d1d5db;">${renderInline(t.replace(/^[-•·]\s+/, ''))}</li>`
    } else {
      if (inList) { html += '</ul>'; inList = false }
      html += `<p style="margin:0 0 9px;color:#d1d5db;">${renderInline(t)}</p>`
    }
  }
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
        <div style="font-family:Georgia,serif;max-width:680px;margin:0 auto;background:#0b1220;color:#ffffff;padding:48px;border-radius:12px;">
          <div style="border-bottom:1px solid rgba(194,154,107,0.3);padding-bottom:28px;margin-bottom:32px;">
            <p style="font-size:22px;font-weight:bold;color:#c29a6b;letter-spacing:4px;margin:0 0 4px;">CLOSIA</p>
            <p style="color:#6b7280;font-size:13px;margin:0;">Rapport d'analyse préalable — Confidentiel</p>
          </div>

          <p style="color:#9ca3af;font-size:14px;">Bonjour ${nom},</p>
          <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin-bottom:28px;">
            Veuillez trouver ci-dessous mon analyse experte du bien situé au <strong style="color:#fff;">${adresse}</strong>.
          </p>

          <div style="background:#111720;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px;margin-bottom:28px;">
            <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Bien analysé</p>
            <p style="color:#ffffff;font-size:14px;margin:0 0 8px;">${adresse}</p>
            <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6;">${description}</p>
          </div>

          <div style="margin-bottom:32px;">
            <p style="color:#c29a6b;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 20px;font-weight:700;">Rapport d'analyse expert</p>
            ${formatRapportHtml(rapport)}
          </div>

          ${filesHtml}

          <div style="background:rgba(194,154,107,0.05);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:16px;margin-bottom:32px;">
            <p style="color:#c29a6b;font-size:13px;margin:0;">🔒 Ce rapport est strictement confidentiel et établi à votre usage exclusif. Il ne peut être transmis à des tiers sans autorisation préalable.</p>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Laurent Buffard · Fondateur Closia</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0;">contact@closia.net · 06 87 76 33 40</p>
            <a href="https://closia.net" style="color:#c29a6b;font-size:12px;">closia.net</a>
          </div>
        </div>
      `,
    })

    // Marquer comme livrée en base
    await supabase
      .from('analyses')
      .update({ statut: 'livree', rapport })
      .eq('id', analyseId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
