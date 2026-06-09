import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import RapportView from './RapportView'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function RapportPage({ params }: { params: { id: string } }) {
  const { data: analyse } = await supabase
    .from('analyses')
    .select('nom, email, adresse, description, message, type_bien, surface, parcelle, rapport, fichiers, created_at')
    .eq('id', params.id)
    .single()

  if (!analyse || !analyse.rapport) notFound()

  return <RapportView analyse={analyse} />
}
