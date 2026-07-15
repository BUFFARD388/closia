import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      type, prix, surface, ville, cp, adresse,
      situation, description, potentiel, apporteur, complements,
    } = body

    // 1. Géocodage
    let lat: number | null = null
    let lon: number | null = null
    let villeGeo = ''
    let codePostal = ''
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
        adresseNormalisee = f.properties.label || adresse
      }
    } catch { /* continue */ }

    // 2. PLU — bbox 150m autour du point géocodé (pas de parcelle cadastrale pour les biens apporteurs)
    let pluTexte = 'Données PLU non disponibles pour cette localisation.'
    if (lat && lon) {
      try {
        const d = 0.0014
        const geomObj = {
          type: 'Polygon',
          coordinates: [[[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]],
        }
        const geom = encodeURIComponent(JSON.stringify(geomObj))

        const pluRes = await fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}`, { signal: AbortSignal.timeout(8000) })
        if (pluRes.ok) {
          const pluData = await pluRes.json()
          if (pluData.features?.length > 0) {
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
            pluTexte = "Bien non couvert par un PLU numérisé. Vérification en mairie recommandée."
          }
        }
      } catch (e: any) {
        pluTexte = `Données PLU non disponibles (${e?.message || 'erreur'}).`
      }
    }

    // 3. Géorisques
    let risquesTexte = 'Données de risques non disponibles.'
    if (lat && lon) {
      try {
        const rRes = await fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?rayon=500&page=1&page_size=10&latlon=${lon},${lat}`)
        const rData = await rRes.json()
        if (rData.data?.length > 0) {
          const noms = rData.data.map((r: any) => r.libelle_risque_jo).filter(Boolean).join(', ')
          risquesTexte = noms || 'Aucun risque majeur identifié dans le rayon 500m.'
        } else {
          risquesTexte = 'Aucun risque majeur identifié dans le rayon 500m.'
        }
      } catch { /* continue */ }
    }

    // 4. DVF — rayon progressif 2-5-10-20 km
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
              const transactions = dvfData.slice(0, 5).map((t: any) =>
                `- ${t.type_local || 'Bien'} - ${t.surface_reelle_bati || t.surface_terrain || '?'} m² - ${Number(t.valeur_fonciere).toLocaleString('fr-FR')} € (${t.date_mutation?.substring(0, 7) || '?'})`
              ).join('\n')
              dvfTexte = `Transactions récentes (rayon ${distance / 1000} km) :\n${transactions}`
              break
            }
          }
        } catch { /* essayer rayon suivant */ }
      }
    }

    // 5. Castorus — annonces comparables
    let castorusTexte = ''
    const communeVille = villeGeo || ville || ''
    const communeCP = codePostal || cp || ''
    if (communeVille && communeCP) {
      try {
        const diacriticsRegex = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g')
        const slugVille = communeVille
          .toLowerCase()
          .normalize('NFD')
          .replace(diacriticsRegex, '')
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
          const m = plain.match(/(\d+)\s*ventes.*?Prix moyen\s*:\s*([\d \s]+)\s*€.*?([\d \s]+)\s*€\s*\/\s*m/i)
          if (m) {
            lignes.push(`Résumé ventes commune : ${m[1]} transactions - Prix moyen ${m[2].trim()} € - ${m[3].trim()} €/m²`)
          }
        }

        if (rechercheRes.status === 'fulfilled' && rechercheRes.value.ok) {
          const html = await rechercheRes.value.text()
          const plainFull = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
          const countM = plainFull.match(/(\d+)\s*annonces?\s/i)
          const nbTotal = countM?.[1]
          const typeBienLow = (type || '').toLowerCase()
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
              tds.push(tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/&euro;/gi, '€').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim())
            }
            if (tds.length < 5) continue
            const prixAnn = tds[0]
            const titre = tds[1]
            const surfaceAnn = tds[4] || '-'
            const prixM2 = tds.length > 7 ? tds[7] : '-'
            if (!/\d[\d\s]*€/.test(prixAnn)) continue
            if (!titre || titre.length < 3 || titre === 'voir') continue
            const key = `${prixAnn.replace(/\s/g, '')}-${titre.substring(0, 15)}`
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
            const baisseStr = prixAnn.includes('▼') ? ' en baisse' : ''
            const surfaceStr = surfaceAnn && surfaceAnn !== '-' && /\d/.test(surfaceAnn) ? ` ${surfaceAnn}` : ''
            const prixM2Str = prixM2 && prixM2 !== '-' && /\d/.test(prixM2) ? ` - ${prixM2}/m²` : ''
            annonces.push(`- ${titre}${surfaceStr} : ${prixAnn.replace('▼', '').trim()}${prixM2Str}${baisseStr}`)
          }

          if (annonces.length > 0) {
            const header = nbTotal
              ? `Annonces similaires (${nbTotal} biens sur ${communeVille}) :`
              : `Annonces similaires sur ${communeVille} :`
            lignes.push(header)
            lignes.push(...annonces)
          }
        }

        if (lignes.length > 0) castorusTexte = lignes.join('\n')
      } catch { /* continue */ }
    }

    const prompt = `
Tu es l'assistant de Laurent Buffard, fondateur de Closia — une plateforme qui met en relation des agents immobiliers vendeurs (apporteurs de biens) avec des acheteurs professionnels (marchands de biens, promoteurs, investisseurs) à la recherche de biens à fort potentiel de valorisation.

Tu dois analyser le dossier d'un bien soumis par un apporteur et aider Laurent à prendre sa décision : diffuser le bien sur la plateforme ou le refuser.

**Critères de sélection Closia :**
- Fort potentiel de valorisation identifiable (division parcellaire, construction neuve, rénovation pour revente, surélévation, changement d'usage, création de lots…)
- Prix d'acquisition cohérent avec le potentiel
- Localisation avec un marché immobilier actif
- Dossier suffisamment documenté pour intéresser un acheteur pro

**Dossier soumis :**
- Type de bien : ${type || '—'}
- Prix demandé : ${prix ? Number(prix).toLocaleString('fr-FR') + ' €' : '—'}
- Surface : ${surface ? surface + ' m²' : '—'}
- Localisation : ${adresseNormalisee || adresse || ''}, ${cp || ''} ${ville || ''}
- Situation : ${situation || '—'}
- Description de l'apporteur : ${description || '—'}
- Potentiel identifié par l'apporteur : ${potentiel || 'Non renseigné'}
- Apporteur : ${apporteur || '—'}

**Données automatiques collectées :**
- Urbanisme (PLU) : ${pluTexte}
- Risques (Géorisques, rayon 500m) : ${risquesTexte}
- DVF (transactions récentes) : ${dvfTexte}
- Marché actuel (annonces comparables) : ${castorusTexte || 'Données non disponibles.'}
${complements ? `\n**Compléments apportés par Laurent après vérification terrain — ces éléments ont priorité sur toute autre donnée en cas de contradiction (y compris les données automatiques ci-dessus) :**\n${complements}` : ''}

**Ta réponse doit comporter cinq parties distinctes, dans cet ordre exact :**

---SCREENING---
[Ta note d'analyse interne pour Laurent : 3 à 5 points concis. Évalue le potentiel réel, les points forts, les points de vigilance, et ta recommandation (FAVORABLE / DÉFAVORABLE / À APPROFONDIR). Sois direct et factuel.]

---POTENTIEL_SYNTHETISE---
[2 à 3 phrases courtes et percutantes destinées aux acheteurs professionnels. Synthétise le potentiel de valorisation du bien : type d'opération possible, gain estimé ou levier de valeur, profil d'acheteur idéal. Ton factuel et professionnel. Pas de prix, pas de nom de ville. Exemple : "Maison de ville sur grande parcelle permettant la création de 2 à 3 lots constructibles. Fort potentiel de revente après division et rénovation. Typique des opérations recherchées par les marchands de biens actifs en secteur tendu."]

---BROUILLON_VALIDATION---
[Brouillon de message de validation à envoyer à l'apporteur. Ton professionnel, chaleureux. Confirmer la diffusion du bien, préciser que les acheteurs pros vont être notifiés sous 2h, indiquer la durée de diffusion de 72h. Signer "Laurent Buffard — Closia".]

---BROUILLON_REFUS---
[Brouillon de message de refus à envoyer à l'apporteur. Ton professionnel et bienveillant. Expliquer brièvement pourquoi le bien ne correspond pas aux critères actuels de Closia (sans être trop précis si le dossier est incomplet). Encourager à soumettre un autre dossier. Signer "Laurent Buffard — Closia".]

---DOSSIER---
[Un dossier de synthèse complet et détaillé en HTML pur (pas de markdown), du niveau d'un rapport d'expertise professionnel, destiné à être imprimé/exporté en PDF et montré à l'apporteur ou au vendeur pour justifier ta décision de diffusion ou de refus. Base-toi en priorité sur les données automatiques collectées ci-dessus (PLU, risques, DVF, marché) et sur les compléments de Laurent s'il y en a — ne spécule jamais sur des informations non fournies.

Ce dossier doit être structuré en 9 sections, aussi détaillé et étoffé qu'un rapport d'expertise professionnelle (ne sois pas laconique : développe chaque section en plusieurs phrases ou paragraphes, comme le ferait un expert immobilier senior), avec EXACTEMENT les composants HTML suivants :

SECTION (chaque section encapsulée ainsi) :
<div class="section-block">
  <div class="section-header"><div class="section-num">1</div><div class="section-title">Titre exact de la section</div></div>
  <div class="section-body"><p>Contenu.</p></div>
</div>

BOÎTES D'ALERTE (à utiliser pour tout point important — donnée manquante, risque, alerte, point positif) :
<div class="box box-blue"><div class="box-title">Titre</div>Texte informatif neutre.</div>
<div class="box box-gold"><div class="box-title">Point de vigilance</div>Texte.</div>
<div class="box box-red"><div class="box-title">Risque</div>Texte.</div>
<div class="box box-green"><div class="box-title">Point positif</div>Texte.</div>

TABLEAUX (utilise-les largement — zonage/destinations autorisées, transactions DVF, annonces, critères de localisation, calculs de prix, scénarios de valorisation — dès que tu as 3 données comparables ou plus) :
<table><thead><tr><th>Colonne 1</th><th>Colonne 2</th></tr></thead><tbody>
<tr><td><strong>Label</strong></td><td>Valeur</td></tr>
</tbody></table>

ESTIMATION (toujours avec ces deux cartes, section 8) :
<div class="estimation-grid">
  <div class="estimation-card low"><div class="estimation-card-label">Estimation basse</div><div class="estimation-card-value">XXX XXX €</div><div class="estimation-card-sub">Hypothèse prudente</div></div>
  <div class="estimation-card high"><div class="estimation-card-label">Estimation haute</div><div class="estimation-card-value">XXX XXX €</div><div class="estimation-card-sub">Conditions favorables</div></div>
</div>

CONCLUSION (section 9, après la box de verdict) :
<div class="conclusion-block">
  <h3>Recommandations Closia</h3>
  <div class="conclusion-rec">
    <div class="conclusion-rec-item"><div class="conclusion-rec-num">1</div><div class="conclusion-rec-text"><strong>Action concrète</strong> — Explication.</div></div>
  </div>
  <div class="conclusion-quote">"Citation professionnelle de conclusion."</div>
</div>
<div class="disclaimer">Ce dossier constitue une aide à la décision basée sur les informations disponibles à la date de génération. Il ne constitue pas une expertise immobilière certifiée.</div>

Les 9 sections, dans cet ordre :

1. SYNTHÈSE DU BIEN — tableau d'identification (type, adresse, surface, prix, prix/m², situation, apporteur) puis un paragraphe de présentation détaillé reprenant la description transmise.

2. CONTEXTE URBANISTIQUE (PLU) — section technique et approfondie. Reprends la donnée PLU collectée automatiquement (zonage, prescriptions/servitudes) : décris la nature de la zone, les destinations probablement autorisées/interdites pour ce type de zonage, les règles de densité et hauteur usuelles. Présente si possible un tableau destinations/autorisation. Signale toute servitude, périmètre ABF, risque inondation, zone bruit détectés. Si la donnée PLU indique "non disponible" ou "non numérisé", tu NE DOIS PAS spéculer sur la constructibilité précise : alerte avec une box-gold ou box-red que le zonage doit être vérifié en mairie avant tout engagement, et recommande le dépôt d'un certificat d'urbanisme si pertinent. Si des compléments de Laurent contredisent ou précisent la donnée automatique, ils priment.

3. LOCALISATION ET DYNAMIQUE DE MARCHÉ — profil de la commune (population approximative, attractivité, position géographique, accès transports, réputation), puis dynamique du marché immobilier local (demande, liquidité, profils d'acquéreurs dominants pour ce type de bien). Présente un tableau d'appréciation par critère (accessibilité routière, transports en commun, commerces et services, cadre environnemental, image du secteur…). Conclus sur la liquidité et l'attractivité du secteur pour un acheteur professionnel.

4. RISQUES ET CONTRAINTES — risques naturels et technologiques collectés (Géorisques) + tout point de vigilance mentionné par Laurent ou déductible du dossier (amiante, mitoyenneté, servitude, PMR, DPE, donnée manquante…). Présente un tableau des contraintes avec impact financier estimé si pertinent (ex. désamiantage, mise aux normes). Utilise box-red pour un point bloquant, box-gold pour une vigilance mineure, box-green s'il n'y a aucun point notable.

5. RÉFÉRENCES DE MARCHÉ — présente les transactions DVF et les annonces comparables (Castorus) collectées, sous forme de tableau (adresse/commune, surface, prix, prix/m², observations). Si ces données automatiques sont vides ou insuffisantes pour ce secteur précis, complète avec ta connaissance générale du marché immobilier de la commune et des communes comparables proches (fourchettes de prix/m² usuelles par type de bien) — précise alors clairement, dans une box-gold, qu'il s'agit d'une estimation basée sur ta connaissance du marché et non de transactions DVF vérifiées.

6. COHÉRENCE DU PRIX DEMANDÉ — calcule le prix au m² du bien tel que demandé, compare-le à la fourchette de marché de la section 5, dans un tableau de calcul (surface × prix/m² = valeur, avec ajustements justifiés : localisation, état, contraintes). Indique l'écart en % et en valeur absolue entre le prix demandé et l'estimation de marché. Conclus explicitement : prix cohérent / légèrement surévalué / surévalué / sous-évalué.

7. POTENTIEL DE VALORISATION — développe le ou les leviers de valorisation (division, changement d'usage, rénovation, surélévation, promotion…) sous forme de scénarios. Présente-les en tableau (colonnes : Scénario / Faisabilité / Investissement estimé / Valeur cible / Commentaire) dès que tu identifies au moins 2 scénarios distincts. Indique le scénario recommandé en priorité et pourquoi.

8. FOURCHETTE DE PRIX ESTIMÉE — synthèse chiffrée finale avec le composant estimation-grid : NE LAISSE JAMAIS cette section sans chiffres. Base-toi sur les sections 5 et 6 ; si les données automatiques (DVF/Castorus) sont vides ou insuffisantes, appuie-toi sur ta connaissance générale du marché immobilier français pour proposer une fourchette raisonnable et argumentée — dans ce cas, ajoute juste avant l'estimation-grid une box-gold précisant explicitement que cette fourchette est une estimation basée sur la connaissance générale du marché, faute de données DVF/Castorus disponibles pour ce secteur, et qu'elle devra être affinée par une étude de marché complémentaire avant toute négociation.

9. VERDICT CLOSIA — en ouverture de cette section, une box bien visible :
   - box-green avec titre "Validé pour diffusion" si le bien doit être diffusé (potentiel réel, prix cohérent avec la fourchette estimée, dossier suffisamment documenté) — précise les typologies d'acheteurs pros pertinentes (marchand de biens, promoteur, foncière, investisseur).
   - box-red avec titre "Non retenu en l'état" si le bien ne doit pas être diffusé — précise clairement pourquoi et ce qu'il faudrait pour reconsidérer le dossier.
   Puis le composant conclusion-block (4 à 6 recommandations numérotées et concrètes) et le disclaimer.

Génère uniquement le HTML des 9 sections, sans balises html/head/body/style/script, rien avant ni après. N'utilise jamais de syntaxe markdown. Sois riche et développé dans chaque section plutôt que synthétique : ce dossier doit donner une impression de rapport d'expertise complet, pas de fiche résumée.]
`

    // Retry automatique si l'API est surchargée (529)
    let text = ''
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 12000,
          messages: [{ role: 'user', content: prompt }],
        })
        text = (message.content[0] as any).text as string
        break
      } catch (err: any) {
        const status = err?.status ?? err?.error?.status
        if ((status === 529 || err?.message?.includes('overloaded')) && attempt < 3) {
          await new Promise(res => setTimeout(res, attempt * 3000))
          continue
        }
        throw err
      }
    }

    // Parser les cinq sections
    const screeningMatch = text.match(/---SCREENING---\s*([\s\S]*?)(?=---POTENTIEL_SYNTHETISE---|---BROUILLON_VALIDATION---|---BROUILLON_REFUS---|---DOSSIER---|$)/)
    const potentielMatch = text.match(/---POTENTIEL_SYNTHETISE---\s*([\s\S]*?)(?=---BROUILLON_VALIDATION---|---BROUILLON_REFUS---|---DOSSIER---|$)/)
    const validationMatch = text.match(/---BROUILLON_VALIDATION---\s*([\s\S]*?)(?=---BROUILLON_REFUS---|---DOSSIER---|$)/)
    const refusMatch = text.match(/---BROUILLON_REFUS---\s*([\s\S]*?)(?=---DOSSIER---|$)/)
    const dossierMatch = text.match(/---DOSSIER---\s*([\s\S]*?)$/)

    return NextResponse.json({
      screening: screeningMatch?.[1]?.trim() || text,
      potentiel_synthetise: potentielMatch?.[1]?.trim() || '',
      brouillon_validation: validationMatch?.[1]?.trim() || '',
      brouillon_refus: refusMatch?.[1]?.trim() || '',
      dossier_html: dossierMatch?.[1]?.trim() || '',
      meta: { adresseNormalisee, lat, lon, plu: pluTexte, risques: risquesTexte, dvf: dvfTexte, castorus: castorusTexte || null },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
