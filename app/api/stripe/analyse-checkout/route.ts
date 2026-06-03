import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const nom = formData.get('nom') as string
    const email = formData.get('email') as string
    const tel = formData.get('tel') as string
    const adresse = formData.get('adresse') as string
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
        nom, email, tel, adresse, description, message,
        type: 'simple',
        statut: 'pending',
        fichiers,
      })
      .select('id')
      .single()

    if (dbError) throw new Error(dbError.message)

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

