import { supabase } from './supabase'

// ── ACHAT EXCLUSIF ─────────────────────────────────────────
// L'acheteur paie immédiatement 900€ → accès coordonnées instantané
export async function acheterExclusif(bienId: string, acheteurId: string, stripeSessionId: string) {
  // Vérifier qu'aucun exclusif n'existe déjà
  const { data: existing } = await supabase
    .from('achats')
    .select('id')
    .eq('bien_id', bienId)
    .eq('mode', 'exclu')
    .eq('statut', 'confirme')
    .single()

  if (existing) throw new Error('Ce lead a déjà été acheté en exclusivité.')

  const { data, error } = await supabase
    .from('achats')
    .insert({
      bien_id: bienId,
      acheteur_id: acheteurId,
      mode: 'exclu',
      montant_paye: 900,
      montant_final: 900,
      statut: 'confirme',
      stripe_session: stripeSessionId,
      coordonnees_ok: true,           // accès immédiat
    })
    .select()
    .single()

  if (error) throw error

  // Archiver le bien (plus disponible)
  await supabase
    .from('biens')
    .update({ statut: 'archive' })
    .eq('id', bienId)

  return data
}

// ── REJOINDRE LA LISTE D'ATTENTE ───────────────────────────
// Pas de paiement immédiat — paiement demandé à la clôture
export async function rejoindreListeAttente(bienId: string, acheteurId: string) {
  // Vérifier que l'exclusif n'est pas pris
  const { data: exclu } = await supabase
    .from('achats')
    .select('id')
    .eq('bien_id', bienId)
    .eq('mode', 'exclu')
    .eq('statut', 'confirme')
    .single()

  if (exclu) throw new Error('Un acheteur exclusif est déjà positionné sur ce lead.')

  // Compter les inscrits en attente
  const { count } = await supabase
    .from('achats')
    .select('id', { count: 'exact' })
    .eq('bien_id', bienId)
    .eq('mode', 'attente')
    .eq('statut', 'pending')

  if ((count ?? 0) >= 3) throw new Error('La liste d\'attente est complète (3/3).')

  const { data, error } = await supabase
    .from('achats')
    .insert({
      bien_id: bienId,
      acheteur_id: acheteurId,
      mode: 'attente',
      statut: 'pending',
      coordonnees_ok: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── CLÔTURER UN LEAD (appelé après 72h) ───────────────────
// Calcule le prix final pour chaque acheteur en attente
export async function cloturerLead(bienId: string) {
  // Récupérer la liste d'attente
  const { data: attentes } = await supabase
    .from('achats')
    .select('id, acheteur_id')
    .eq('bien_id', bienId)
    .eq('mode', 'attente')
    .eq('statut', 'pending')

  const nb = attentes?.length ?? 0
  const montantFinal = nb === 3 ? 300 : nb === 2 ? 450 : 900

  // Mettre à jour chaque achat avec le montant final
  if (attentes && attentes.length > 0) {
    await supabase
      .from('achats')
      .update({ montant_final: montantFinal, statut: 'pending' })
      .in('id', attentes.map(a => a.id))
  }

  // Archiver le bien
  await supabase
    .from('biens')
    .update({ statut: 'archive' })
    .eq('id', bienId)

  return { nb_acheteurs: nb, montant_final: montantFinal }
}

// ── PAYER LE LEAD LISTE D'ATTENTE ──────────────────────────
// Appelé quand l'acheteur paie après réception de l'email de clôture
export async function payerListeAttente(achatId: string, stripeSessionId: string) {
  const { data, error } = await supabase
    .from('achats')
    .update({
      statut: 'confirme',
      stripe_session: stripeSessionId,
      coordonnees_ok: true,
    })
    .eq('id', achatId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── ACHATS D'UN ACHETEUR ───────────────────────────────────
export async function getAchatsAcheteur(acheteurId: string) {
  const { data, error } = await supabase
    .from('achats')
    .select(`
      *,
      biens(type, adresse, cp, ville, prix,
        profiles!biens_apporteur_id_fkey(prenom, nom, tel, statut_pro)
      )
    `)
    .eq('acheteur_id', acheteurId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ── STATISTIQUES ADMIN ─────────────────────────────────────
export async function getStatsAdmin() {
  const [biens, achats] = await Promise.all([
    supabase.from('biens').select('statut'),
    supabase.from('achats').select('mode, montant_final, statut'),
  ])

  const revenus = achats.data
    ?.filter(a => a.statut === 'confirme')
    .reduce((sum, a) => sum + (a.montant_final ?? 0), 0) ?? 0

  return {
    total_biens: biens.data?.length ?? 0,
    en_attente: biens.data?.filter(b => b.statut === 'pending').length ?? 0,
    diffuses: biens.data?.filter(b => b.statut === 'diffuse').length ?? 0,
    revenus_total: revenus,
  }
}
