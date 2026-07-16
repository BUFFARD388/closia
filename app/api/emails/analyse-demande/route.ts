import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const formData = await req.formData()

  const prenom = formData.get('prenom') as string || ''
  const nomRaw = formData.get('nom') as string || ''
  const nom = [prenom, nomRaw].filter(Boolean).join(' ')
  const societe = formData.get('societe') as string || ''
  const email = formData.get('email') as string
  const tel = formData.get('tel') as string
  const adresse = formData.get('adresse') as string
  const description = formData.get('description') as string
  const message = formData.get('message') as string
  const type = formData.get('type') as string
  const files = formData.getAll('files') as File[]

  const isSimple = type === 'simple'
  const supabase = createClient()

  // Upload des fichiers sur Supabase Storage
  const fileLinks: { name: string; url: string }[] = []
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
      fileLinks.push({ name: file.name, url: publicUrl })
    }
  }

  const filesHtml = fileLinks.length > 0
    ? `<div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Documents joints (${fileLinks.length})</p>
        ${fileLinks.map(f => `<p style="margin: 4px 0;"><a href="${f.url}" style="color: #c29a6b;">${f.name}</a></p>`).join('')}
      </div>`
    : ''

  try {
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: 'contact@closia.net',
      subject: `${isSimple ? '📋 Analyse simple — 590€' : '📋 Devis analyse complexe'} — ${nom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0b1220; color: #ffffff; border-radius: 12px;">
          <h2 style="color: #c29a6b;">${isSimple ? '📋 Nouvelle demande d\'analyse simple (590€)' : '📋 Nouvelle demande de devis — analyse complexe'}</h2>
          <div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #fff; margin: 0 0 4px;"><strong>Nom :</strong> ${nom}</p>
            ${societe ? `<p style="color: #fff; margin: 0 0 4px;"><strong>Société :</strong> ${societe}</p>` : ''}
            <p style="color: #fff; margin: 0 0 4px;"><strong>Email :</strong> ${email}</p>
            <p style="color: #fff; margin: 0;"><strong>Tél :</strong> ${tel}</p>
          </div>
          <div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #fff; margin: 0 0 8px;"><strong>Adresse :</strong> ${adresse}</p>
            <p style="color: #d1d5db; margin: 0; line-height: 1.6;">${description}</p>
          </div>
          ${message ? `<div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;"><p style="color: #d1d5db; margin: 0;">${message}</p></div>` : ''}
          ${filesHtml}
          <p style="color: #6b7280; font-size: 12px;">Répondre à : ${email}</p>
        </div>
      `,
    })

    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: email,
      subject: isSimple ? '📋 Votre demande d\'analyse a bien été reçue — Closia' : '📋 Votre demande de devis a bien été reçue — Closia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #ffffff; padding: 40px; border-radius: 12px;">
          <img src="https://closia.net/logo.png" alt="Closia" style="height: 48px; margin-bottom: 32px;" />
          <h2 style="color: #c29a6b;">Votre demande a bien été reçue</h2>
          <p style="color: #9ca3af;">Bonjour ${nom},</p>
          <p style="color: #d1d5db;">
            ${isSimple
              ? 'Nous avons bien reçu votre demande d\'analyse. Nous vous contacterons <strong>sous 24h</strong> pour finaliser le paiement et démarrer l\'analyse (rapport sous 48h).'
              : 'Nous avons bien reçu votre demande de devis. Nous vous adresserons une proposition personnalisée <strong>sous 24h</strong>.'}
          </p>
          <div style="background: #111720; border: 1px solid rgba(194,154,107,0.3); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #c29a6b; font-size: 12px; margin: 0 0 4px; text-transform: uppercase;">Bien concerné</p>
            <p style="color: #ffffff; margin: 0;">${adresse}</p>
          </div>
          <div style="background: rgba(194,154,107,0.05); border: 1px solid rgba(194,154,107,0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #c29a6b; margin: 0;">🔒 Tous les éléments que vous nous avez transmis sont strictement confidentiels et ne seront jamais communiqués à un tiers.</p>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            Closia · contact@closia.net · 06 87 76 33 40<br/>
            <a href="https://closia.net" style="color: #c29a6b;">closia.net</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

