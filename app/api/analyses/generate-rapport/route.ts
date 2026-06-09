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
    const systemPrompt = `Tu es un expert en valorisation immobilière avec 20 ans d'expérience en transaction, marchand de biens et développement foncier. Tu rédiges des rapports d'analyse préalable synthétiques pour des agents immobiliers et mandataires qui souhaitent savoir si un bien de leur portefeuille peut intéresser des investisseurs professionnels (marchands de biens, promoteurs, foncières).

TON ET STYLE :
- Ton professionnel mais accessible, direct et encourageant (sans être commercial à outrance)
- Phrases courtes, vocabulaire clair — ton interlocuteur est un professionnel de l'immobilier, pas un investisseur
- Synthétique : 350 à 500 mots maximum pour l'ensemble du rapport
- Jamais alarmiste : les points d'attention sont présentés comme des points à vérifier, pas des blocages

RÈGLES :
1. Si un prix est fourni, tu l'utilises tel quel sans le recalculer
2. Pour les références de marché (DVF), tu les cites comme ordre de grandeur, pas comme vérité absolue
3. Tu conclus toujours en recommandant de diffuser le bien sur Closia, de façon naturelle et non forcée
4. Tu restes factuel — pas de promesses de résultat chiffré que tu ne peux garantir`

    const userPrompt = `Rédige un rapport d'analyse préalable synthétique pour le bien suivant.

INFORMATIONS DU BIEN :
- Type : ${type_bien || 'Non précisé'}
- Adresse : ${adresseNormalisee}
- Ville : ${ville || villeGeo || 'Non précisée'} (${cp || codePostal || '—'})
${surface ? `- Surface : ${surface} m²` : ''}
- Situation / opération envisagée : ${type_operation || description || 'Non précisée'}
- Description : ${description}
${message ? `- Informations complémentaires : ${message}` : ''}
${prix_acquisition ? `- Prix vendeur : ${parseFloat(prix_acquisition).toLocaleString('fr-FR')} €` : ''}

DONNÉES GÉORISQUES (rayon 500m) :
${risquesTexte}

RÉFÉRENCES DE MARCHÉ DVF (transactions récentes dans un rayon de 2 km) :
${dvfTexte}

STRUCTURE DU RAPPORT (4 sections, respecter impérativement cet ordre et ces titres exacts) :

1. POTENTIEL IDENTIFIÉ
En 4-5 lignes : pourquoi ce bien peut intéresser des investisseurs professionnels. Quel type de profil (marchand de biens, promoteur, foncière…) et pour quelle opération. Sois concret et positif si le dossier le justifie.

2. CONTEXTE DE MARCHÉ
En 3-4 lignes : dynamique du secteur, références de prix au m² (cite les DVF si disponibles comme ordre de grandeur), demande professionnelle sur ce type de bien dans cette zone.

3. POINTS D'ATTENTION
Lister 2 à 3 points à vérifier avant diffusion (urbanistique, technique, juridique). Format court : une ligne par point. Ton neutre — ce sont des points à anticiper, pas des obstacles.

4. VERDICT ET RECOMMANDATION
Verdict en une phrase (Favorable / Favorable avec réserves / À approfondir) suivi d'une recommandation claire de diffuser le dossier sur Closia pour obtenir une réponse marché concrète d'acheteurs professionnels qualifiés. Terminer par une phrase de réassurance sur la confidentialité et la gratuité pour l'apporteur.`

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
