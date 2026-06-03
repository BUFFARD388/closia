import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
            <p style="color:#c29a6b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Rapport d'analyse expert</p>
            <div style="color:#e5e7eb;font-size:15px;line-height:1.85;white-space:pre-wrap;border-left:2px solid rgba(194,154,107,0.4);padding-left:20px;">${rapport}</div>
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
