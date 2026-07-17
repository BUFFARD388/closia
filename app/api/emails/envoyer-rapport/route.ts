import { NextResponse } from 'next/server'
import { sendRapportEmail } from '@/lib/sendRapportEmail'

// Envoi manuel du rapport depuis l'admin ("Envoyer sans paiement — cas particulier").
// La logique d'envoi elle-même vit dans lib/sendRapportEmail.ts, partagée avec le
// webhook Stripe qui l'appelle directement (in-process) après paiement.
export async function POST(req: Request) {
  try {
    const { analyseId, nom, email, adresse, description, rapport, fichiers } = await req.json()
    await sendRapportEmail({ analyseId, nom, email, adresse, description, rapport, fichiers })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
