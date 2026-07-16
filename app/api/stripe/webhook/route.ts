import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const { type, achatId, bienId, mode, analyseId } = session.metadata!

    // ── Paiement analyse préalable ──
    if (type === 'analyse' && analyseId) {
      // Montant réellement facturé, lu directement sur la session Stripe plutôt que codé
      // en dur — évite un nouveau décalage si le prix de l'analyse change un jour.
      const montantAnalyse = typeof session.amount_total === 'number'
        ? (session.amount_total / 100).toLocaleString('fr-FR')
        : '590'
      // Récupérer les données de la demande
      const { data: analyse } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analyseId)
        .single()

      if (analyse) {
        // Marquer comme payée
        await supabase
          .from('analyses')
          .update({ statut: 'payee' })
          .eq('id', analyseId)

        const fichiers = (analyse.fichiers as { name: string; url: string }[]) || []
        const filesHtml = fichiers.length > 0
          ? `<div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="color:#9ca3af;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Documents joints (${fichiers.length})</p>
              ${fichiers.map(f => `<p style="margin:4px 0;"><a href="${f.url}" style="color:#c29a6b;">${f.name}</a></p>`).join('')}
            </div>`
          : ''

        // Email à l'admin
        await resend.emails.send({
          from: 'Closia <noreply@closia.net>',
          to: 'contact@closia.net',
          subject: `✅ Analyse simple payée — ${analyse.nom}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0b1220;color:#fff;border-radius:12px;">
              <h2 style="color:#c29a6b;">✅ Paiement reçu — Analyse simple (${montantAnalyse}€)</h2>
              <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin:24px 0;">
                <p style="color:#fff;margin:0 0 4px;"><strong>Nom :</strong> ${analyse.nom}</p>
                <p style="color:#fff;margin:0 0 4px;"><strong>Email :</strong> ${analyse.email}</p>
                <p style="color:#fff;margin:0;"><strong>Tél :</strong> ${analyse.tel}</p>
              </div>
              <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="color:#fff;margin:0 0 8px;"><strong>Adresse :</strong> ${analyse.adresse}</p>
                <p style="color:#d1d5db;margin:0;line-height:1.6;">${analyse.description}</p>
              </div>
              ${analyse.message ? `<div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:24px;"><p style="color:#d1d5db;margin:0;">${analyse.message}</p></div>` : ''}
              ${filesHtml}
              <p style="color:#6b7280;font-size:12px;">Répondre à : ${analyse.email}</p>
            </div>
          `,
        })

        // Email de confirmation au client
        await resend.emails.send({
          from: 'Closia <noreply@closia.net>',
          to: analyse.email,
          subject: '✅ Paiement reçu — Votre analyse démarre — Closia',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;padding:40px;border-radius:12px;">
              <img src="https://closia.net/logo.png" alt="Closia" style="height:48px;margin-bottom:32px;" />
              <h2 style="color:#c29a6b;">Paiement reçu — Votre analyse est lancée</h2>
              <p style="color:#9ca3af;">Bonjour ${analyse.nom},</p>
              <p style="color:#d1d5db;">Votre paiement de <strong>${montantAnalyse}€</strong> a bien été reçu. Votre rapport d'analyse expert vous sera remis <strong>sous 72h</strong> à cette adresse email.</p>
              <div style="background:#111720;border:1px solid rgba(194,154,107,0.3);border-radius:8px;padding:16px;margin:24px 0;">
                <p style="color:#c29a6b;font-size:12px;margin:0 0 4px;text-transform:uppercase;">Bien concerné</p>
                <p style="color:#fff;margin:0;">${analyse.adresse}</p>
              </div>
              <div style="background:rgba(194,154,107,0.05);border:1px solid rgba(194,154,107,0.2);border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="color:#c29a6b;margin:0;">🔒 Tous les éléments transmis sont strictement confidentiels et ne seront jamais communiqués à un tiers.</p>
              </div>
              <p style="color:#6b7280;font-size:12px;margin-top:40px;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
                Closia · contact@closia.net · 06 87 76 33 40<br/>
                <a href="https://closia.net" style="color:#c29a6b;">closia.net</a>
              </p>
            </div>
          `,
        })
      }

      return NextResponse.json({ received: true })
    }

    // ── Paiement lead ──
    if (achatId) {
      await supabase.from('achats').update({ statut: 'confirme' }).eq('id', achatId)

      if (mode === 'exclusif') {
        // Récupérer les acheteurs partagés avant de les annuler (pour les notifier)
        const { data: partagesAnnules } = await supabase
          .from('achats')
          .select('id, acheteur_id')
          .eq('bien_id', bienId)
          .eq('mode', 'partage')
          .eq('statut', 'reserve')
          .neq('id', achatId)

        // Annuler les réservations partagées
        await supabase
          .from('achats')
          .update({ statut: 'annule' })
          .eq('bien_id', bienId)
          .eq('mode', 'partage')
          .eq('statut', 'reserve')
          .neq('id', achatId)

        await supabase.from('biens').update({ statut: 'archive' }).eq('id', bienId)

        // Notifier les acheteurs partagés annulés
        if (partagesAnnules && partagesAnnules.length > 0) {
          const { data: listDataExclu } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const usersExclu = (listDataExclu?.users ?? []) as any[]
          const bienInfo = await supabase.from('biens').select('type, ville, cp').eq('id', bienId).single()
          const b = bienInfo.data

          for (const a of partagesAnnules) {
            const u = usersExclu.find((x: any) => x.id === a.acheteur_id)
            if (!u?.email) continue
            const { data: p } = await supabase.from('profiles').select('prenom').eq('id', a.acheteur_id).single()
            await resend.emails.send({
              from: 'Closia <noreply@closia.net>',
              to: u.email,
              subject: `Votre réservation a été annulée — ${b?.type} · ${b?.ville}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;padding:40px;border-radius:12px;">
                  <img src="https://closia.net/logo.png" alt="Closia" style="height:40px;margin-bottom:24px;display:block;" />
                  <h2 style="color:#f87171;margin:0 0 16px;">Réservation annulée — Accès exclusif pris</h2>
                  <p style="color:#9ca3af;">Bonjour ${p?.prenom || ''},</p>
                  <p style="color:#d1d5db;line-height:1.75;">Un acheteur vient d'acquérir ce lead en <strong style="color:#c29a6b;">exclusivité</strong>. Conformément aux conditions d'utilisation, votre réservation partagée est annulée <strong>sans aucun frais</strong>.</p>
                  <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin:24px 0;">
                    <p style="margin:0;"><strong>${b?.type}</strong> · ${b?.cp} ${b?.ville}</p>
                  </div>
                  <p style="color:#9ca3af;font-size:13px;">D'autres leads sont disponibles sur votre dashboard.</p>
                  <div style="text-align:center;margin-top:24px;">
                    <a href="https://closia.net/dashboard/acheteur" style="display:inline-block;background:#c29a6b;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;">Voir les leads disponibles</a>
                  </div>
                  <p style="color:#6b7280;font-size:11px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;text-align:center;">Closia · contact@closia.net</p>
                </div>
              `,
            }).catch(console.warn)
          }
        }
      }

      // Récupérer les infos du bien et de l'apporteur pour envoyer les coordonnées
      const { data: bien } = await supabase
        .from('biens')
        .select('*, profiles!biens_apporteur_id_fkey(prenom, nom, tel, email, societe, statut_pro)')
        .eq('id', bienId)
        .single()

      // Récupérer l'email de l'acheteur
      const { data: achat } = await supabase
        .from('achats')
        .select('acheteur_id')
        .eq('id', achatId)
        .single()

      if (bien && achat) {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        const users = (listData?.users ?? []) as any[]
        const acheteurUser = users.find((u: any) => u.id === achat.acheteur_id)
        const acheteurEmail = acheteurUser?.email

        const { data: acheteurProfile } = await supabase
          .from('profiles')
          .select('prenom, nom')
          .eq('id', achat.acheteur_id)
          .single()

        const vendeur = bien.profiles
        const prenom = acheteurProfile?.prenom || 'Bonjour'

        // Email à l'acheteur avec les coordonnées du vendeur
        if (acheteurEmail) {
          await resend.emails.send({
            from: 'Closia <noreply@closia.net>',
            to: acheteurEmail,
            subject: `Coordonnées du vendeur — ${bien.type} · ${bien.ville}`,
            html: `
              <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;border-radius:12px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 100%);padding:40px 48px 32px;border-bottom:1px solid rgba(194,154,107,0.3);">
                  <img src="https://closia.net/logo.png" alt="Closia" style="height:44px;margin-bottom:24px;display:block;" />
                  <p style="font-size:18px;font-weight:600;color:#fff;margin:0 0 6px;">Paiement confirmé — Voici les coordonnées ✓</p>
                  <p style="font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;margin:0;">${bien.type} · ${bien.cp} ${bien.ville}</p>
                </div>
                <div style="padding:36px 48px;">
                  <p style="color:#9ca3af;margin:0 0 16px;">Bonjour ${prenom},</p>
                  <p style="color:#d1d5db;line-height:1.75;margin:0 0 24px;">Votre paiement a bien été reçu. Voici les coordonnées complètes de l'apporteur du dossier.</p>

                  <div style="background:#111720;border:1px solid rgba(194,154,107,0.3);border-radius:10px;padding:20px;margin-bottom:24px;">
                    <p style="color:#c29a6b;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;font-weight:700;">Coordonnées du vendeur</p>
                    <p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 4px;">${vendeur?.prenom} ${vendeur?.nom}</p>
                    ${vendeur?.societe ? `<p style="color:#9ca3af;margin:0 0 4px;">${vendeur.societe}</p>` : ''}
                    ${vendeur?.statut_pro ? `<p style="color:#9ca3af;font-size:12px;margin:0 0 12px;">${vendeur.statut_pro}</p>` : ''}
                    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;margin-top:8px;">
                      <p style="margin:0 0 6px;"><a href="mailto:${vendeur?.email}" style="color:#c29a6b;">✉️ ${vendeur?.email}</a></p>
                      <p style="margin:0;"><a href="tel:${vendeur?.tel}" style="color:#c29a6b;">📞 ${vendeur?.tel}</a></p>
                    </div>
                  </div>

                  <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px 20px;">
                    <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Le bien</p>
                    <p style="color:#fff;font-weight:600;margin:0 0 4px;">${bien.type}</p>
                    <p style="color:#9ca3af;font-size:13px;margin:0;">${bien.adresse ? bien.adresse + ' · ' : ''}${bien.cp} ${bien.ville}</p>
                    ${bien.prix ? `<p style="color:#c29a6b;font-weight:700;margin:8px 0 0;">${Number(bien.prix).toLocaleString('fr-FR')} €</p>` : ''}
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

        // Notifier le vendeur (apporteur)
        if (vendeur?.email) {
          await resend.emails.send({
            from: 'Closia <noreply@closia.net>',
            to: vendeur.email,
            subject: `Un acheteur a acheté votre lead — ${bien.type} · ${bien.ville}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0b1220;color:#fff;border-radius:12px;">
                <img src="https://closia.net/logo.png" alt="Closia" style="height:40px;margin-bottom:24px;display:block;" />
                <h2 style="color:#c29a6b;margin:0 0 16px;">Un acheteur s'est positionné sur votre dossier ✓</h2>
                <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-bottom:16px;">
                  <p style="margin:0 0 4px;"><strong>Bien :</strong> ${bien.type} · ${bien.cp} ${bien.ville}</p>
                  <p style="margin:0;"><strong>Mode :</strong> ${mode === 'exclusif' ? 'Exclusif' : 'Partagé'}</p>
                </div>
                <p style="color:#9ca3af;font-size:13px;">Un acheteur professionnel a réglé l'accès à vos coordonnées et va vous contacter directement.</p>
              </div>
            `,
          }).catch(console.warn)
        }

        // Si lead partagé : vérifier les autres acheteurs encore en attente
        if (mode === 'partage') {
          const { data: achatRestants } = await supabase
            .from('achats')
            .select('id, acheteur_id')
            .eq('bien_id', bienId)
            .eq('mode', 'partage')
            .eq('statut', 'reserve')

          if (!achatRestants || achatRestants.length === 0) {
            await supabase.from('biens').update({ statut: 'archive' }).eq('id', bienId)
          } else {
            // Notifier les acheteurs partagés encore en attente
            const { data: listDataP } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            const usersP = (listDataP?.users ?? []) as any[]
            const bienP = await supabase.from('biens').select('type, ville, cp').eq('id', bienId).single()
            const bp = bienP.data
            const confirmes = await supabase.from('achats').select('id').eq('bien_id', bienId).eq('mode', 'partage').eq('statut', 'confirme')
            const nbConfirmes = confirmes.data?.length ?? 0

            for (const a of achatRestants) {
              const u = usersP.find((x: any) => x.id === a.acheteur_id)
              if (!u?.email) continue
              const { data: pp } = await supabase.from('profiles').select('prenom').eq('id', a.acheteur_id).single()
              await resend.emails.send({
                from: 'Closia <noreply@closia.net>',
                to: u.email,
                subject: `Un acheteur a finalisé son paiement — ${bp?.type} · ${bp?.ville}`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#fff;padding:40px;border-radius:12px;">
                    <img src="https://closia.net/logo.png" alt="Closia" style="height:40px;margin-bottom:24px;display:block;" />
                    <h2 style="color:#c29a6b;margin:0 0 16px;">Un acheteur a confirmé son paiement</h2>
                    <p style="color:#9ca3af;">Bonjour ${pp?.prenom || ''},</p>
                    <p style="color:#d1d5db;line-height:1.75;">Un des acheteurs partagés vient de finaliser son paiement sur ce lead. <strong style="color:#fff;">${nbConfirmes} acheteur${nbConfirmes > 1 ? 's' : ''} ont confirmé</strong> leur achat.</p>
                    <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin:24px 0;">
                      <p style="margin:0;"><strong>${bp?.type}</strong> · ${bp?.cp} ${bp?.ville}</p>
                    </div>
                    <p style="color:#d1d5db;">Votre lien de paiement est disponible dans votre email de clôture. Pensez à finaliser votre achat pour accéder aux coordonnées du vendeur.</p>
                    <p style="color:#6b7280;font-size:11px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;text-align:center;">Closia · contact@closia.net</p>
                  </div>
                `,
              }).catch(console.warn)
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

