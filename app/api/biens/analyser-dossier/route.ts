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
[Un dossier de synthèse complet en HTML pur (pas de markdown), destiné à être imprimé/exporté en PDF et montré à l'apporteur ou au vendeur pour justifier ta décision de diffusion ou de refus. Ce dossier doit être structuré en 4 sections avec EXACTEMENT les composants HTML suivants :

SECTION (chaque section encapsulée ainsi) :
<div class="section-block">
  <div class="section-header"><div class="section-num">1</div><div class="section-title">Titre exact de la section</div></div>
  <div class="section-body"><p>Contenu.</p></div>
</div>

Les 4 sections, dans cet ordre :
1. SYNTHÈSE DU BIEN — type, localisation, surface, prix, situation, description en une synthèse claire.
2. ANALYSE DU POTENTIEL — développe le potentiel de valorisation identifié, en intégrant les compléments de vérification de Laurent (PLU, marché, terrain) s'ils sont fournis. Utilise une box-blue pour un constat neutre.
3. POINTS DE VIGILANCE — tout risque, incertitude ou réserve (amiante, zonage contraignant, donnée manquante, prix à retravailler…). Utilise une box-gold pour une vigilance mineure, une box-red pour un point bloquant. S'il n'y a aucun point de vigilance notable, utilise une box-green pour le signaler explicitement.
4. VERDICT CLOSIA — en ouverture de cette section, une box bien visible :
   - box-green avec titre "Validé pour diffusion" si le bien doit être diffusé (potentiel réel, prix cohérent, dossier suffisamment documenté) — précise les typologies d'acheteurs pros pertinentes (marchand de biens, promoteur, foncière, investisseur).
   - box-red avec titre "Non retenu en l'état" si le bien ne doit pas être diffusé — précise clairement pourquoi et ce qu'il faudrait pour reconsidérer le dossier.
   Après la box de verdict, ajoute :
   <div class="conclusion-block">
     <h3>Recommandations Closia</h3>
     <div class="conclusion-rec">
       <div class="conclusion-rec-item"><div class="conclusion-rec-num">1</div><div class="conclusion-rec-text"><strong>Action concrète</strong> — Explication.</div></div>
     </div>
     <div class="conclusion-quote">"Citation professionnelle de conclusion."</div>
   </div>
   <div class="disclaimer">Ce dossier constitue une aide à la décision basée sur les informations disponibles à la date de generation. Il ne constitue pas une expertise immobilière certifiée.</div>

Boîtes disponibles : <div class="box box-blue"><div class="box-title">Titre</div>Texte</div> (et box-gold / box-red / box-green de la même façon).
Génère uniquement le HTML des 4 sections, sans balises html/head/body/style/script, rien avant ni après. N'utilise jamais de syntaxe markdown.]
`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as any).text as string

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
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
