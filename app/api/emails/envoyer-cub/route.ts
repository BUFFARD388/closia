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
    const { analyseId, nom, email, adresse } = await req.json()

    const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cub/dossier/${analyseId}`

    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: email,
      subject: `Votre dossier CUb est prêt — validation avant dépôt`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
            <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Votre dossier CUb est prêt ✓</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Validation requise avant dépôt en mairie</p>
          </div>
          <div style="padding:36px 48px;">
            <p style="color:#9ca3af;margin:0 0 8px;">Bonjour ${nom},</p>
            <p style="color:#d1d5db;line-height:1.75;margin:0 0 24px;">
              J'ai préparé le dossier complet de demande de Certificat d'Urbanisme Opérationnel pour le bien situé
              <strong style="color:#fff;">${adresse}</strong>.<br/>
              Avant de procéder au dépôt officiel en mairie, je vous demande de <strong style="color:#c29a6b;">relire et valider</strong> les éléments du dossier.
            </p>

            <div style="background:#111720;border:1px solid rgba(194,154,107,0.25);border-radius:10px;padding:18px 20px;margin-bottom:28px;">
              <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Le dossier comprend</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 8px;">✓ Note descriptive du projet (rubrique CERFA 13410)</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 8px;">✓ CERFA 13410 complété</p>
              <p style="color:#d1d5db;font-size:13px;margin:0;">✓ Plans d'insertion cadastrale</p>
            </div>

            <div style="background:rgba(194,154,107,0.08);border:2px solid rgba(194,154,107,0.4);border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
              <p style="color:#c29a6b;font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Action requise</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 16px;line-height:1.6;">
                Consultez le dossier, vérifiez que les informations sont exactes,<br/>puis cliquez sur <strong style="color:#fff;">« Je valide le dossier »</strong> pour autoriser le dépôt.
              </p>
              <a href="${validationUrl}"
                style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;">
                Consulter et valider mon dossier
              </a>
            </div>

            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px 18px;margin-bottom:16px;">
              <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.7;">
                ⚠️ <strong style="color:#d1d5db;">Rappel :</strong> Le délai d'instruction en mairie est de <strong style="color:#d1d5db;">2 mois</strong> à compter du dépôt du dossier complet.
                Le dépôt sera effectué uniquement après votre validation.
              </p>
            </div>

            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:14px 18px;">
              <p style="color:#c29a6b;font-size:13px;margin:0 0 4px;font-weight:600;">Une question sur le dossier ?</p>
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Contactez-moi directement : <a href="mailto:contact@closia.net" style="color:#c29a6b;">contact@closia.net</a>
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

    if (analyseId) {
      await supabase.from('analyses').update({ statut: 'en_validation' }).eq('id', analyseId)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
