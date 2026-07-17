import { NextRequest, NextResponse } from 'next/server'
import { cloturerBien } from '@/lib/cloturerBien'

// Déclenchement manuel depuis l'admin (bouton "Clôturer maintenant" sur un lead expiré
// dans l'onglet "En diffusion") — permet de clôturer immédiatement un bien sans attendre
// le prochain passage du cron quotidien.
export async function POST(req: NextRequest) {
  try {
    const { bienId } = await req.json()
    if (!bienId) return NextResponse.json({ error: 'bienId requis' }, { status: 400 })

    const resultat = await cloturerBien(bienId)
    return NextResponse.json({ success: true, ...resultat })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
