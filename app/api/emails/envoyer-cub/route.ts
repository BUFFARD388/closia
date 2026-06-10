import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { analyseId, nom, email, adresse, note_descriptive, checklist, guide_depot } = await req.json()

    const toHtml = (text: string) =>
      text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[-•]\s+(.+)$/gm, '<li style="margin:4px 0;color:#d1d5db;">$1</li>')
        .replace(/(<li[\s\S]*?<\/li>)/g, '<ul style="padding-left:20px;margin:8px 0;">$1</ul>')
        .replace(/\n\n/g, '</p><p style="color:#d1d5db;line-height:1.75;margin:0 0 12px;">')
        .replace(/\n/g, '<br/>')

    const sectionHtml = (title: string, content: string, color = '#c29a6b') => `
      <div style="margin-bottom:32px;">
        <div style="background:${color}22;border-left:3px solid ${color};padding:10px 16px;margin-bottom:14px;border-radius:0 6px 6px 0;">
          <p style="color:${color};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0;font-weight:700;">${title}</p>
        </div>
        <p style="color:#d1d5db;line-height:1.75;margin:0 0 12px;">${toHtml(content)}</p>
      </div>
    `

    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: email,
      subject: `Votre dossier CUb est prêt — ${adresse}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
            <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Votre dossier CUb est prêt ✓</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Certificat d'Urbanisme Opérationnel</p>
          </div>
          <div style="padding:36px 48px;">
            <p style="color:#9ca3af;margin:0 0 8px;">Bonjour ${nom},</p>
            <p style="color:#d1d5db;line-height:1.75;margin:0 0 32px;">
              Votre dossier de demande de Certificat d'Urbanisme Opérationnel pour le bien situé
              <strong style="color:#fff;">${adresse}</strong> est prêt.
              Retrouvez ci-dessous les trois documents à utiliser pour votre dépôt en mairie.
            </p>

            ${sectionHtml('1. Note descriptive du projet', note_descriptive)}
            ${sectionHtml('2. Check-list des pièces à joindre', checklist, '#60a5fa')}
            ${sectionHtml('3. Guide de dépôt en mairie', guide_depot, '#34d399')}

            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:16px 20px;margin-top:8px;">
              <p style="color:#c29a6b;font-size:13px;margin:0 0 6px;font-weight:600;">Besoin d'accompagnement supplémentaire ?</p>
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                N'hésitez pas à nous contacter à <a href="mailto:contact@closia.net" style="color:#c29a6b;">contact@closia.net</a>
                ou au 06 87 76 33 40.
              </p>
            </div>
          </div>
          <div style="padding:20px 48px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:#6b7280;font-size:11px;margin:0;">Laurent Buffard · Fondateur Closia</p>
            <p style="color:#6b7280;font-size:11px;margin:4px 0;">contact@closia.net · 06 87 76 33 40</p>
            <a href="https://closia.net" style="color:#c29a6b;font-size:11px;">closia.net</a>
          </div>
        </div>
      `,
    })

    // Mettre à jour le statut
    if (analyseId) {
      await supabase.from('analyses').update({ statut: 'livree' }).eq('id', analyseId)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
