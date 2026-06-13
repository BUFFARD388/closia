import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

function getPrixPartage(prixBien: number, nbAcheteurs: number): number {
  let grille
  if (prixBien < 300000) grille = { un: 490, deux: 290, trois: 190 }
  else if (prixBien <= 1000000) grille = { un: 890, deux: 490, trois: 320 }
  else grille = { un: 1490, deux: 790, trois: 520 }

  if (nbAcheteurs <= 1) return grille.un
  if (nbAcheteurs === 2) return grille.deux
  return grille.trois
}

export async function POST(req: NextRequest) {
  try {
    // Sécurité basique : vérifier un secret partagé si appelé depuis l'extérieur
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les biens expirés encore en statut 'diffuse'
    const { data: biens, error: biensError } = await supabase
      .from('biens')
      .select('id, type, ville, cp, prix, apporteur_id')
      .eq('statut', 'diffuse')
      .lt('date_expiration', new Date().toISOString())

    if (biensError) throw new Error(biensError.message)
    if (!biens || biens.length === 0) {
      return NextResponse.json({ success: true, traites: 0 })
    }

    let traites = 0

    for (const bien of biens) {
      // Récupérer les acheteurs partagés en attente de paiement
      const { data: achats } = await supabase
        .from('achats')
        .select('id, acheteur_id')
        .eq('bien_id', bien.id)
        .eq('mode', 'partage')
        .eq('statut', 'reserve')

      // Passer le bien en 'cloture'
      await supabase
        .from('biens')
        .update({ statut: 'cloture' })
        .eq('id', bien.id)

      if (!achats || achats.length === 0) {
        // Aucun acheteur partagé → bien sans acquéreur
        await supabase
          .from('biens')
          .update({ statut: 'expire' })
          .eq('id', bien.id)
        traites++
        continue
      }

      const nbAcheteurs = achats.length
      const prixUnitaire = getPrixPartage(bien.prix, nbAcheteurs)

      // Récupérer les emails des acheteurs via auth admin
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const userEmailMap = new Map<string, { email: string; prenom: string }>()
      users.forEach(u => userEmailMap.set(u.id, {
        email: u.email ?? '',
        prenom: (u.user_metadata?.prenom as string) || '',
      }))

      // Récupérer prénoms depuis profiles
      const acheteurIds = achats.map(a => a.acheteur_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, prenom, nom')
        .in('id', acheteurIds)
      const profileMap = new Map((profiles || []).map(p => [p.id, p]))

      // Pour chaque acheteur : générer lien Stripe + envoyer email
      for (const achat of achats) {
        const authUser = userEmailMap.get(achat.acheteur_id)
        const profile = profileMap.get(achat.acheteur_id)
        const email = authUser?.email
        const prenom = profile?.prenom || authUser?.prenom || 'Bonjour'

        if (!email) continue

        // Créer session Stripe
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Lead partagé — ${bien.type}`,
                description: `${bien.cp} – ${bien.ville} · Accès aux coordonnées du vendeur`,
              },
              unit_amount: prixUnitaire * 100,
            },
            quantity: 1,
          }],
          metadata: {
            bienId: bien.id,
            achatId: achat.id,
            mode: 'partage',
            type: 'lead',
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/acheteur?payment=success&achatId=${achat.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/acheteur?payment=cancel&achatId=${achat.id}`,
        })

        // Envoyer l'email de paiement
        await resend.emails.send({
          from: 'Closia <noreply@closia.net>',
          to: email,
          subject: `Action requise — Finalisez votre lead ${bien.type} · ${bien.ville}`,
          html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
                <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
                <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Votre lead est disponible ✓</p>
                <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">Finalisez votre achat pour accéder aux coordonnées</p>
              </div>
              <div style="padding:36px 48px;">
                <p style="color:#9ca3af;margin:0 0 16px;">Bonjour ${prenom},</p>
                <p style="color:#d1d5db;line-height:1.75;margin:0 0 24px;">
                  La période de diffusion du lead ci-dessous est terminée.
                  <strong style="color:#fff;">${nbAcheteurs} acheteur${nbAcheteurs > 1 ? 's' : ''}</strong> se sont positionnés, le prix final est donc :
                </p>

                <div style="background:#111720;border:1px solid rgba(194,154,107,0.25);border-radius:10px;padding:20px;margin-bottom:24px;">
                  <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;font-weight:700;">Lead</p>
                  <p style="color:#fff;font-size:18px;font-weight:700;margin:0 0 4px;">${bien.type}</p>
                  <p style="color:#9ca3af;margin:0 0 16px;">${bien.cp} – ${bien.ville}</p>
                  <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#9ca3af;font-size:13px;">Votre prix (partagé × ${nbAcheteurs})</span>
                    <span style="color:#c29a6b;font-size:22px;font-weight:700;">${prixUnitaire} €</span>
                  </div>
                </div>

                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${session.url}"
                    style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;">
                    Payer et accéder aux coordonnées
                  </a>
                </div>

                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px 18px;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.7;">
                    ⚠️ Ce lien est personnel et valable <strong style="color:#d1d5db;">7 jours</strong>.
                    Après paiement, vous recevrez immédiatement les coordonnées complètes du vendeur.
                  </p>
                </div>
              </div>
              <div style="padding:20px 48px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
                <p style="color:#6b7280;font-size:11px;margin:0;">Closia · contact@closia.net · 06 87 76 33 40</p>
                <a href="https://closia.net" style="color:#c29a6b;font-size:11px;">closia.net</a>
              </div>
            </div>
          `,
        }).catch(console.warn)
      }

      traites++
    }

    return NextResponse.json({ success: true, traites })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
