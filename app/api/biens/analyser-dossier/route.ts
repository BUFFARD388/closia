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
- Localisation : ${adresse || ''}, ${cp || ''} ${ville || ''}
- Situation : ${situation || '—'}
- Description de l'apporteur : ${description || '—'}
- Potentiel identifié par l'apporteur : ${potentiel || 'Non renseigné'}
- Apporteur : ${apporteur || '—'}
${complements ? `\n**Compléments apportés par Laurent après vérification (PLU, marché, terrain…) — ces éléments ont priorité sur les informations du vendeur :**\n${complements}` : ''}

**Ta réponse doit comporter deux parties distinctes, dans cet ordre exact :**

---SCREENING---
[Ta note d'analyse interne pour Laurent : 3 à 5 points concis. Évalue le potentiel réel, les points forts, les points de vigilance, et ta recommandation (FAVORABLE / DÉFAVORABLE / À APPROFONDIR). Sois direct et factuel.]

---BROUILLON_VALIDATION---
[Brouillon de message de validation à envoyer à l'apporteur. Ton professionnel, chaleureux. Confirmer la diffusion du bien, préciser que les acheteurs pros vont être notifiés sous 2h, indiquer la durée de diffusion de 72h. Signer "Laurent Buffard — Closia".]

---BROUILLON_REFUS---
[Brouillon de message de refus à envoyer à l'apporteur. Ton professionnel et bienveillant. Expliquer brièvement pourquoi le bien ne correspond pas aux critères actuels de Closia (sans être trop précis si le dossier est incomplet). Encourager à soumettre un autre dossier. Signer "Laurent Buffard — Closia".]
`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as any).text as string

    // Parser les trois sections
    const screeningMatch = text.match(/---SCREENING---\s*([\s\S]*?)(?=---BROUILLON_VALIDATION---|$)/)
    const validationMatch = text.match(/---BROUILLON_VALIDATION---\s*([\s\S]*?)(?=---BROUILLON_REFUS---|$)/)
    const refusMatch = text.match(/---BROUILLON_REFUS---\s*([\s\S]*?)$/)

    return NextResponse.json({
      screening: screeningMatch?.[1]?.trim() || text,
      brouillon_validation: validationMatch?.[1]?.trim() || '',
      brouillon_refus: refusMatch?.[1]?.trim() || '',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
