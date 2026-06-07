import { redirect } from 'next/navigation'

// Cette page dédiée est retirée au profit du flux d'inscription unifié.
// On redirige vers /auth/register avec le rôle pré-sélectionné.
export default function Page() {
  redirect('/auth/register?role=vendeur')
}
