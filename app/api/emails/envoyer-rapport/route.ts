import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Formatage du rapport en HTML email ───────────────────────────
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

// Styles pour le nouveau format HTML riche (section-block/box/estimation-grid/conclusion-block),
// scopés sous .rapport-riche pour ne pas affecter le reste de l'email. Rendu correctement par
// Gmail, Apple Mail, Outlook.com/nouveau Outlook — dégradation gracieuse ailleurs (le contenu
// reste lisible même sans le style, comme pour les blocs flex déjà utilisés dans cet email).
const RAPPORT_RICHE_STYLE = `
  .rapport-riche .section-block{margin-bottom:28px}
  .rapport-riche .section-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(194,154,107,0.2)}
  .rapport-riche .section-num{background:#c29a6b;color:#0b1220;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
  .rapport-riche .section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#fff}
  .rapport-riche .section-body{font-size:14px;line-height:1.8;color:#d1d5db}
  .rapport-riche .section-body p{margin:0 0 9px}
  .rapport-riche .section-body ul{padding-left:18px;margin:0 0 9px}
  .rapport-riche .section-body li{margin-bottom:5px}
  .rapport-riche .section-body strong{color:#fff}
  .rapport-riche table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px}
  .rapport-riche th{background:#1e293b;color:#c29a6b;text-align:left;padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
  .rapport-riche td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.06);color:#d1d5db;vertical-align:top}
  .rapport-riche .box{border-radius:7px;padding:14px 18px;margin:12px 0;font-size:13px;line-height:1.7}
  .rapport-riche .box-title{font-weight:700;margin-bottom:5px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
  .rapport-riche .box-blue{background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.3);color:#93c5fd}
  .rapport-riche .box-gold{background:rgba(194,154,107,0.1);border:1px solid rgba(194,154,107,0.35);color:#e8c87a}
  .rapport-riche .box-red{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);color:#fca5a5}
  .rapport-riche .box-green{background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);color:#86efac}
  .rapport-riche .estimation-grid{display:flex;gap:14px;margin:14px 0}
  .rapport-riche .estimation-card{flex:1;border-radius:8px;padding:18px 20px;text-align:center;border:1.5px solid rgba(255,255,255,0.1)}
  .rapport-riche .estimation-card.low{background:rgba(255,255,255,0.03)}
  .rapport-riche .estimation-card.high{background:#c29a6b;border-color:#c29a6b}
  .rapport-riche .estimation-card-label{font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px}
  .rapport-riche .estimation-card.high .estimation-card-label{color:rgba(11,18,32,0.65)}
  .rapport-riche .estimation-card-value{font-family:Georgia,serif;font-size:24px;color:#fff;line-height:1}
  .rapport-riche .estimation-card.high .estimation-card-value{color:#0b1220}
  .rapport-riche .estimation-card-sub{font-size:11px;color:#9ca3af;margin-top:4px}
  .rapport-riche .estimation-card.high .estimation-card-sub{color:rgba(11,18,32,0.6)}
  .rapport-riche .conclusion-block{background:rgba(255,255,255,0.04);border:1px solid rgba(194,154,107,0.25);border-radius:10px;padding:22px 24px;margin-top:12px}
  .rapport-riche .conclusion-block h3{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#c29a6b;font-weight:700;margin:0 0 14px}
  .rapport-riche .conclusion-rec-item{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:10px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start}
  .rapport-riche .conclusion-rec-num{background:#c29a6b;color:#0b1220;font-size:11px;font-weight:800;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  .rapport-riche .conclusion-rec-text{font-size:12.5px;color:#e5e7eb;line-height:1.6}
  .rapport-riche .conclusion-rec-text strong{color:#fff}
  .rapport-riche .conclusion-quote{border-left:3px solid #c29a6b;padding:10px 16px;margin-top:16px;background:rgba(255,255,255,0.03);border-radius:0 6px 6px 0;font-style:italic;font-size:12.5px;color:#cbd5e1;line-height:1.7}
  .rapport-riche .disclaimer{margin-top:20px;padding:12px 16px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:11px;color:#6b7280;line-height:1.6;border:1px solid rgba(255,255,255,0.08);font-style:italic}
`

