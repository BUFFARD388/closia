import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { type, adresse, cp, ville, prix, surface, situation, potentiel, apporteurPrenom, apporteurNom, bienId } = await req.json()

  const adminEmail = process.env.ADMIN_EMAIL || 'laurentbuffard69250@gmail.com'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #ffffff; padding: 40px; border-radius: 12px;">
      <img src="https://closia.net/logo.png" alt="Closia" style="height: 48px; margin-bottom: 32px;" />

      <h2 style="color: #c29a6b; margin-bottom: 8px;">📥 Nouveau bien soumis</h2>
      <p style="color: #9ca3af; margin-bottom: 24px;">Un apporteur vient de déposer un nouveau dossier — analyse requise sous 48h.</p>

      <div style="background: #111720; border: 1px solid rgba(201,162,39,0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0; width: 40%;">Type</td>
            <td style="color: #ffffff; font-weight: bold; padding: 6px 0;">${type}</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0;">Localisation</td>
            <td style="color: #ffffff; padding: 6px 0;">${adresse}, ${cp} ${ville}</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0;">Prix demandé</td>
            <td style="color: #c29a6b; font-weight: bold; padding: 6px 0;">${Number(prix).toLocaleString('fr-FR')} €</td>
          </tr>
          ${surface ? `<tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0;">Surface</td>
            <td style="color: #ffffff; padding: 6px 0;">${surface} m²</td>
          </tr>` : ''}
          ${situation ? `<tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0;">Situation</td>
            <td style="color: #ffffff; padding: 6px 0;">${situation}</td>
          </tr>` : ''}
          ${potentiel ? `<tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0;">Potentiel</td>
            <td style="color: #ffffff; padding: 6px 0;">${potentiel}</td>
          </tr>` : ''}
          <tr>
            <td style="color: #9ca3af; font-size: 12px; padding: 6px 0;">Apporteur</td>
            <td style="color: #ffffff; padding: 6px 0;">${apporteurPrenom} ${apporteurNom}</td>
          </tr>
        </table>
      </div>

      <a href="https://closia.net/dashboard/admin" style="display: inline-block; background: #c29a6b; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        Analyser le dossier →
      </a>

      <p style="color: #4b5563; font-size: 12px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
        Closia · Espace admin<br/>
        <a href="https://closia.net" style="color: #c29a6b;">closia.net</a>
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: adminEmail,
      subject: `📥 Nouveau bien soumis — ${type} · ${cp} ${ville}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
