import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { buildDossierBienHtml } from '@/lib/dossierBienTemplate'
import { htmlToPdfBuffer } from '@/lib/generatePdf'

export const runtime = 'nodejs'
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const {
    email, prenom, type, ville, decision, message,
    // Champs additionnels transmis lors d'une validation, pour générer le PDF du dossier
    dossierHtml, adresse, cp, prix, surface, createdAt, statut, description, apporteurNom, photoUrl,
  } = await req.json()

  const isValidated = decision === 'validate'

  const subject = isValidated
    ? `✅ Votre bien a été validé et est en diffusion — Closia`
    : `❌ Votre bien n'a pas été retenu — Closia`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1220; color: #ffffff; padding: 40px; border-radius: 12px;">
      <img src="https://closia.net/logo.png" alt="Closia" style="height: 48px; margin-bottom: 32px;" />

      <h2 style="color: ${isValidated ? '#c29a6b' : '#f87171'}; margin-bottom: 8px;">
        ${isValidated ? '✅ Votre bien est en diffusion !' : '❌ Votre bien n\'a pas été retenu'}
      </h2>

      <p style="color: #9ca3af; margin-bottom: 24px;">Bonjour ${prenom},</p>

      <div style="background: #111720; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px;">Bien concerné</p>
        <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin: 0;">${type} — ${ville}</p>
      </div>

      ${isValidated ? `
        <p style="color: #d1d5db;">Votre dossier a été analysé et validé par notre équipe. Votre bien est maintenant <strong style="color: #c29a6b;">diffusé auprès des acheteurs professionnels</strong> de notre réseau pour une durée de 72h.</p>
        <p style="color: #d1d5db;">Vous serez notifié dès qu'un acheteur se positionne.</p>
        <p style="color: #d1d5db;">Vous trouverez en pièce jointe le dossier de synthèse ayant justifié cette diffusion.</p>
      ` : `
        <p style="color: #d1d5db;">Après analyse, votre dossier n'a pas pu être retenu pour diffusion.</p>
      `}

      ${message ? `
        <div style="background: ${isValidated ? 'rgba(194,154,107,0.1)' : 'rgba(248,113,113,0.1)'}; border-left: 3px solid ${isValidated ? '#c29a6b' : '#f87171'}; padding: 16px; border-radius: 4px; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Message de l'analyste</p>
          <p style="color: #d1d5db; margin: 0; font-style: italic;">${message}</p>
        </div>
      ` : ''}

      <a href="https://closia.net/dashboard/vendeur" style="display: inline-block; background: #c29a6b; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        Voir mon espace
      </a>

      <p style="color: #4b5563; font-size: 12px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
        Closia · La plateforme off-market des professionnels de l'immobilier<br/>
        <a href="https://closia.net" style="color: #c29a6b;">closia.net</a>
      </p>
    </div>
  `

  // Génération best-effort du PDF du dossier — ne doit jamais faire échouer l'envoi
  // du mail ni la validation du bien si elle échoue ou prend trop de temps.
  let attachments: { filename: string; content: Buffer }[] | undefined
  if (isValidated && dossierHtml) {
    try {
      const adresseComplete = `${adresse || ''}, ${cp || ''} ${ville || ''}`.trim()
      const pdfHtml = buildDossierBienHtml({
        logoUrl: 'https://closia.net/logo.png',
        adresseComplete,
        apporteurNom: apporteurNom || prenom || '',
        type: type || null,
        prix: prix || null,
        surface: surface || null,
        createdAt: createdAt || null,
        statut: statut || null,
        description: description || null,
        dossierHtml,
        photoUrl: photoUrl || null,
      })
      const pdfBuffer = await htmlToPdfBuffer(pdfHtml)
      attachments = [{ filename: `dossier-closia-${(ville || 'bien').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, content: pdfBuffer }]
    } catch (err) {
      console.error('Erreur génération PDF dossier (mail envoyé sans pièce jointe):', err)
    }
  }

  try {
    await resend.emails.send({
      from: 'Closia <noreply@closia.net>',
      to: email,
      subject,
      html,
      ...(attachments ? { attachments } : {}),
    })
    return NextResponse.json({ success: true, pdfAttached: !!attachments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
