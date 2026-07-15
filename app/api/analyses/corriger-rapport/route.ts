import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { id, corrections, rapport } = await req.json()

    if (!id || !corrections || !rapport) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const systemPrompt = `Tu es un expert en valorisation immobilière. Tu reçois un rapport d'analyse préalable Closia déjà rédigé en HTML (composants section-block, box, table, estimation-grid, conclusion-block — voir le rapport original ci-dessous pour la syntaxe exacte), ainsi que des corrections et remarques formulées par l'expert humain qui a vérifié le rapport.

Ton rôle est de produire une version corrigée et définitive du rapport, en intégrant scrupuleusement toutes les remarques de l'expert.

RÈGLES :
- Respecte strictement les corrections indiquées (ex : si l'expert dit que la zone PLU est A agricole, corrige toutes les sections concernées en conséquence)
- Conserve la structure HTML exacte du rapport original : mêmes composants (section-block/section-header/section-num/section-title/section-body, box/box-blue/box-gold/box-red/box-green, table, estimation-grid/estimation-card, conclusion-block/conclusion-rec/conclusion-quote, disclaimer), mêmes numéros et titres de section
- Ne modifie que ce qui est concerné par les corrections — le reste doit rester inchangé
- Si une correction invalide une conclusion (ex : zone A rend la division impossible), mets à jour le verdict de diffusion (section 9) en conséquence — y compris la couleur de la box de verdict (box-green si éligible, box-red si non éligible) et les recommandations du conclusion-block
- Ne produis aucune syntaxe markdown (pas de **, pas de #, pas de tableaux en pipes) : uniquement les composants HTML déjà utilisés dans le rapport original
- Ne commente pas les corrections, ne les mentionne pas dans le rapport — intègre-les directement
- Ne génère que le HTML des sections (pas de balises html/head/body/style/script), rien avant ni après`

    const userPrompt = `RAPPORT ORIGINAL :
${rapport}

---

CORRECTIONS DE L'EXPERT :
${corrections}

---

Produis maintenant le rapport définitif corrigé, en intégrant toutes les remarques ci-dessus.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rapportCorrige = response.content[0].type === 'text' ? response.content[0].text : ''

    if (!rapportCorrige) {
      return NextResponse.json({ error: 'Le modèle n\'a pas retourné de contenu.' }, { status: 500 })
    }

    // Sauvegarder dans Supabase (remplace le rapport original)
    const { error: updateError } = await supabase
      .from('analyses')
      .update({ rapport: rapportCorrige })
      .eq('id', id)

    if (updateError) {
      console.error('Erreur Supabase update:', updateError)
      // On retourne quand même le rapport corrigé même si la sauvegarde échoue
      return NextResponse.json({ rapport: rapportCorrige, warning: 'Rapport généré mais non sauvegardé en base.' })
    }

    return NextResponse.json({ rapport: rapportCorrige })

  } catch (error: any) {
    console.error('Erreur corriger-rapport:', error)
    return NextResponse.json({ error: error?.message || 'Erreur interne' }, { status: 500 })
  }
}
