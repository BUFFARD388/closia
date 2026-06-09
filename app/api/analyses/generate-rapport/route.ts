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
    let codeInsee = ''
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
        codeInsee = f.properties.citycode || ''
        adresseNormalisee = f.properties.label || adresse
      }
    } catch { /* continue sans geocodage */ }

    // 2. Données PLU via Géoportail Urbanisme (apicarto.ign.fr)
    // On tente d'abord de récupérer le polygone exact de la parcelle cadastrale
    // pour détecter les prescriptions (EVV, PPRI, etc.) qui ne couvrent qu'une partie du terrain
    let pluTexte = 'Données PLU non disponibles pour cette commune.'
    if (lat && lon) {
      try {
        // Géométrie de requête : polygone cadastral si possible, sinon bbox 150m autour du point
        let geomObj: object = { type: 'Point', coordinates: [lon, lat] }

        if (codeInsee && parcelle) {
          try {
            // Parsing de la référence cadastrale (ex: "AB 0042", "A 12", "000 AB 0042")
            const parcelleClean = parcelle.trim().toUpperCase().replace(/\s+/g, ' ')
            const matchParcelle = parcelleClean.match(/([A-Z]{1,2})\s*(\d+)$/) || parcelleClean.match(/(\d+)\s+([A-Z]{1,2})\s+(\d+)/)
            if (matchParcelle) {
              const section = matchParcelle[1] || matchParcelle[2]
              const numero = (matchParcelle[2] || matchParcelle[3]).replace(/^0+/, '').padStart(4, '0')
              const cadastreRes = await fetch(
                `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${codeInsee}&section=${section}&numero=${numero}`,
                { signal: AbortSignal.timeout(6000) }
              )
              if (cadastreRes.ok) {
                const cadastreData = await cadastreRes.json()
                if (cadastreData.features?.length > 0) {
                  geomObj = cadastreData.features[0].geometry
                }
              }
            }
          } catch { /* parcelle non résolue, on garde le point */ }
        }

        // Si on n'a toujours qu'un point, on élargit à une bbox ~150m pour capter les chevauchements partiels
        if ((geomObj as any).type === 'Point') {
          const d = 0.0014 // ~150m en degrés
          geomObj = {
            type: 'Polygon',
            coordinates: [[
              [lon - d, lat - d],
              [lon + d, lat - d],
              [lon + d, lat + d],
              [lon - d, lat + d],
              [lon - d, lat - d],
            ]]
          }
        }

        const geom = encodeURIComponent(JSON.stringify(geomObj))

        const pluRes = await fetch(
          `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (pluRes.ok) {
          const pluData = await pluRes.json()
          if (pluData.features?.length > 0) {
            // Toutes les zones PLU intersectant la parcelle (cas de terrain multi-zones)
            const categories: Record<string, string> = {
              U: 'Zone urbaine (constructible)',
              AU: 'Zone à urbaniser',
              A: 'Zone agricole (constructibilité limitée)',
              N: 'Zone naturelle et forestière (constructibilité très limitée)',
            }
            const zonesUniques = new Map<string, string>()
            for (const feat of pluData.features) {
              const props = feat.properties
              const zone = props.libelle || '?'
              const typeZone = (props.typezone || '').toUpperCase()
              const libelong = props.libelong || ''
              const prefix = typeZone.startsWith('AU') ? 'AU'
                : typeZone.startsWith('U') ? 'U'
                : typeZone.startsWith('A') ? 'A'
                : typeZone.startsWith('N') ? 'N'
                : typeZone
              const categorie = categories[prefix] || `Zone ${typeZone}`
              const key = zone
              if (!zonesUniques.has(key)) {
                zonesUniques.set(key, `${zone} — ${categorie}${libelong ? ` ("${libelong}")` : ''}`)
              }
            }
            const partition = pluData.features[0].properties.partition || ''
            const zonesStr = Array.from(zonesUniques.values()).join(' + ')
            pluTexte = `Zone(s) PLU : ${zonesStr}${partition ? ` · Document : ${partition}` : ''}`

            // Prescriptions surfaciques (PPRI, EVV, patrimoine, etc.)
            try {
              const [prescRes, infoRes] = await Promise.allSettled([
                fetch(`https://apicarto.ign.fr/api/gpu/prescription-surf?geom=${geom}`, { signal: AbortSignal.timeout(5000) }),
                fetch(`https://apicarto.ign.fr/api/gpu/info-surf?geom=${geom}`, { signal: AbortSignal.timeout(5000) }),
              ])

              const prescLabels: string[] = []

              if (prescRes.status === 'fulfilled' && prescRes.value.ok) {
                const prescData = await prescRes.value.json()
                if (prescData.features?.length > 0) {
                  prescData.features.forEach((f: any) => {
                    const label = f.properties.libelle || f.properties.txt || f.properties.libelletech || ''
                    if (label && !prescLabels.includes(label)) prescLabels.push(label)
                  })
                }
              }
              if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
                const infoData = await infoRes.value.json()
                if (infoData.features?.length > 0) {
                  infoData.features.forEach((f: any) => {
                    const label = f.properties.libelle || f.properties.txt || f.properties.libelletech || ''
                    if (label && !prescLabels.includes(label)) prescLabels.push(label)
                  })
                }
              }

              if (prescLabels.length > 0) {
                pluTexte += ` | Prescriptions/servitudes détectées : ${prescLabels.slice(0, 5).join(' · ')}`
              }
            } catch { /* continue sans prescriptions */ }
          } else {
            pluTexte = "Bien non couvert par un PLU numérisé sur le Géoportail Urbanisme. Vérification en mairie recommandée."
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

2. CONTEXTE URB