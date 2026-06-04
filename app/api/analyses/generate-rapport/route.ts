import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { adresse, type_bien, cp, ville, parcelle, surface, type_operation, prix_acquisition, frais_notaire, budget_travaux, prix_revente_cible, description, message } = await req.json()

    // 1. Géocodage de l'adresse
    let lat: number | null = null
    let lon: number | null = null
    let villeGeo = ''
    let codePostal = ''
    let adresseNormalisee = adresse

    try {
      const queryGeo = [adresse, cp, ville].filter(Boolean).join(' ')
      const geoRes = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(queryGeo)}&limit=1`
      )
      const geoData = await geoRes.json()
      if (geoData.features?.length > 0) {
        const f = geoData.features[0]
        ;[lon, lat] = f.geometry.coordinates
        villeGeo = f.properties.city || ''
        codePostal = f.properties.postcode || ''
        adresseNormalisee = f.properties.label || adresse
      }
    } catch { /* continue sans geocodage */ }

    // 2. Données de risques Géorisques
    let risquesTexte = 'Données de risques non disponibles.'
    if (lat && lon) {
      try {
        const risquesRes = await fetch(
          `https://georisques.gouv.fr/api/v1/gaspar/risques?rayon=500&page=1&page_size=10&latlon=${lon},${lat}`
        )
        const risquesData = await risquesRes.json()
        if (risquesData.data?.length > 0) {
          const noms = risquesData.data
            .map((r: any) => r.libelle_risque_jo)
            .filter(Boolean)
            .join(', ')
          risquesTexte = noms || 'Aucun risque majeur identifié dans le rayon 500m.'
        } else {
          risquesTexte = 'Aucun risque majeur identifié dans le rayon 500m.'
        }
      } catch { /* continue */ }
    }

    // 3. Données DVF - transactions comparables
    let dvfTexte = 'Données DVF non disponibles pour ce secteur.'
    if (lat && lon) {
      try {
        const dvfRes = await fetch(
          `https://api.priximmobilier.gouv.fr/transactions?lat=${lat}&lon=${lon}&distance=2000&nb=10`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (dvfRes.ok) {
          const dvfData = await dvfRes.json()
          if (dvfData.length > 0) {
            const transactions = dvfData
              .slice(0, 5)
              .map((t: any) =>
                `- ${t.type_local || 'Bien'} · ${t.surface_reelle_bati || t.surface_terrain || '?'} m² · ${Number(t.valeur_fonciere).toLocaleString('fr-FR')} € (${t.date_mutation?.substring(0, 7) || '?'})`
              )
              .join('\n')
            dvfTexte = `Transactions récentes dans un rayon de 2 km :\n${transactions}`
          }
        }
      } catch { /* continue sans DVF */ }
    }

    // 4. Calculs financiers à partir des données fournies
    let financierTexte = ''
    if (prix_acquisition) {
      const acq = parseFloat(prix_acquisition)
      const tauxNotaire = frais_notaire === 'marchand' ? 0.025 : 0.08
      const notaire = Math.round(acq * tauxNotaire)
      const travaux = budget_travaux ? parseFloat(budget_travaux) : null
      const revente = prix_revente_cible ? parseFloat(prix_revente_cible) : null
      const totalInvesti = acq + notaire + (travaux || 0)
      const margeB = revente ? revente - totalInvesti : null
      const margePct = margeB && revente ? ((margeB / revente) * 100).toFixed(1) : null
      const roi = margeB ? ((margeB / totalInvesti) * 100).toFixed(1) : null
      const prixAuM2Acq = surface ? Math.round(acq / parseFloat(surface)) : null
      const prixAuM2Revente = surface && revente ? Math.round(revente / parseFloat(surface)) : null

      financierTexte = `
DONNÉES FINANCIÈRES FOURNIES PAR LE DEMANDEUR (à utiliser telles quelles — ne pas les modifier) :
- Prix d'acquisition : ${acq.toLocaleString('fr-FR')} €
- Frais de notaire (${frais_notaire === 'marchand' ? '2,5% marchand de biens' : '8% standard'}) : ${notaire.toLocaleString('fr-FR')} €
${travaux ? `- Budget travaux (études comprises) : ${travaux.toLocaleString('fr-FR')} €` : '- Budget travaux : Non communiqué [À VÉRIFIER]'}
- **Total investi : ${totalInvesti.toLocaleString('fr-FR')} €**
${revente ? `- Prix de revente cible : ${revente.toLocaleString('fr-FR')} €` : '- Prix de revente cible : Non communiqué'}
${margeB ? `- **Marge brute : ${margeB.toLocaleString('fr-FR')} € (${margePct}% du CA)**` : ''}
${roi ? `- **ROI : ${roi}%**` : ''}
${prixAuM2Acq ? `- Prix d'acquisition au m² : ${prixAuM2Acq.toLocaleString('fr-FR')} €/m²` : ''}
${prixAuM2Revente ? `- Prix de revente au m² : ${prixAuM2Revente.toLocaleString('fr-FR')} €/m²` : ''}
`
    }

    // 5. Construction du prompt et appel Claude
    const systemPrompt = `Tu es un expert en valorisation immobilière avec 20 ans d'expérience en transaction, marchand de biens, développement foncier et analyse PLU. Tu rédiges des rapports d'analyse préalable professionnels pour des acheteurs professionnels (marchands de biens, promoteurs, foncières).

RÈGLES ABSOLUES :
1. Si des données financières sont fournies (prix acquisition, travaux, revente), tu les utilises EXACTEMENT telles quelles sans les modifier ni les recalculer différemment. Tu présentes le tableau financier en section 4 avec ces chiffres précis.
2. Tu ne génères des chiffres financiers de ton propre chef QUE pour les éléments non fournis, en les marquant systématiquement [ESTIMATION] et en précisant ta source ou hypothèse.
3. Pour les marchés de petites villes ou villes moyennes (< 50 000 hab.), tu appliques des prix au m² réalistes et prudents (souvent 800-1800 €/m² pour des logements rénovés en centre-ville de villes moyennes).
4. Tu distingues clairement : données fournies / données issues des API (DVF, géorisques) / estimations.
5. Ton style est factuel, professionnel, sans suroptimisme. Tu identifies les risques réels.`

    const userPrompt = `Génère un rapport d'analyse préalable complet pour le bien suivant.

INFORMATIONS DU BIEN :
- Type : ${type_bien || 'Non précisé'}
- Adresse : ${adresseNormalisee}
- Ville : ${ville || villeGeo || 'Non précisée'} (${cp || codePostal || '—'})
${surface ? `- Surface totale : ${surface} m²` : ''}
${parcelle ? `- Parcelle cadastrale : ${parcelle}` : ''}
- Opération envisagée : ${type_operation || 'Non précisée'}
- Description : ${description}
${message ? `- Précisions : ${message}` : ''}
${financierTexte}
DONNÉES GÉORISQUES :
${risquesTexte}

TRANSACTIONS DVF COMPARABLES (données officielles) :
${dvfTexte}

STRUCTURE DU RAPPORT (respecter impérativement cet ordre et ces titres) :

1. SYNTHÈSE EXÉCUTIVE
Résumé de l'opération en 4-5 lignes. Avis global : favorable / favorable avec réserves / défavorable, et pourquoi en une phrase.

2. ANALYSE URBANISTIQUE
Zonage PLU probable, règles applicables (CES, gabarit, destinations autorisées), points de vigilance pour l'opération envisagée. Indiquer [À VÉRIFIER en mairie] pour tout élément incertain.

3. ANALYSE DU MARCHÉ LOCAL
Contexte socio-économique de la commune, dynamique du marché, prix au m² constatés (références DVF si disponibles), absorption du marché pour le type de produit envisagé.

4. ANALYSE FINANCIÈRE DE L'OPÉRATION
${prix_acquisition ? `Utiliser EXACTEMENT les chiffres fournis. Présenter : total investi, prix de revente, marge brute, marge en %, ROI. Comparer le prix au m² d'acquisition et de revente aux références de marché.` : `Construire un bilan financier prévisionnel basé sur les données de marché. Marquer chaque hypothèse [ESTIMATION].`}
Identifier les postes de risque budgétaire (travaux, délais, fiscalité marchand de biens).

5. RISQUES ET POINTS DE VIGILANCE
Lister les risques par ordre de criticité : urbanistique, technique, commercial, financier, juridique. Pour chacun : nature du risque + niveau (Faible / Modéré / Élevé) + action recommandée.

6. RECOMMANDATIONS ET VERDICT
- Verdict clair : l'opération est-elle pertinente aux conditions présentées ?
- Prix maximum d'acquisition acceptable si différent du prix demandé
- Actions prioritaires avant signature (due diligence, vérifications)
- Profil acheteur idéal pour cette opération`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rapport = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ rapport })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
