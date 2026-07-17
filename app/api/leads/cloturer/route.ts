import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cloturerBien } from '@/lib/cloturerBien'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Vercel Cron invoque les endpoints programmés avec une requête GET (et ajoute
// automatiquement l'en-tête Authorization: Bearer <CRON_SECRET> si la variable
// d'environnement CRON_SECRET est configurée sur le projet). Cette route n'exportait
// jusqu'ici qu'un handler POST : chaque déclenchement quotidien du cron recevait donc
// une 405 Method Not Allowed et repartait sans rien faire — aucun lead partagé n'a
// jamais été clôturé automatiquement. On garde POST pour compatibilité (appel manuel
// éventuel) et on ajoute GET, qui est la méthode réellement utilisée par Vercel Cron.
export async function GET(req: NextRequest) {
  return handleCloture(req)
}

export async function POST(req: NextRequest) {
  return handleCloture(req)
}

async function handleCloture(req: NextRequest) {
  try {
    // Sécurité basique : vérifier un secret partagé si appelé depuis l'extérieur
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les biens expirés encore en statut 'diffuse'
    const { data: biens, error: biensError } = await supabase
      .from('biens')
      .select('id')
      .eq('statut', 'diffuse')
      .lt('date_expiration', new Date().toISOString())

    if (biensError) throw new Error(biensError.message)
    if (!biens || biens.length === 0) {
      return NextResponse.json({ success: true, traites: 0 })
    }

    let traites = 0
    for (const bien of biens) {
      try {
        const resultat = await cloturerBien(bien.id)
        if (resultat.traite) traites++
      } catch (err) {
        console.error('Erreur clôture bien', bien.id, err)
      }
    }

    return NextResponse.json({ success: true, traites })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