function formatRapportHtml(texte: string): string {
  // Nouveau format : HTML riche généré directement par l'IA (section-block/box/estimation-grid/
  // conclusion-block) — on l'insère tel quel dans un wrapper scopé. Ancien format : texte
  // markdown-like, parsé ligne par ligne comme avant (compatibilité rapports déjà envoyés).
  if (/<div\s+class="section-block"/.test(texte)) {
    return `<style>${RAPPORT_RICHE_STYLE}</style><div class="rapport-riche">${texte}</div>`
  }

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
            <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 20px;">
              Voici l'analyse du bien que vous m'avez soumis. Elle a pour objectif de vous donner une lecture rapide du potentiel de valorisation et de vous aider à décider de la suite à donner à ce dossier.
            </p>

            <!-- Lien PDF — en haut pour visibilité immédiate -->
            <div style="background:rgba(194,154,107,0.08);border:1px solid rgba(194,154,107,0.3);border-radius:10px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <p style="color:#d1d5db;font-size:13px;margin:0;">📄 <strong style="color:#fff;">Imprimer ou télécharger ce rapport en PDF</strong></p>
              <a href="${rapportUrl}" style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;flex-shrink:0;">
                Télécharger PDF
              </a>
            </div>

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

            <!-- CTA Closia -->
            <div style="background:linear-gradient(135deg,rgba(194,154,107,0.08) 0%,rgba(194,154,107,0.03) 100%);border:1px solid rgba(194,154,107,0.25);border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
              <p style="color:#c29a6b;font-size:13px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Prochaine étape</p>
              <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 18px;">
                Si cette analyse confirme votre intérêt, vous pouvez soumettre ce bien sur Closia.<br/>
                Diffusion confidentielle · Réponse marché sous 72h · Aucune commission pour l'apporteur.
              </p>
              <a href="https://closia.net/auth/register?role=vendeur"
                style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Soumettre ce bien sur Closia
              </a>
            </div>

            <!-- Lien PDF bas de mail -->
            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:10px;padding:18px 20px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div>
                <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 4px;">📄 Télécharger le rapport en PDF</p>
                <p style="color:#9ca3af;font-size:12px;margin:0;">Imprimez ou enregistrez ce rapport pour le transmettre à votre client.</p>
              </div>
              <a href="${rapportUrl}" style="display:inline-block;background:transparent;color:#c29a6b;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:1px;border:1px solid rgba(194,154,107,0.4);white-space:nowrap;flex-shrink:0;">
                Ouvrir le rapport
              </a>
            </div>

            <!-- Confidentialité -->
            <div style="display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <span style="color:#6b7280;font-size:16px;flex-shrink:0;">🔒</span>
              <p style="color:#6b7280;font-size:12px;margin:0;line-height:1.6;">Ce rapport est confidentiel et établi à votre usage exclusif. Il ne constitue pas un avis juridique ou financier et ne peut être transmis à des tiers sans autorisation.</p>
            </div>

            <!-- Upsell CUb -->
            <div style="background:linear-gradient(135deg,rgba(194,154,107,0.08) 0%,rgba(27,42,74,0.4) 100%);border:1px solid rgba(194,154,107,0.25);border-radius:12px;padding:20px 24px;margin-bottom:32px;">
              <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:700;">Aller plus loin</p>
              <p style="color:#fff;font-size:15px;font-weight:600;margin:0 0 6px;">Préparez votre dossier de Certificat d'Urbanisme Opérationnel</p>
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 0 16px;">Note descriptive rédigée, check-list des pièces et guide de dépôt en mairie — un dossier complet prêt à soumettre, livré sous 72h.</p>
              <a href="https://closia.net/cub" style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
                Demander mon dossier CUb — 290 € HT
              </a>
            </div>

          </div>

          <!-- Pied de page -->
          <div style="background:#080e1a;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#4b5563;font-size:12px;margin:0 0 4px;">Laurent Buffard · Fondateur Closia</p>
            <p style="color:#4b5563;font-size:12px;margin:0 0 4px;">contact@closia.net · 06 87 76 33 40</p>
            <a href="https://closia.net" style="color:#c29a6b;font-size:12px;text-decoration:none;">closia.net</a>
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
