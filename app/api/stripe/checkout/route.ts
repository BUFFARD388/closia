import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

function getPrix(prixBien: number, mode: 'exclusif' | 'partage', nbAcheteurs: number) {
  let grille
  if (prixBien < 300000) grille = { exclu: 490, deux: 290, trois: 190 }
  else if (prixBien <= 1000000) grille = { exclu: 890, deux: 490, trois: 320 }
  else grille = { exclu: 1490, deux: 790, trois: 520 }

  if (mode === 'exclusif') return grille.exclu
  if (nbAcheteurs <= 1) return grille.exclu
  if (nbAcheteurs === 2) return grille.deux
  return grille.trois
}

export async function POST(req: NextRequest) {
  try {
    const { bienId, bienType, bienVille, prixBien, mode, nbAcheteurs, achatId } = await req.json()

    const montant = getPrix(prixBien, mode, nbAcheteurs)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Lead ${mode === 'exclusif' ? 'Exclusif' : 'Partagé'} — ${bienType}`,
              description: `${bienVille} · Accès aux coordonnées du vendeur`,
            },
            unit_amount: montant * 100, // en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        bienId,
        achatId,
        mode,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/acheteur?payment=success&achatId=${achatId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/acheteur?payment=cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

