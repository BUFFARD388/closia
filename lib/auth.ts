import { supabase } from './supabase'

// ── Types ──────────────────────────────────────────────────
export type UserRole = 'vendeur' | 'acheteur' | 'admin'

export interface SignUpData {
  email: string
  password: string
  prenom: string
  nom: string
  tel?: string
  role: UserRole
  societe?: string
  societe_vendeur?: string
  siret?: string
  profil_type?: string
  statut_pro?: string
  zones?: string
}

// ── INSCRIPTION ────────────────────────────────────────────
export async function signUp(data: SignUpData) {
  const { email, password, role, prenom, nom, ...rest } = data

  // 1. Créer le compte auth Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, prenom, nom }, // transmis au trigger handle_new_user
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Création du compte échouée')

  // 2. Compléter le profil avec les infos supplémentaires
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ tel: rest.tel, societe: rest.societe, societe_vendeur: rest.societe_vendeur, siret: rest.siret, profil_type: rest.profil_type, statut_pro: rest.statut_pro, zones: rest.zones })
    .eq('id', authData.user.id)

  if (profileError) console.warn('Profil partiel :', profileError.message)

  return authData
}

// ── CONNEXION ──────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── DÉCONNEXION ────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── UTILISATEUR COURANT ────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

// ── RÉINITIALISATION MOT DE PASSE ─────────────────────────
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })
  if (error) throw error
}

