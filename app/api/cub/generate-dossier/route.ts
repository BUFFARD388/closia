import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { id, nom, adresse, cp, ville, parcelle, type_projet, objectif, surface, description, plu_info } = await req.json()

    const prompt = `
Tu es un expert en droit de l'urbanisme français, assistant Laurent Buffard (expert Closia) dans la rédaction d'un dossier de Certificat d'Urbanisme Opérationnel (CUb — article L410-1 b du Code de l'urbanisme).

Laurent va déposer ce dossier en mairie pour le compte d'un client. Il a besoin de :
1. La **note descriptive du projet** prête à insérer dans la rubrique correspondante du CERFA 13410
2. Les **éléments CERFA pré-remplis** pour les autres rubriques clés

**Informations du projet :**
- Demandeur final : ${nom}
- Adresse de la parcelle : ${adresse}, ${cp} ${ville}
- Référence cadastrale : ${parcelle || 'À compléter par Laurent'}
- Objectif : ${objectif || 'Non précisé'}
- Type de projet : ${type_projet}
- Surface de plancher envisagée : ${surface ? surface + ' m²' : 'À préciser'}
- Description du projet : ${description}
${plu_info ? `- Informations PLU / contexte : ${plu_info}` : ''}

**Ta réponse doit comporter EXACTEMENT deux sections :**

---NOTE_DESCRIPTIVE---
Rédige la note descriptive complète du projet pour le CERFA 13410 (rubrique "Description du projet envisagé").
Style : professionnel, administratif, sobre. Environ 200-300 mots.
Structure obligatoire :
1. Présentation de la parcelle (situation, contexte, nature du terrain)
2. Description du projet envisagé (nature de l'opération, destination)
3. Caractéristiques techniques (surface de plancher, nombre de niveaux si pertinent, emprise)
4. Raccordements aux réseaux envisagés (eau, assainissement, électricité)
5. Conformité avec l'objectif (valorisation, faisabilité, etc.)

Le texte doit être prêt à copier-coller dans le CERFA. Utilise "Le pétitionnaire envisage..." ou "Le projet consiste en..." comme formulation.

---ELEMENTS_CERFA---
Liste les valeurs pré-remplies pour les rubriques CERFA suivantes (format clé : valeur) :
- Identité du demandeur : ${nom}
- Adresse du terrain : ${adresse}, ${cp} ${ville}
- Référence cadastrale : ${parcelle || '[À compléter]'}
- Destination de la construction projetée : [à déduire du type de projet]
- Nature des travaux : [à déduire]
- Surface de plancher totale existante : [indiquer 0 si terrain nu, sinon À vérifier]
- Surface de plancher créée : ${surface ? surface + ' m²' : '[À préciser]'}
- Nature de la demande : CUb opérationnel (art. L410-1 b)
`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as any).text as string

    const noteMatch = text.match(/---NOTE_DESCRIPTIVE---\s*([\s\S]*?)(?=---ELEMENTS_CERFA---|$)/)
    const cerfahMatch = text.match(/---ELEMENTS_CERFA---\s*([\s\S]*?)$/)

    const note_descriptive = noteMatch?.[1]?.trim() || ''
    const elements_cerfa = cerfahMatch?.[1]?.trim() || ''

    // Sauvegarde en base — rapport = note_descriptive (principal) + éléments CERFA
    const rapportComplet = `## Note descriptive du projet\n\n${note_descriptive}\n\n## Éléments CERFA pré-remplis\n\n${elements_cerfa}`

    if (id) {
      await supabase.from('analyses').update({ rapport: rapportComplet, statut: 'payee' }).eq('id', id)
    }

    return NextResponse.json({
      note_descriptive,
      elements_cerfa,
      rapport: rapportComplet,
      // Compatibilité avec l'ancien format
      checklist: '',
      guide_depot: '',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
