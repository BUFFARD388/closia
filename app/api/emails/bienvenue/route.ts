import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, prenom, role } = await req.json()

  const isVendeur = role === 'vendeur'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #ffffff; padding: 40px; border-radius: 12px;">
      <img src="https://closia.net/logo.png" alt="Closia" style="height: 48px; margin-bottom: 32px;" />

      <h2 style="color: #c29a6b; margin-bottom: 8px;">Bienvenue sur Closia, ${prenom} !</h2>

      <p style="color: #d1d5db; margin-bottom: 24px;">
        Votre compte ${isVendeur ? 'apporteur' : 'acheteur professionnel'} a bien été créé.
        Vous accédez maintenant à la plateforme off-market des professionnels de l'immobilier.
      </p>

      <div style="background: #111720; border: 1px solid rgba(194,154,107,0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #c29a6b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">
          ${isVendeur ? 'Ce que vous pouvez faire' : 'Vos avantages'}
        </p>
        ${isVendeur ? `
          <div style="space-y: 8px;">
            <p style="color: #d1d5db; margin: 0 0 8px;">✦ Soumettez vos biens off-market en quelques minutes</p>
            <p style="color: #d1d5db; margin: 0 0 8px;">✦ Analyse garantie sous 48h par notre équipe</p>
            <p style="color: #d1d5db; margin: 0;">✦ Diffusion immédiate aux acheteurs professionnels dès validation</p>
          </div>
        ` : `
          <div style="space-y: 8px;">
            <p style="color: #d1d5db; margin: 0 0 8px;">✦ Accédez aux biens off-market exclusifs</p>
            <p style="color: #d1d5db; margin: 0 0 8px;">✦ Achetez en exclusivité ou en lead partagé</p>
            <p style="color: #d1d5db; margin: 0;">✦ Coordonnées apporteur débloquées après achat</p>
          </div>
        `}
      </div>

      <a href="https://closia.net/${isVendeur ? 'dashboard/vendeur' : 'dashboard/acheteur'}"
        style="display: inline-block; background: #c29a6b; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        Accéder à mon espace
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
      subject: `Bienvenue sur Closia, ${prenom} !`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
