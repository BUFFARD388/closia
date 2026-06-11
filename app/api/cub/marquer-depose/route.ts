import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { analyseId } = await req.json()
    if (!analyseId) return NextResponse.json({ error: 'analyseId requis' }, { status: 400 })

    const { error } = await supabase
      .from('analyses')
      .update({ statut: 'livree' })
      .eq('id', analyseId)
      .eq('type', 'cub')

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
