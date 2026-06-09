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

            // Catégorie lisible selon type de zone
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

            // Prescriptions surfaciques éventuelles (PPRI, patrimoine, etc.)
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
            pluTexte = 'Bien non couvert par un PLU numérisé sur le Géoportail Urbanisme (commune en POS, carte communale ou règlement national d\'urbanisme). Vérification en mairie recommandée.'
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
          .replace(/[̀-ͯ]/g, '')
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

        // Stats DVF résumées via Castorus
        if (ventesRes.status === 'fulfilled' && ventesRes.value.ok) {
          const plain = (await ventesRes.value.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          const m = plain.match(/(\d+)\s*ventes.*?Prix moyen\s*:\s*([\d \s]+)\s*€.*?([\d \s]+)\s*€\s*\/\s*m/i)
          if (m) {
            const nbV = m[1]
            const prixMoy = m[2].replace(/ |\s/g, ' ').trim()
            const pm2 = m[3].replace(/ |\s/g, ' ').trim()
            lignes.push(`Résumé des ventes passées (commune) : ${nbV} transactions · Prix moyen ${prixMoy} € · ${pm2} €/m²`)
          }
        }

        // Annonces actuelles filtrées par type de bien
        if (rechercheRes.status === 'fulfilled' && rechercheRes.value.ok) {
          const html = await rechercheRes.value.text()
          const plainFull = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          const countM = plainFull.match(/(\d+)\s*annonces?\s/i)
          const nbTotal = countM?.[1]

          const typeBienLow = (type_bien || '').toLowerCase()
          const annonces: string[] = []
          const seen = new Set<string>()

          // Parcourir les <tr> du tableau de listings
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
                  .replace(/&euro;/gi, '€').replace(/&nbsp;/gi, ' ')
                  .replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
              )
            }
            if (tds.length < 5) continue

            const prix = tds[0]
            const titre = tds[1]
            const surface = tds[4] || '-'
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
            const surfaceStr = surface && surface !== '-' && surface !== 'voir' && /\d/.test(surface) ? ` ${surface}` : ''
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

    // 6. Calculs financiers à partir des données fournies
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

    // 7. Construction du prompt et appel Claude
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

ZONAGE PLU (Plan Local d'Urbanisme) :
${pluTexte}

DONNÉES GÉORISQUES (rayon 500m) :
${risquesTexte}

RÉFÉRENCES DE MARCHÉ DVF (transactions passées) :
${dvfTexte}

ANNONCES ACTUELLEMENT SUR LE MARCHÉ (Castorus — SeLoger, LeBonCoin) :
${catorusTexte || 'Données non disponibles pour cette commune.'}

STRUCTURE DU RAPPORT (4 sections, respecter impérativement cet ordre et ces titres exacts) :

1. POTENTIEL IDENTIFIÉ
En 4-5 lignes : pourquoi ce bien peut intéresser des investisseurs professionnels. Quel type de profil (marchand de biens, promoteur, foncière…) et pour quelle opération. Sois concret et positif si le dossier le justifie. Si le zonage PLU est disponible et favorable (zone U ou AU), mentionne-le comme facteur de potentiel.

2. CONTEXTE DE MARCHÉ
En 3-4 lignes : dynamique du secteur. Cite les DVF comme références de transactions passées. Si des annonces Castorus sont disponibles, mentionne les biens similaires actuellement en vente et leur fourchette de prix — c'est la concurrence directe. Demande professionnelle sur ce type de bien dans cette zone.

3. POINTS D'ATTENTION
Lister 2 à 3 points à vérifier avant diffusion. Format court : une ligne par point. Ton neutre — ce sont des points à anticiper, pas des obstacles.
- Si le zonage PLU est fourni : inclure une synthèse urbanistique (ex : "Zone UA : usage mixte autorisé, vérifier les règles de hauteur et de CES applicables" ou "Zone N : constructibilité limitée, valider les possibilités d'extension avec le service urbanisme"). Si des prescriptions surfaciques sont détectées (PPRI, patrimoine protégé…), les mentionner.
- Si le PLU n'est pas disponible : indiquer "Zonage PLU à vérifier en mairie" comme point d'attention.

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
