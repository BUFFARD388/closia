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

    const nom = formData.get('nom') as string
    const email = formData.get('email') as string
    const tel = formData.get('tel') as string
    const type_bien = formData.get('type_bien') as string || ''
    const adresse = formData.get('adresse') as string
    const cp = formData.get('cp') as string || ''
    const ville = formData.get('ville') as string || ''
    const parcelle = formData.get('parcelle') as string || ''
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
        nom, email, tel,
        type_bien,
        adresse: adresseComplete,
        cp, ville, parcelle,
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

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: 'price_1TeJE4LHXjRRnPppbCgi1ybp',
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

