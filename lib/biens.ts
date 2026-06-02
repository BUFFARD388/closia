import { supabase } from './supabase'

// ── Types ──────────────────────────────────────────────────
export interface BienFormData {
  type: string
  adresse: string
  cp: string
  ville: string
  prix: number
  surface?: number
  situation?: string
  description?: string
  potentiel?: string
  mandat_exclu: boolean
}

export type BienStatut = 'pending' | 'analyse' | 'validated' | 'rejected' | 'diffuse' | 'archive'

// ── SOUMETTRE UN BIEN ──────────────────────────────────────
export async function soumettreUnBien(data: BienFormData, apporteurId: string) {
  const { data: bien, error } = await supabase
    .from('biens')
    .insert({
      ...data,
      apporteur_id: apporteurId,
      statut: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return bien
}

// ── UPLOADER UN DOCUMENT ───────────────────────────────────
export async function uploaderDocument(
  bienId: string,
  file: File,
  type: 'photo' | 'cadastre' | 'diagnostic' | 'plan' | 'titre' | 'autre'
) {
  const ext = file.name.split('.').pop()
  const path = `biens/${bienId}/${type}/${Date.now()}.${ext}`

  // Upload dans Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('closia-documents')
    .upload(path, file)

  if (uploadError) throw uploadError

  // URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('closia-documents')
    .getPublicUrl(path)

  // Enregistrer en base
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      bien_id: bienId,
      nom: file.name,
      url: publicUrl,
      type,
      taille: file.size,
    })
    .select()
    .single()

  if (dbError) throw dbError
  return doc
}

// ── BIENS D'UN VENDEUR ─────────────────────────────────────
export async function getBiensVendeur(apporteurId: string) {
  const { data, error } = await supabase
    .from('biens')
    .select('*, documents(*)')
    .eq('apporteur_id', apporteurId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ── LEADS DISPONIBLES (pour acheteurs) ────────────────────
export async function getLeadsDisponibles(filtres?: {
  type?: string
  cp?: string
  prixMax?: number
}) {
  let query = supabase
    .from('biens')
    .select(`
      id, type, cp, ville, prix, surface,
      date_diffusion, date_expiration,
      achats(id, mode, statut)
    `)
    .eq('statut', 'diffuse')
    .gt('date_expiration', new Date().toISOString())
    .order('date_diffusion', { ascending: false })

  if (filtres?.type && filtres.type !== 'Tous') query = query.eq('type', filtres.type)
  if (filtres?.cp) query = query.ilike('cp', `${filtres.cp}%`)
  if (filtres?.prixMax) query = query.lte('prix', filtres.prixMax)

  const { data, error } = await query
  if (error) throw error

  // Calculer le timer et le nombre d'acheteurs
  return data.map(lead => ({
    ...lead,
    heures_restantes: Math.max(0,
      (new Date(lead.date_expiration).getTime() - Date.now()) / 3600000
    ),
    nb_acheteurs: lead.achats?.filter((a: any) => a.statut === 'confirme').length ?? 0,
    exclu_pris: lead.achats?.some((a: any) => a.mode === 'exclu' && a.statut === 'confirme') ?? false,
  }))
}

// ── DÉTAIL D'UN LEAD (pour admin) ─────────────────────────
export async function getLeadDetail(bienId: string) {
  const { data, error } = await supabase
    .from('biens')
    .select(`
      *,
      documents(*),
      profiles!biens_apporteur_id_fkey(prenom, nom, tel, email:id, statut_pro),
      achats(*, profiles!achats_acheteur_id_fkey(prenom, nom, societe, profil_type))
    `)
    .eq('id', bienId)
    .single()

  if (error) throw error
  return data
}

// ── TOUS LES BIENS (admin) ─────────────────────────────────
export async function getAllBiens(statut?: BienStatut) {
  let query = supabase
    .from('biens')
    .select('*, profiles!biens_apporteur_id_fkey(prenom, nom, statut_pro), achats(id, mode, statut)')
    .order('created_at', { ascending: false })

  if (statut) query = query.eq('statut', statut)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ── VALIDER / REFUSER UN BIEN (admin) ─────────────────────
export async function validerBien(bienId: string, reponse: string) {
  const maintenant = new Date()
  const expiration = new Date(maintenant.getTime() + 72 * 3600 * 1000)

  const { error } = await supabase
    .from('biens')
    .update({
      statut: 'diffuse',
      reponse_admin: reponse,
      date_diffusion: maintenant.toISOString(),
      date_expiration: expiration.toISOString(),
    })
    .eq('id', bienId)

  if (error) throw error
}

export async function refuserBien(bienId: string, reponse: string) {
  const { error } = await supabase
    .from('biens')
    .update({ statut: 'rejected', reponse_admin: reponse })
    .eq('id', bienId)

  if (error) throw error
}
