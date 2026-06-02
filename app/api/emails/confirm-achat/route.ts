import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, prenom, type, ville, cp, mode, montant } = await req.json()

  const isExclusif = mode === 'exclusif'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #ffffff; padding: 40px; border-radius: 12px;">
      <img src="https://closia.net/logo.png" alt="Closia" style="height: 48px; margin-bottom: 32px;" />

      <h2 style="color: #c29a6b; margin-bottom: 8px;">✅ Votre achat est confirmé !</h2>

      <p style="color: #9ca3af; margin-bottom: 24px;">Bonjour ${prenom},</p>

      <p style="color: #d1d5db;">Votre achat du lead suivant a bien été enregistré :</p>

      <div style="background: #111720; border: 1px solid rgba(194,154,107,0.3); border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Lead acheté</p>
        <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 8px;">${type}</p>
        <p style="color: #9ca3af; margin: 0;">${cp} – ${ville}</p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 16px; padding-top: 16px; display: flex; justify-content: space-between;">
          <span style="color: #9ca3af; font-size: 14px;">Formule</span>
          <span style="color: ${isExclusif ? '#c29a6b' : '#60a5fa'}; font-weight: bold;">
            ${isExclusif ? '🔒 Exclusif' : '👥 Liste d\'attente'}
          </span>
        </div>
        ${montant ? `
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <span style="color: #9ca3af; font-size: 14px;">Montant</span>
          <span style="color: #ffffff; font-weight: bold;">${montant} €</span>
        </div>
        ` : ''}
      </div>

      ${isExclusif ? `
        <div style="background: rgba(194,154,107,0.1); border: 1px solid rgba(194,154,107,0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #c29a6b; font-weight: bold; margin: 0 0 8px;">🔒 Accès exclusif</p>
          <p style="color: #d1d5db; margin: 0; font-size: 14px;">Les coordonnées complètes de l'apporteur sont disponibles dans votre espace acheteur. Vous êtes le seul acheteur sur ce lead.</p>
        </div>
      ` : `
        <div style="background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #60a5fa; font-weight: bold; margin: 0 0 8px;">⏳ Liste d'attente</p>
          <p style="color: #d1d5db; margin: 0; font-size: 14px;">Votre inscription est confirmée. À la clôture du lead (72h), vous recevrez un email avec le prix final à régler et les coordonnées de l'apporteur.</p>
        </div>
      `}

      <a href="https://closia.net/dashboard/acheteur" style="display: inline-block; background: #c29a6b; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        Voir mon espace
      </a>

      <p style="color: #4b5563; font-size: 12px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
        Closia · La plateforme off-market des professionnels de l'immobilier<br/>
        <a href="https://closia.net" style="color: #c29a6b;">closia.net</a>
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: email,
      subject: `✅ Confirmation d'achat — ${type} à ${ville}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
