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
    const adresse = formData.get('adresse') as string || ''
    const cp = formData.get('cp') as string || ''
    const ville = formData.get('ville') as string || ''
    const parcelle = formData.get('parcelle') as string || ''
    const type_projet = formData.get('type_projet') as string || ''
    const objectif = formData.get('objectif') as string || ''
    const surface = formData.get('surface') as string || ''
    const description = formData.get('description') as string || ''
    const plu_info = formData.get('plu_info') as string || ''
    const adresseComplete = [adresse, cp, ville].filter(Boolean).join(', ')

    // Upload des photos vers Supabase storage
    const photoFiles = formData.getAll('photos') as File[]
    const photoUrls: string[] = []

    for (const file of photoFiles) {
      if (!file || !file.name) continue
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `cub/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from('closia-documents')
        .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: false })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('closia-documents').getPublicUrl(path)
        photoUrls.push(publicUrl)
      }
    }

    // Enregistrer la demande en base
    const { data: analyse, error: dbError } = await supabase
      .from('analyses')
      .insert({
        nom, email, tel, societe,
        adresse: adresseComplete,
        cp, ville, parcelle,
        type_bien: type_projet,
        surface,
        description,
        message: [objectif, plu_info].filter(Boolean).join('\n---\n'),
        type: 'cub',
        statut: 'pending',
        fichiers: photoUrls,
      })
      .select('id')
      .single()

    if (dbError) throw new Error(dbError.message)

    // Notifier l'admin
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: 'contact@closia.net',
      subject: `Nouvelle demande CUb — ${nom} · ${adresseComplete}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0b1220;color:#fff;border-radius:12px;">
          <p style="color:#c29a6b;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Nouvelle demande dossier CUb — 490 € HT</p>
          <h2 style="margin:0 0 24px;">${nom}</h2>
          <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:16px;">
            ${societe ? `<p style="margin:0 0 4px;"><strong>Société :</strong> ${societe}</p>` : ''}
            <p style="margin:0 0 4px;"><strong>Email :</strong> ${email}</p>
            <p style="margin:0 0 4px;"><strong>Tél :</strong> ${tel}</p>
            <p style="margin:0;"><strong>Parcelle :</strong> ${adresseComplete} ${parcelle ? '· ' + parcelle : ''}</p>
          </div>
          <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 4px;"><strong>Objectif :</strong> ${objectif || '—'}</p>
            <p style="margin:0 0 4px;"><strong>Projet :</strong> ${type_projet}</p>
            ${surface ? `<p style="margin:0 0 4px;"><strong>Surface envisagée :</strong> ${surface} m²</p>` : ''}
            <p style="margin:0;">${description}</p>
            ${plu_info ? `<p style="margin:8px 0 0;color:#9ca3af;font-style:italic;">${plu_info}</p>` : ''}
          </div>
          <p style="color:#c29a6b;"><strong>${photoUrls.length} photo(s) jointe(s)</strong></p>
          <p style="margin-top:24px;color:#6b7280;font-size:12px;">Consultez le dashboard admin (onglet Dossiers CUb) pour traiter cette demande.</p>
        </div>
      `,
    }).catch(console.warn)

    // Email de confirmation au client
    await resend.emails.send({
      from: 'Laurent Buffard — Closia <noreply@closia.net>',
      to: email,
      subject: 'Votre demande CUb est bien enregistrée — Closia',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
            <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Demande bien reçue ✓</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Certificat d'Urbanisme Opérationnel</p>
          </div>
          <div style="padding:36px 48px;">
            <p style="color:#9ca3af;margin:0 0 16px;">Bonjour ${nom},</p>
            <p style="color:#d1d5db;line-height:1.75;margin:0 0 28px;">
              Votre demande pour <strong style="color:#fff;">${adresseComplete}</strong> a bien été enregistrée.
              Je prépare votre dossier (CERFA + plans) et vous recontacte <strong style="color:#fff;">sous 48h</strong>
              pour valider les éléments avant le dépôt officiel en mairie.
            </p>
            <div style="background:#111720;border:1px solid rgba(194,154,107,0.25);border-radius:10px;padding:18px 20px;margin-bottom:28px;">
              <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:700;">Les prochaines étapes</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 6px;">01 — Préparation du dossier CERFA + plans cadastraux</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 6px;">02 — Envoi pour relecture et validation de votre part</p>
              <p style="color:#d1d5db;font-size:13px;margin:0 0 6px;">03 — Dépôt officiel en mairie après validation</p>
              <p style="color:#9ca3af;font-size:12px;margin:10px 0 0;font-style:italic;">Délai d'instruction mairie : 2 mois à compter du dépôt.</p>
            </div>
            <div style="background:rgba(194,154,107,0.06);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:14px 18px;">
              <p style="color:#c29a6b;font-size:13px;margin:0;">Une question ? Contactez-moi directement.</p>
            </div>
          </div>
          <div style="padding:20px 48px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
            <p style="color:#6b7280;font-size:11px;margin:0;">Laurent Buffard · Fondateur Closia</p>
            <p style="color:#6b7280;font-size:11px;margin:4px 0;">contact@closia.net · 06 87 76 33 40</p>
            <a href="https://closia.net" style="color:#c29a6b;font-size:11px;">closia.net</a>
          </div>
        </div>
      `,
    }).catch(console.warn)

    // Session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Dossier CUb — Certificat d\'Urbanisme Opérationnel',
            description: 'CERFA 13410 complété, plans et insertion cadastrale, validation avant dépôt, dépôt officiel en mairie.',
          },
          unit_amount: 49000, // 490 € en centimes
        },
        quantity: 1,
      }],
      metadata: { analyseId: analyse.id, type: 'cub' },
      allow_promotion_codes: true,
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cub?statut=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cub?statut=cancel`,
    })

    await supabase.from('analyses').update({ stripe_session: session.id }).eq('id', analyse.id)

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
