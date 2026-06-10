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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const prenom = formData.get('prenom') as string || ''
    const nomRaw = formData.get('nom') as string || ''
    const nom = [prenom, nomRaw].filter(Boolean).join(' ')
    const societe = formData.get('societe') as string || ''
    const email = formData.get('email') as string
    const tel = formData.get('tel') as string
    const type_bien = formData.get('type_bien') as string || ''
    const adresse = formData.get('adresse') as string
    const cp = formData.get('cp') as string || ''
    const ville = formData.get('ville') as string || ''
    const parcelle = formData.get('parcelle') as string || ''
    const surface = formData.get('surface') as string || ''
    const type_operation = formData.get('type_operation') as string || ''
    const prix_acquisition = formData.get('prix_acquisition') as string || ''
    const frais_notaire = formData.get('frais_notaire') as string || 'marchand'
    const budget_travaux = formData.get('budget_travaux') as string || ''
    const prix_revente_cible = formData.get('prix_revente_cible') as string || ''
    const adresseComplete = [adresse, cp, ville].filter(Boolean).join(', ')
    const description = formData.get('description') as string
    const message = formData.get('message') as string || ''
    const files = formData.getAll('files') as File[]

    // Upload des fichiers sur Supabase Storage
    const fichiers: { name: string; url: string }[] = []
    for (const file of files) {
      if (!file.name) continue
      const buffer = await file.arrayBuffer()
      const ext = file.name.split('.').pop()
      const path = `analyses/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('closia-documents')
        .upload(path, Buffer.from(buffer), { contentType: file.type })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('closia-documents')
          .getPublicUrl(path)
        fichiers.push({ name: file.name, url: publicUrl })
      }
    }

    // Sauvegarder la demande en base
    const { data: analyse, error: dbError } = await supabase
      .from('analyses')
      .insert({
        nom, email, tel, societe,
        type_bien, surface, type_operation,
        adresse: adresseComplete,
        cp, ville, parcelle,
        prix_acquisition, frais_notaire, budget_travaux, prix_revente_cible,
        description, message,
        type: 'simple',
        statut: 'pending',
        fichiers,
      })
      .select('id')
      .single()

    if (dbError) throw new Error(dbError.message)

    // Notifier l'admin immédiatement
    const filesHtml = fichiers.length > 0
      ? fichiers.map(f => `<p style="margin:4px 0;"><a href="${f.url}" style="color:#c29a6b;">${f.name}</a></p>`).join('')
      : '<p style="color:#6b7280;">Aucun document joint</p>'

    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: 'contact@closia.net',
      subject: `Nouvelle demande d'analyse — ${nom}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0b1220;color:#fff;border-radius:12px;">
          <p style="color:#c29a6b;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Nouvelle demande d'analyse préalable</p>
          <h2 style="margin:0 0 24px;color:#fff;">${nom}</h2>
          <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:16px;">
            ${societe ? `<p style="margin:0 0 4px;"><strong>Société :</strong> ${societe}</p>` : ''}
            <p style="margin:0 0 4px;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0 0 4px;"><strong>Tél :</strong> ${tel}</p>
            <p style="margin:0;"><strong>Adresse :</strong> ${adresse}</p>
          </div>
          <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Description</p>
            <p style="margin:0;">${description}</p>
            ${message ? `<p style="margin:8px 0 0;color:#9ca3af;">${message}</p>` : ''}
          </div>
          <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Documents</p>
            ${filesHtml}
          </div>
          <p style="margin-top:24px;color:#6b7280;font-size:12px;">Le paiement est en cours — consultez le dashboard admin pour suivre le statut.</p>
        </div>
      `,
    }).catch(console.warn)

    // Email de confirmation immédiat au client
    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: email,
      subject: 'Votre demande d\'analyse a bien été reçue — Closia',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
            <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Demande bien reçue ✓</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Analyse préalable de valorisation</p>
          </div>
          <div style="padding:36px 48px;">
            <p style="color:#9ca3af;margin:0 0 16px;">Bonjour ${nom},</p>
            <p style="color:#d1d5db;line-height:1.75;margin:0 0 28px;">
              Votre demande d'analyse a bien été enregistrée. Dès réception de votre paiement,
              nous lançons l'analyse et vous recevrez votre rapport expert
              <strong style="color:#fff;">sous 72h</strong> à cette adresse email.
            </p>
            <div style="background:#111720;border:1px solid rgba(194,154,107,0.25);border-radius:10px;padding:18px 20px;margin-bottom:28px;">
              <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:700;">Récapitulatif de votre demande</p>
              ${type_bien ? `<p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Type de bien</p><p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 12px;">${type_bien}</p>` : ''}
              <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Adresse</p>
              <p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 12px;">${adresseComplete}</p>
              ${parcelle ? `<p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Parcelle cadastrale</p><p style="color:#fff;font-size:14px;font-weight:600;margin:0;">${parcelle}</p>` : ''}
            </div>
            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:14px 18px;margin-bottom:32px;">
              <p style="color:#c29a6b;font-size:13px;margin:0;">🔒 Vos informations sont strictement confidentielles et ne seront jamais communiquées à des tiers.</p>
            </div>
          </div>
          <div style="padding:20px 48px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:#6b7280;font-size:11px;margin:0;">Laurent Buffard · Fondateur Closia</p>
            <p style="color:#6b7280;font-size:11px;margin:4px 0;">contact@closia.net · 06 87 76 33 40</p>
            <a href="https://closia.net" style="color:#c29a6b;font-size:11px;">closia.net</a>
          </div>
        </div>
      `,
    }).catch(console.warn) // non bloquant

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: 'price_1TgoDMLHXjRRnPppM5R0imMv',
          quantity: 1,
        },
      ],
      metadata: {
        analyseId: analyse.id,
        type: 'analyse',
      },
      allow_promotion_codes: true,
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?analyse=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?analyse=cancel`,
    })

    // Sauvegarder l'ID session Stripe
    await supabase
      .from('analyses')
      .update({ stripe_session: session.id })
      .eq('id', analyse.id)

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

