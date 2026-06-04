import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { bienId, type, ville, cp, prix, surface } = await req.json()

    // Récupérer tous les acheteurs avec leurs zones
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, zones, profil_type, prenom, nom')
      .eq('role', 'acheteur')

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Récupérer les emails via auth admin
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

    const userEmailMap = new Map(users.map(u => [u.id, u.email]))

    // Filtrer par zones (ville, département ou zones vides = tous)
    const departement = cp?.substring(0, 2) || ''
    const acheteursCibles = profiles.filter(p => {
      if (!p.zones || p.zones.trim() === '') return true // pas de filtre = reçoit tout
      const zones = p.zones.toLowerCase()
      return (
        zones.includes(ville?.toLowerCase()) ||
        zones.includes(departement) ||
        zones.includes(cp?.toLowerCase())
      )
    })

    let sent = 0
    for (const acheteur of acheteursCibles) {
      const email = userEmailMap.get(acheteur.id)
      if (!email) continue

      const grille = prix < 300000
        ? { exclu: 490, trois: 190 }
        : prix <= 1000000
        ? { exclu: 890, trois: 320 }
        : { exclu: 1490, trois: 520 }

      await resend.emails.send({
        from: 'Closia <noreply@closia.net>',
        to: email,
        subject: `Nouveau lead disponible — ${type} · ${cp} ${ville}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1220;color:#ffffff;padding:40px;border-radius:12px;">
            <img src="https://closia.net/logo.png" alt="Closia" style="height:48px;margin-bottom:32px;" />

            <div style="background:rgba(194,154,107,0.1);border:1px solid rgba(194,154,107,0.3);border-radius:8px;padding:8px 16px;display:inline-block;margin-bottom:24px;">
              <p style="color:#c29a6b;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:2px;">Nouveau lead disponible</p>
            </div>

            <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">
              ${type}
            </h2>
            <p style="color:#9ca3af;font-size:14px;margin:0 0 28px;">
              ${cp} – ${ville}${surface ? ` · ${surface} m²` : ''}
            </p>

            <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:20px;margin-bottom:24px;">
              <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Prix du bien</p>
              <p style="color:#ffffff;font-size:20px;font-weight:bold;margin:0;">${Number(prix).toLocaleString('fr-FR')} €</p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;">
              <div style="background:#111720;border:1px solid rgba(194,154,107,0.3);border-radius:8px;padding:16px;text-align:center;">
                <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Lead exclusif</p>
                <p style="color:#c29a6b;font-size:20px;font-weight:bold;margin:0;">${grille.exclu} €</p>
              </div>
              <div style="background:#111720;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;text-align:center;">
                <p style="color:#9ca3af;font-size:11px;margin:0 0 4px;text-transform:uppercase;">Lead partagé (3)</p>
                <p style="color:#ffffff;font-size:20px;font-weight:bold;margin:0;">${grille.trois} €</p>
              </div>
            </div>

            <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px;margin-bottom:28px;">
              <p style="color:#fca5a5;font-size:13px;margin:0;text-align:center;">
                ⏱ Disponible <strong>72h uniquement</strong> — Accès limité à 3 acheteurs maximum
              </p>
            </div>

            <div style="text-align:center;">
              <a href="https://closia.net/dashboard/acheteur"
                style="display:inline-block;background:#c29a6b;color:#000000;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">
                Voir le lead
              </a>
            </div>

            <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="color:#6b7280;font-size:11px;text-align:center;margin:0;">
                Vous recevez cet email car vous êtes inscrit comme acheteur professionnel sur Closia.<br/>
                <a href="https://closia.net/dashboard/acheteur" style="color:#c29a6b;">Gérer mes préférences</a>
              </p>
            </div>
          </div>
        `,
      })
      sent++
    }

    return NextResponse.json({ success: true, sent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
