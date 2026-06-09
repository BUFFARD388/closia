import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { adresse, type_bien, cp, ville, parcelle, surface, type_operation, prix_acquisition, description, message } = await req.json()

    // 1. Geocodage
    let lat: number | null = null
    let lon: number | null = null
    let villeGeo = ''
    let codePostal = ''
    let codeInsee = ''
    let adresseNormalisee = adresse

    try {
      const queryGeo = [adresse, cp, ville].filter(Boolean).join(' ')
      const geoRes = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(queryGeo)}&limit=1`)
      const geoData = await geoRes.json()
      if (geoData.features?.length > 0) {
        const f = geoData.features[0]
        ;[lon, lat] = f.geometry.coordinates
        villeGeo = f.properties.city || ''
        codePostal = f.properties.postcode || ''
        codeInsee = f.properties.citycode || ''
        adresseNormalisee = f.properties.label || adresse
      }
    } catch { /* continue */ }

    // 2. PLU — polygone cadastral ou bbox 150m
    let pluTexte = 'Donnees PLU non disponibles pour cette commune.'
    if (lat && lon) {
      try {
        let geomObj: object = { type: 'Point', coordinates: [lon, lat] }

        if (codeInsee && parcelle) {
          try {
            const parcelleClean = parcelle.trim().toUpperCase().replace(/\s+/g, ' ')
            const m1 = parcelleClean.match(/([A-Z]{1,2})\s*(\d+)$/)
            const m2 = !m1 ? parcelleClean.match(/(\d+)\s+([A-Z]{1,2})\s+(\d+)/) : null
            const matchP = m1 || m2
            if (matchP) {
              const section = m1 ? matchP[1] : matchP[2]
              const numRaw  = m1 ? matchP[2] : matchP[3]
              const numero  = numRaw.replace(/^0+/, '').padStart(4, '0')
              const cadRes = await fetch(
                `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${codeInsee}&section=${section}&numero=${numero}`,
                { signal: AbortSignal.timeout(6000) }
              )
              if (cadRes.ok) {
                const cadData = await cadRes.json()
                if (cadData.features?.length > 0) geomObj = cadData.features[0].geometry
              }
            }
          } catch { /* fallback */ }
        }

        if ((geomObj as any).type === 'Point') {
          const d = 0.0014
          geomObj = {
            type: 'Polygon',
            coordinates: [[[lon-d,lat-d],[lon+d,lat-d],[lon+d,lat+d],[lon-d,lat+d],[lon-d,lat-d]]]
          }
        }

        const geom = encodeURIComponent(JSON.stringify(geomObj))

        const pluRes = await fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`, { signal: AbortSignal.timeout(8000) })
        if (pluRes.ok) {
          const pluData = await pluRes.json()
          if (pluData.features?.length > 0) {
            const categories: Record<string, string> = {
              U: 'Zone urbaine (constructible)',
              AU: 'Zone a urbaniser',
              A: 'Zone agricole (constructibilite limitee)',
              N: 'Zone naturelle et forestiere (constructibilite tres limitee)',
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
              if (!zonesUniques.has(zone)) {
                zonesUniques.set(zone, `${zone} - ${categorie}${libelong ? ` ("${libelong}")` : ''}`)
              }
            }
            const partition = pluData.features[0].properties.partition || ''
            const zonesStr = Array.from(zonesUniques.values()).join(' + ')
            pluTexte = `Zone(s) PLU : ${zonesStr}${partition ? ` - Document : ${partition}` : ''}`

            try {
              const [prescRes, infoRes] = await Promise.allSettled([
                fetch(`https://apicarto.ign.fr/api/gpu/prescription-surf?geom=${geom}`, { signal: AbortSignal.timeout(5000) }),
                fetch(`https://apicarto.ign.fr/api/gpu/info-surf?geom=${geom}`, { signal: AbortSignal.timeout(5000) }),
              ])
              const prescLabels: string[] = []
              for (const res of [prescRes, infoRes]) {
                if (res.status === 'fulfilled' && res.value.ok) {
                  const d2 = await res.value.json()
                  if (d2.features?.length > 0) {
                    d2.features.forEach((f: any) => {
                      const label = f.properties.libelle || f.properties.txt || f.properties.libelletech || ''
                      if (label && !prescLabels.includes(label)) prescLabels.push(label)
                    })
                  }
                }
              }
              if (prescLabels.length > 0) {
                pluTexte += ` | Prescriptions/servitudes : ${prescLabels.slice(0, 5).join(' - ')}`
              }
            } catch { /* continue */ }
          } else {
            pluTexte = "Bien non couvert par un PLU numerise. Verification en mairie recommandee."
          }
        }
      } catch (e: any) {
        pluTexte = `Donnees PLU non disponibles (${e?.message || 'erreur'}).`
      }
    }

    // 3. Georisques
    let risquesTexte = 'Donnees de risques non disponibles.'
    if (lat && lon) {
      try {
        const rRes = await fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?rayon=500&page=1&page_size=10&latlon=${lon},${lat}`)
        const rData = await rRes.json()
        if (rData.data?.length > 0) {
          const noms = rData.data.map((r: any) => r.libelle_risque_jo).filter(Boolean).join(', ')
          risquesTexte = noms || 'Aucun risque majeur identifie dans le rayon 500m.'
        } else {
          risquesTexte = 'Aucun risque majeur identifie dans le rayon 500m.'
        }
      } catch { /* continue */ }
    }

    // 4. DVF rayon progressif 2-5-10-20 km
    let dvfTexte = 'Donnees DVF non disponibles pour ce secteur.'
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
              const transactions = dvfData.slice(0, 5).map((t: any) =>
                `- ${t.type_local || 'Bien'} - ${t.surface_reelle_bati || t.surface_terrain || '?'} m2 - ${Number(t.valeur_fonciere).toLocaleString('fr-FR')} EUR (${t.date_mutation?.substring(0, 7) || '?'})`
              ).join('\n')
              dvfTexte = `Transactions recentes (rayon ${distance / 1000} km) :\n${transactions}`
              break
            }
          }
        } catch { /* essayer rayon suivant */ }
      }
    }

    // 5. Castorus
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        }

        const [ventesRes, rechercheRes] = await Promise.allSettled([
          fetch(`https://www.castorus.com/ventes-immobilieres/${slugVille}-${communeCP}`, { headers, signal: AbortSignal.timeout(7000) }),
          fetch(`https://www.castorus.com/recherche/${slugVille}-${communeCP}`, { headers, signal: AbortSignal.timeout(7000) }),
        ])

        const lignes: string[] = []

        if (ventesRes.status === 'fulfilled' && ventesRes.value.ok) {
          const plain = (await ventesRes.value.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          const m = plain.match(/(\d+)\s*ventes.*?Prix moyen\s*:\s*([\d \s]+)\s*EUR.*?([\d \s]+)\s*EUR\s*\/\s*m/i)
          if (m) {
            lignes.push(`Resume ventes commune : ${m[1]} transactions - Prix moyen ${m[2].trim()} EUR - ${m[3].trim()} EUR/m2`)
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
              tds.push(tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/&euro;/gi, 'EUR').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim())
            }
            if (tds.length < 5) continue
            const prix = tds[0]
            const titre = tds[1]
            const surfaceAnn = tds[4] || '-'
            const prixM2 = tds.length > 7 ? tds[7] : '-'
            if (!/\d[\d\s]*EUR/.test(prix)) continue
            if (!titre || titre.length < 3 || titre === 'voir') continue
            const key = `${prix.replace(/\s/g, '')}-${titre.substring(0, 15)}`
            if (seen.has(key)) continue
            seen.add(key)
            const titreLow = titre.toLowerCase()
            const relevant =
              (typeBienLow.includes('terrain') && titreLow.includes('terrain')) ||
              (typeBienLow.includes('immeuble') && titreLow.includes('immeuble')) ||
              (typeBienLow.includes('local') && (titreLow.includes('local') || titreLow.includes('commerce'))) ||
              ((typeBienLow.includes('maison') || typeBienLow.includes('villa') || typeBienLow.includes('pavillon')) && titreLow.includes('maison')) ||
              (typeBienLow.includes('appartement') && titreLow.includes('appartement'))
            if (!relevant) continue
            const baisseStr = prix.includes('▼') ? ' en baisse' : ''
            const surfaceStr = surfaceAnn && surfaceAnn !== '-' && /\d/.test(surfaceAnn) ? ` ${surfaceAnn}` : ''
            const prixM2Str = prixM2 && prixM2 !== '-' && /\d/.test(prixM2) ? ` - ${prixM2}/m2` : ''
            annonces.push(`- ${titre}${surfaceStr} : ${prix.replace('▼', '').trim()}${prixM2Str}${baisseStr}`)
          }

          if (annonces.length > 0) {
            const header = nbTotal
              ? `Annonces similaires (${nbTotal} biens sur ${communeVille}) :`
              : `Annonces similaires sur ${communeVille} :`
            lignes.push(header)
            lignes.push(...annonces)
          }
        }

        if (lignes.length > 0) catorusTexte = lignes.join('\n')
      } catch { /* continue */ }
    }

    // 6. Prix vendeur
    const prixVendeurTexte = prix_acquisition
      ? `Prix souhaite : ${parseFloat(prix_acquisition).toLocaleString('fr-FR')} EUR${surface ? ` soit ${Math.round(parseFloat(prix_acquisition) / parseFloat(surface)).toLocaleString('fr-FR')} EUR/m2` : ''}`
      : 'Prix non communique.'

    // 7. Prompt et appel Claude
    const systemPrompt = `Tu es un expert en valorisation immobiliere avec 20 ans d'experience en transaction, marchand de biens et developpement foncier. Tu rediges des rapports d'analyse prealable synthetiques pour des agents immobiliers qui veulent savoir si un bien peut interesser des investisseurs professionnels (marchands de biens, promoteurs, foncieres).

STRUCTURE OBLIGATOIRE (8 sections, ces titres exacts) :

1. SYNTHESE DU BIEN
Presentation : type, adresse, surface, operation envisagee.

2. CONTEXTE URBANISTIQUE (PLU)
Analyse approfondie : type de zone (U/AU/A/N), droits a construire, division parcellaire possible, changement de destination. Prescriptions detectees (PPRI, EVV, etc.) et incidences operationnelles. Conclus sur ce que la reglementation permet ou interdit pour ce bien.

3. LOCALISATION ET DYNAMIQUE DE MARCHE
Bassin de vie, attractivite, accessibilite, tissu economique. Ce secteur est-il recherche par les investisseurs pros ? Liquidite du bien en cas de revente ?

4. RISQUES NATURELS ET TECHNOLOGIQUES
Risques identifies et incidence sur la valeur ou faisabilite.

5. REFERENCES DE MARCHE
DVF recents et annonces actuelles : fourchette prix/m2, tendance. Comparaison avec le bien analyse.

6. COHERENCE DU PRIX DEMANDE
Si prix communique : positionnement vs marche, ecart en % et en valeur absolue. Coherent, surestime ou sous-estime ?

7. POTENTIEL DE VALORISATION
Leviers : division parcellaire, surelevation, changement de destination, rehabilitation, promotion, decoupe en lots.

8. CONCLUSION CLOSIA
Verdict : ce bien interesse-t-il les acheteurs pros Closia ? Quelles typologies (marchand de biens, promoteur, fonciere) ? Points bloquants eventuels.`

    const userPrompt = `Donnees pour l'analyse. Redige le rapport structure.

--- BIEN ---
Type : ${type_bien || 'Non precise'}
Adresse : ${adresseNormalisee}
Surface : ${surface ? surface + ' m2' : 'Non precisee'}
Operation : ${type_operation || 'Non precise'}
Parcelle : ${parcelle || 'Non precisee'}

--- URBANISME (PLU) ---
${pluTexte}

--- RISQUES ---
${risquesTexte}

--- DVF ---
${dvfTexte}

--- MARCHE ACTUEL (Castorus) ---
${catorusTexte || 'Donnees non disponibles.'}

--- PRIX VENDEUR ---
${prixVendeurTexte}

--- DESCRIPTION ---
${description || 'Aucune.'}

--- MESSAGE ---
${message || 'Aucun.'}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rapport = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      rapport,
      meta: { adresseNormalisee, lat, lon, plu: pluTexte, risques: risquesTexte, dvf: dvfTexte, castorus: catorusTexte || null }
    })

  } catch (error: any) {
    console.error('Erreur generate-rapport:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
