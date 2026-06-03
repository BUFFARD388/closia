import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { nom, email, tel, adresse, description, message, type } = await req.json()

  const isSimple = type === 'simple'

  try {
    // Email à Laurent (contact@closia.net)
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: 'contact@closia.net',
      subject: `${isSimple ? '📋 Demande d\'analyse simple — 150€' : '📋 Demande de devis analyse complexe'} — ${nom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0b1220; color: #ffffff; border-radius: 12px;">
          <h2 style="color: #c29a6b; margin-bottom: 4px;">
            ${isSimple ? '📋 Nouvelle demande d\'analyse simple (150€)' : '📋 Nouvelle demande de devis — analyse complexe'}
          </h2>

          <div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Contact</p>
            <p style="color: #fff; margin: 0 0 4px;"><strong>Nom :</strong> ${nom}</p>
            <p style="color: #fff; margin: 0 0 4px;"><strong>Email :</strong> ${email}</p>
            <p style="color: #fff; margin: 0;"><strong>Tél :</strong> ${tel}</p>
          </div>

          <div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Le bien</p>
            <p style="color: #fff; margin: 0 0 8px;"><strong>Adresse :</strong> ${adresse}</p>
            <p style="color: #d1d5db; margin: 0; font-size: 14px; line-height: 1.6;">${description}</p>
          </div>

          ${message ? `
          <div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Précisions</p>
            <p style="color: #d1d5db; margin: 0; font-size: 14px; line-height: 1.6;">${message}</p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 12px;">Répondre à : ${email}</p>
        </div>
      `,
    })

    // Email de confirmation au demandeur
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: email,
      subject: isSimple ? '📋 Votre demande d\'analyse a bien été reçue — Closia' : '📋 Votre demande de devis a bien été reçue — Closia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #ffffff; padding: 40px; border-radius: 12px;">
          <img src="https://closia.net/logo.png" alt="Closia" style="height: 48px; margin-bottom: 32px;" />

          <h2 style="color: #c29a6b; margin-bottom: 8px;">Votre demande a bien été reçue</h2>
          <p style="color: #9ca3af; margin-bottom: 24px;">Bonjour ${nom},</p>

          <p style="color: #d1d5db; margin-bottom: 16px;">
            ${isSimple
              ? 'Nous avons bien reçu votre demande d\'analyse simple. Nous vous contacterons <strong>sous 24h</strong> pour finaliser les modalités et vous transmettre notre analyse sous 48h.'
              : 'Nous avons bien reçu votre demande de devis. Nous vous adresserons une proposition personnalisée <strong>sous 24h</strong>.'}
          </p>

          <div style="background: #111720; border: 1px solid rgba(194,154,107,0.3); border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #c29a6b; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Bien concerné</p>
            <p style="color: #ffffff; margin: 0;">${adresse}</p>
          </div>

          <div style="background: rgba(194,154,107,0.05); border: 1px solid rgba(194,154,107,0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #c29a6b; font-size: 13px; margin: 0;">🔒 Tous les éléments que vous nous avez transmis sont strictement confidentiels et ne seront jamais communiqués à un tiers.</p>
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
