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
    const { id, nom, adresse, cp, ville, parcelle, type_projet, surface, description, plu_info } = await req.json()

    const prompt = `
Tu es un expert en droit de l'urbanisme français, spécialisé dans la préparation des dossiers de Certificat d'Urbanisme Opérationnel (CUb — article L410-1 b du Code de l'urbanisme).

Tu dois préparer un dossier complet pour la demande de CUb d'un client. Ce dossier doit être directement utilisable, professionnel et précis.

**Informations du projet :**
- Demandeur : ${nom}
- Adresse de la parcelle : ${adresse}, ${cp} ${ville}
- Référence cadastrale : ${parcelle || 'À compléter'}
- Type de projet : ${type_projet}
- Surface de plancher envisagée : ${surface ? surface + ' m²' : 'À préciser'}
- Description du projet : ${description}
${plu_info ? `- Informations PLU connues : ${plu_info}` : ''}

**Ta réponse doit comporter EXACTEMENT trois sections, dans cet ordre :**

---NOTE_DESCRIPTIVE---
Rédige la note descriptive complète du projet à insérer dans le CERFA 13410 (rubrique "Description du projet").
Ton professionnel, précis, conforme aux exigences administratives françaises.
Structure : présentation du terrain, description du projet envisagé, nature des travaux, surface de plancher, destination de la construction, raccordements aux réseaux envisagés.
Environ 200-300 mots, prêt à copier-coller dans le formulaire.

---CHECKLIST---
Rédige la check-list personnalisée des pièces à joindre au dossier CUb pour ce projet spécifique.
Pour chaque pièce : nom exact, format requis, où la trouver, et si elle est obligatoire ou facultative.
Base-toi sur le type de projet (${type_projet}) et les spécificités de la demande.
Inclus : plan de situation, plan cadastral, notice descriptive, et toute pièce spécifique au type de projet.

---GUIDE_DEPOT---
Rédige un guide pratique de dépôt en mairie pour ce dossier CUb.
Inclus : nombre d'exemplaires requis, modalités de dépôt (guichet, courrier, téléprocédure), délai légal d'instruction (2 mois), que faire en cas de dépassement du délai, comment interpréter la réponse (favorable, défavorable, tacite), durée de validité du CUb obtenu (18 mois prorogeable), et conseils pratiques pour maximiser les chances d'obtenir une réponse favorable.
`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as any).text as string

    const noteMatch = text.match(/---NOTE_DESCRIPTIVE---\s*([\s\S]*?)(?=---CHECKLIST---|$)/)
    const checklistMatch = text.match(/---CHECKLIST---\s*([\s\S]*?)(?=---GUIDE_DEPOT---|$)/)
    const guideMatch = text.match(/---GUIDE_DEPOT---\s*([\s\S]*?)$/)

    const dossier = {
      note_descriptive: noteMatch?.[1]?.trim() || '',
      checklist: checklistMatch?.[1]?.trim() || '',
      guide_depot: guideMatch?.[1]?.trim() || '',
    }

    // Sauvegarder en base sous forme de rapport structuré
    const rapportComplet = `# DOSSIER CUb — ${nom}\n\n## 1. Note descriptive du projet\n\n${dossier.note_descriptive}\n\n## 2. Check-list des pièces à joindre\n\n${dossier.checklist}\n\n## 3. Guide de dépôt en mairie\n\n${dossier.guide_depot}`

    if (id) {
      await supabase.from('analyses').update({ rapport: rapportComplet }).eq('id', id)
    }

    return NextResponse.json({ ...dossier, rapport: rapportComplet })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
