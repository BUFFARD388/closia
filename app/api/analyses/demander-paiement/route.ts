import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Déclenché depuis l'admin une fois le rapport rédigé : crée le lien de paiement
// et envoie un email "votre analyse est prête" au client — sans le rapport complet,
// qui n'est livré qu'après paiement (voir stripe/webhook route.ts).
export async function POST(req: NextRequest) {
  try {
    const { analyseId } = await req.json()
    if (!analyseId) return NextResponse.json({ error: 'analyseId manquant' }, { status: 400 })

    const { data: analyse, error: fetchError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analyseId)
      .single()

    if (fetchError || !analyse) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    if (!analyse.rapport || !analyse.rapport.trim()) {
      return NextResponse.json({ error: "Le rapport doit être rédigé et enregistré avant d'envoyer la demande de paiement." }, { status: 400 })
    }

    const montant = 59000 // 590 € en centimes — garder synchronisé avec l'affichage landing/FAQ/CGV

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Analyse simple — Avis expert standard',
              description: `Rapport d'analyse — ${analyse.adresse}`,
            },
            unit_amount: montant,
          },
          quantity: 1,
        },
      ],
      metadata: {
        analyseId: analyse.id,
        type: 'analyse',
      },
      allow_promotion_codes: true,
      customer_email: analyse.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?analyse=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?analyse=cancel`,
    })

    await supabase
      .from('analyses')
      .update({ statut: 'paiement_demande', stripe_session: session.id })
      .eq('id', analyseId)

    const prenom = (analyse.nom || '').split(' ')[0] || analyse.nom

    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: analyse.email,
      subject: '✅ Votre analyse est prête — Closia',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
            <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Votre analyse est prête ✓</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Analyse préalable de valorisation</p>
          </div>
          <div style="padding:36px 48px;">
            <p style="color:#9ca3af;margin:0 0 16px;">Bonjour ${prenom},</p>
            <p style="color:#d1d5db;line-height:1.75;margin:0 0 24px;">
              Notre expert a terminé l'analyse du bien situé <strong style="color:#fff;">${analyse.adresse}</strong>.
              Le rapport complet est prêt et vous sera envoyé dès réception de votre règlement.
            </p>
            <div style="background:#111720;border:1px solid rgba(194,154,107,0.25);border-radius:10px;padding:20px 22px;margin-bottom:28px;">
              <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;font-weight:700;">Contenu du rapport</p>
              <div style="font-size:13px;color:#d1d5db;line-height:2;">
                · Synthèse du bien et de son potentiel<br/>
                · Étude urbanistique (PLU, constructibilité, servitudes)<br/>
                · Localisation et dynamique de marché<br/>
                · Risques et contraintes identifiés<br/>
                · Cohérence du prix et scénarios de valorisation<br/>
                · Fourchette de prix estimée<br/>
                · Recommandations Closia
              </div>
            </div>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${session.url}" style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Régler et recevoir mon rapport — 590 € HT
              </a>
            </div>
            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:14px 18px;">
              <p style="color:#c29a6b;font-size:13px;margin:0;">🔒 Vos informations restent strictement confidentielles et ne seront jamais communiquées à des tiers.</p>
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

    return NextResponse.json({ success: true, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
