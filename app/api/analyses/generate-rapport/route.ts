import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { adresse, type_bien, cp, ville, parcelle, description, message } = await req.json()

    // 1. Géocodage de l'adresse
    let lat: number | null = null
    let lon: number | null = null
    let ville = ''
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
        ville = f.properties.city || ''
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

    // 4. Construction du prompt et appel Claude
    const systemPrompt = `Tu es un expert en valorisation immobilière avec 20 ans d'expérience en transaction, marchand de biens, développement foncier et analyse PLU. Tu rédiges des rapports d'analyse préalable professionnels, précis et directement exploitables par des acheteurs professionnels (marchands de biens, promoteurs, foncières).

Ton style est expert, factuel et structuré. Tu identifies clairement les potentiels et les risques. Tu proposes plusieurs scénarios de valorisation chiffrés. Tu concludes toujours avec une fourchette de prix recommandée et le profil acheteur idéal.

Quand des données sont manquantes, tu l'indiques clairement avec [À VÉRIFIER] et tu te bases sur les moyennes de marché connues pour ton estimation.`

    const userPrompt = `Génère un rapport d'analyse préalable complet pour le bien suivant.

INFORMATIONS DU BIEN :
- Type : ${type_bien || 'Non précisé'}
- Adresse : ${adresseNormalisee}
- Ville : ${ville || codePostal ? `${ville} (${codePostal})` : 'Non précisée'}
- Code postal : ${cp || codePostal || 'Non précisé'}
${parcelle ? `- Numéro de parcelle cadastrale : ${parcelle}` : ''}
- Description transmise par le demandeur : ${description}
${message ? `- Informations complémentaires : ${message}` : ''}

DONNÉES GÉORISQUES :
${risquesTexte}

TRANSACTIONS DVF COMPARABLES :
${dvfTexte}

STRUCTURE DU RAPPORT À PRODUIRE :

1. SYNTHÈSE EXÉCUTIVE (3-4 lignes + avis synthétique encadré)
2. ANALYSE URBANISTIQUE (zonage probable, CES, hauteurs, points de vigilance)
3. ANALYSE DU MARCHÉ LOCAL (contexte commune, prix au m² références, demande)
4. SCÉNARIOS DE VALORISATION (2 à 4 scénarios avec chiffrage)
5. RISQUES IDENTIFIÉS (tableau avec niveau et impact)
6. RECOMMANDATIONS (actions avant offre, fourchette de prix, profil acheteur idéal)

Utilise des données réalistes basées sur le marché local. Indique [À VÉRIFIER] pour les éléments nécessitant une confirmation terrain.`

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
