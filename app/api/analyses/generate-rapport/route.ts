import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { adresse, type_bien, cp, ville, parcelle, surface, type_operation, prix_acquisition, description, message } = await req.json()

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

    // 2. Données PLU via Géoportail Urbanisme (apicarto.ign.fr)
    let pluTexte = 'Données PLU non disponibles pour cette commune.'
    if (lat && lon) {
      try {
        const geom = encodeURIComponent(JSON.stringify({ type: 'Point', coordinates: [lon, lat] }))
        const pluRes = await fetch(
          `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (pluRes.ok) {
          const pluData = await pluRes.json()
          if (pluData.features?.length > 0) {
            const props = pluData.features[0].properties
            const zone = props.libelle || '?'
            const typeZone = (props.typezone || '').toUpperCase()
            const libelong = props.libelong || ''
            const partition = props.partition || ''

            const categories: Record<string, string> = {
              U: 'Zone urbaine (constructible)',
              AU: 'Zone à urbaniser',
              A: 'Zone agricole (constructibilité limitée)',
              N: 'Zone naturelle et forestière (constructibilité très limitée)',
            }
            const prefix = typeZone.startsWith('AU') ? 'AU'
              : typeZone.startsWith('U') ? 'U'
              : typeZone.startsWith('A') ? 'A'
              : typeZone.startsWith('N') ? 'N'
              : typeZone
            const categorie = categories[prefix] || `Zone ${typeZone}`

            pluTexte = `Zone PLU : ${zone} — ${categorie}${libelong ? ` ("${libelong}")` : ''}${partition ? ` · Document de référence : ${partition}` : ''}`

            try {
              const prescRes = await fetch(
                `https://apicarto.ign.fr/api/gpu/prescription-surf?geom=${geom}`,
                { signal: AbortSignal.timeout(5000) }
              )
              if (prescRes.ok) {
                const prescData = await prescRes.json()
                if (prescData.features?.length > 0) {
                  const prescriptions = prescData.features
                    .map((f: any) => f.properties.libelle || f.properties.txt || '')
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(' · ')
                  if (prescriptions) {
                    pluTexte += ` | Prescriptions détectées : ${prescriptions}`
                  }
                }
              }
            } catch { /* continue sans prescriptions */ }
          } else {
            pluTexte = "Bien non couvert par un PLU numérisé sur le Géoportail Urbanisme (commune en POS, carte communale ou règlement national d'urbanisme). Vérification en mairie recommandée."
          }
        }
      } catch (e: any) {
        pluTexte = `Données PLU non disponibles (erreur : ${e?.message || 'inconnue'}).`
      }
    }

    // 3. Risques Géorisques
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

    // 4. Données DVF - transactions comparables (rayon progressif : 2 → 5 → 10 → 20 km)
    let dvfTexte = 'Données DVF non disponibles pour ce secteur.'
    if (lat && lon) {
      for (const distance of [2000, 5000, 10000, 20000]) {
        try {
          const dvfRes = await fetch(
            `https://api.priximmobilier.gouv.fr/transactions?lat=${lat}&lon=${lon}&distance=${distance}&nb=10`,
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
              dvfTexte = `Transactions récentes (rayon ${distance / 1000} km) :\n${transactions}`
              break
            }
          }
        } catch { /* continuer avec rayon supérieur */ }
      }
    }

    // 5. Castorus — annonces actuelles + résumé marché local
    let catorusTexte = ''
    const communeVille = villeGeo || ville || ''
    const communeCP = codePostal || cp || ''
    if (communeVille && communeCP) {
      try {
        const slugVille = communeVille
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        }

        const [ventesRes, rechercheRes] = await Promise.allSettled([
          fetch(`https://www.castorus.com/ventes-immobilieres/${slugVille}-${communeCP}`, { headers, signal: AbortSignal.timeout(7000) }),
          fetch(`https://www.castorus.com/recherche/${slugVille}-${communeCP}`, { headers, signal: AbortSignal.timeout(7000) }),
        ])

        const lignes: string[] = []

        if (ventesRes.status === 'fulfilled' && ventesRes.value.ok) {
          const plain = (await ventesRes.value.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          const m = plain.match(/(\d+)\s*ventes.*?Prix moyen\s*:\s*([\d \s]+)\s*€.*?([\d \s]+)\s*€\s*\/\s*m/i)
          if (m) {
            const nbV = m[1]
            const prixMoy = m[2].replace(/ |\s/g, ' ').trim()
            const pm2 = m[3].replace(/ |\s/g, ' ').trim()
            lignes.push(`Résumé des ventes passées (commune) : ${nbV} transactions · Prix moyen ${prixMoy} € · ${pm2} €/m²`)
          }
        }

        if (rechercheRes.status === 'fulfilled' && rechercheRes.value.ok) {
          const html = await rechercheRes.value.text()
          const plainFull = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          const countM = plainFull.match(/(\d+)\s*annonces?\s/i)
          const nbTotal = countM?.[1]

          const typeBienLow = (type_bien || '').toLowerCase()
          const annonces: string[] = []
          const seen = new Set<string>()

          const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
          let trMatch
          while ((trMatch = trRegex.exec(html)) !== null && annonces.length < 7) {
            const tr = trMatch[1]
            const tds: string[] = []
            const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
            let tdMatch
            while ((tdMatch = tdRegex.exec(tr)) !== null) {
              tds.push(
                tdMatch[1]
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&euro;/gi, '€').replace(/&nbsp;/gi, ' ')
                  .replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
              )
            }
            if (tds.length < 5) continue

            const prix = tds[0]
            const titre = tds[1]
            const surfaceAnn = tds[4] || '-'
            const prixM2 = tds.length > 7 ? tds[7] : '-'

            if (!/\d[\d\s]*€/.test(prix)) continue
            if (!titre || titre.length < 3 || titre === 'voir') continue

            const key = `${prix.replace(/\s/g, '')}-${titre.substring(0, 15)}`
            if (seen.has(key)) { continue } else { seen.add(key) }

            const titreLow = titre.toLowerCase()
            const relevant =
              (typeBienLow.includes('terrain') && titreLow.includes('terrain')) ||
              (typeBienLow.includes('immeuble') && titreLow.includes('immeuble')) ||
              (typeBienLow.includes('local') && (titreLow.includes('local') || titreLow.includes('commerce'))) ||
              ((typeBienLow.includes('maison') || typeBienLow.includes('villa') || typeBienLow.includes('pavillon')) && titreLow.includes('maison')) ||
              (typeBienLow.includes('appartement') && titreLow.includes('appartement'))
            if (!relevant) continue

            const baisseStr = prix.includes('▼') ? ' ↘ en baisse' : ''
            const surfaceStr = surfaceAnn && surfaceAnn !== '-' && surfaceAnn !== 'voir' && /\d/.test(surfaceAnn) ? ` ${surfaceAnn}` : ''
            const prixM2Str = prixM2 && prixM2 !== '-' && prixM2 !== 'voir' && /\d/.test(prixM2) ? ` · ${prixM2}/m²` : ''
            const prixClean = prix.replace('▼', '').trim()
            annonces.push(`- ${titre}${surfaceStr} : ${prixClean}${prixM2Str}${baisseStr}`)
          }

          if (annonces.length > 0) {
            const header = nbTotal
              ? `Annonces similaires actuellement sur le marché (${nbTotal} biens à vendre sur ${communeVille}) :`
              : `Annonces similaires sur ${communeVille} :`
            lignes.push(header)
            lignes.push(...annonces)
          }
        }

        if (lignes.length > 0) catorusTexte = lignes.join('\n')
      } catch { /* continue sans Castorus */ }
    }

    // 6. Prix vendeur
    const prixVendeurTexte = prix_acquisition
      ? `Prix de vente souhaité par le client : ${parseFloat(prix_acquisition).toLocaleString('fr-FR')} €${surface ? ` soit ${Math.round(parseFloat(prix_acquisition) / parseFloat(surface)).toLocaleString('fr-FR')} €/m²` : ''}`
      : 'Prix non communiqué.'

    // 7. Construction du prompt et appel Claude
    const systemPrompt = `Tu es un expert en valorisation immobilière avec 20 ans d'expérience en transaction, marchand de biens et développement foncier. Tu rédiges des rapports d'analyse préalable synthétiques pour des agents immobiliers et mandataires qui souhaitent savoir si un bien de leur portefeuille peut intéresser des investisseurs professionnels (marchands de biens, promoteurs, foncières).

TON ET STYLE :
- Rapport professionnel, structuré, synthétique (700-1000 mots)
- Langage direct, orienté décision
- Titre : "Analyse Préalable Closia — [type de bien], [ville]"

STRUCTURE OBLIGATOIRE (respecte cet ordre, utilise ces titres exacts) :

1. SYNTHESE DU BIEN
Présentation rapide : type, adresse, surface, opération envisagée.

2. CONTEXTE URBANISTIQUE (PLU)
Analyse approfondie de la zone PLU : type de zone (U, AU, A, N), droits à construire, division parcellaire possible, changement de destination. Mentionne les prescriptions détectées (PPRI, EVV, etc.) et leurs incidences opérationnelles. Conclus sur ce que la réglementation permet ou interdit.

3. LOCALISATION ET DYNAMIQUE DE MARCHE
Analyse de l'emplacement : bassin de vie, attractivité du secteur, accessibilité, tissu économique environnant. Ce secteur est-il recherché par les marchands de biens, promoteurs ou foncières ? Quelle est la liquidité du bien en cas de revente ?

4. RISQUES NATURELS ET TECHNOLOGIQUES
Synthèse des risques identifiés et incidence sur la valeur ou la faisabilité du projet.

5. REFERENCES DE MARCHE
Analyse des transactions DVF récentes et des annonces actuelles : fourchette de prix au m², tendance (hausse/baisse). Compare le bien analysé aux références disponibles.

6. COHERENCE DU PRIX DEMANDE
Si un prix vendeur est communiqué : évalue son positionnement par rapport aux références de marché. Indique l'écart en % et en valeur absolue. Précise si le prix est cohérent, surestimé ou sous-estimé.

7. POTENTIEL DE VALORISATION
Identifie les leviers : division parcellaire, surélévation, changement de destination, réhabilitation, promotion, découpe en lots. Estime la nature de l'opportunité (foncière, patrimoniale, marchande de biens).

8. CONCLUSION CLOSIA
Verdict clair : ce bien est-il susceptible d'intéresser les acheteurs professionnels référencés sur Closia ? Quelles typologies d'acheteurs seraient pertinentes (marchand de biens, promoteur, foncière, investisseur locatif) ? Si des points bloquants existent, les mentionner explicitement.`

    const userPrompt = `Voici les données collectées pour l'analyse préalable. Rédige le rapport structuré.

--- BIEN ---
Type : ${type_bien || 'Non précisé'}
Adresse : ${adresseNormalisee}
Surface : ${surface ? surface + ' m²' : 'Non précisée'}
Type d'opération : ${type_operation || 'Non précisé'}
Référence cadastrale : ${parcelle || 'Non précisée'}

--- URBANISME (PLU) ---
${pluTexte}

--- RISQUES NATURELS ET TECHNOLOGIQUES ---
${risquesTexte}

--- TRANSACTIONS DVF (ventes récentes) ---
${dvfTexte}

--- MARCHE ACTUEL (Castorus) ---
${catorusTexte || 'Données Castorus non disponibles.'}

--- PRIX VENDEUR ---
${prixVendeurTexte}

--- DESCRIPTION DU BIEN (agent) ---
${description || 'Aucune description fournie.'}

--- MESSAGE COMPLEMENTAIRE ---
${message || 'Aucun message complémentaire.'}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rapport = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      rapport,
      meta: {
        adresseNormalisee,
        lat,
        lon,
        plu: pluTexte,
        risques: risquesTexte,
        dvf: dvfTexte,
        castorus: catorusTexte || null,
      }
    })

  } catch (error: any) {
    console.error('Erreur generate-rapport:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
