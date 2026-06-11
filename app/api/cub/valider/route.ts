import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { analyseId } = await req.json()
    if (!analyseId) return NextResponse.json({ error: 'analyseId requis' }, { status: 400 })

    // Récupérer les infos de la demande
    const { data: analyse, error: fetchError } = await supabase
      .from('analyses')
      .select('id, nom, email, adresse, statut')
      .eq('id', analyseId)
      .eq('type', 'cub')
      .single()

    if (fetchError || !analyse) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

    // Éviter la double validation
    if (analyse.statut === 'validee') {
      return NextResponse.json({ success: true, already_validated: true })
    }

    // Enregistrer la validation
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        statut: 'validee',
        validated_at: new Date().toISOString(),
      })
      .eq('id', analyseId)

    if (updateError) throw new Error(updateError.message)

    // Notifier Laurent
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: 'contact@closia.net',
      subject: `✅ Dossier CUb validé — ${analyse.nom} · ${analyse.adresse}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0b1220;color:#fff;border-radius:12px;">
          <p style="color:#34d399;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Validation client reçue</p>
          <h2 style="margin:0 0 8px;">Dossier CUb validé ✅</h2>
          <p style="color:#9ca3af;margin:0 0 24px;">Le client a approuvé le dossier — vous pouvez procéder au dépôt en mairie.</p>
          <div style="background:#111720;border:1px solid rgba(52,211,153,0.2);border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 4px;"><strong>Client :</strong> ${analyse.nom}</p>
            <p style="margin:0 0 4px;"><strong>Bien :</strong> ${analyse.adresse}</p>
            <p style="margin:0;"><strong>Validé le :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <p style="color:#6b7280;font-size:12px;">Accédez au dashboard admin pour retrouver le dossier complet.</p>
        </div>
      `,
    }).catch(console.warn)

    // Email de confirmation au client
    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: analyse.email,
      subject: 'Validation reçue — dépôt en mairie en cours',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
            <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Validation enregistrée ✓</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Dépôt en mairie en cours</p>
          </div>
          <div style="padding:36px 48px;">
            <p style="color:#9ca3af;margin:0 0 16px;">Bonjour ${analyse.nom},</p>
            <p style="color:#d1d5db;line-height:1.75;margin:0 0 24px;">
              Votre validation a bien été enregistrée pour le dossier concernant
              <strong style="color:#fff;">${analyse.adresse}</strong>.
              Je procède au dépôt officiel en mairie dans les meilleurs délais.
            </p>
            <div style="background:#111720;border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="color:#34d399;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:700;">Récapitulatif</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 6px;">✓ Dossier validé le ${new Date().toLocaleDateString('fr-FR')}</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 6px;">→ Dépôt en mairie sous 48h</p>
              <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;font-style:italic;">Délai d'instruction : 2 mois à compter du dépôt.</p>
            </div>
            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:14px 18px;">
              <p style="color:#c29a6b;font-size:13px;margin:0 0 4px;font-weight:600;">Des questions ?</p>
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                <a href="mailto:contact@closia.net" style="color:#c29a6b;">contact@closia.net</a> · 06 87 76 33 40
              </p>
            </div>
          </div>
          <div style="padding:20px 48px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:#6b7280;font-size:11px;margin:0;">Laurent Buffard · Fondateur Closia</p>
            <a href="https://closia.net" style="color:#c29a6b;font-size:11px;">closia.net</a>
          </div>
        </div>
      `,
    }).catch(console.warn)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
