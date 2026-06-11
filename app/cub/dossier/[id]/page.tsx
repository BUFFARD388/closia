import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import CubDossierView from './CubDossierView'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function CubDossierPage({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from('analyses')
    .select('id, nom, email, adresse, cp, ville, parcelle, type_bien, surface, description, rapport, fichiers, statut, created_at')
    .eq('id', params.id)
    .eq('type', 'cub')
    .single()

  if (!data || !data.rapport) notFound()

  return <CubDossierView dossier={data} />
}
