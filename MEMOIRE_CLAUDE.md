# MÉMOIRE CLAUDE — Closia
> Fichier de reprise de contexte. À lire au début de chaque session : "Lis ma mémoire Claude"
> Dernière mise à jour : 2026-06-10

---

## Qui suis-je ?
**Laurent Buffard** — laurentbuffard69250@gmail.com  
Entrepreneur qui développe la plateforme **Closia**.

---

## Projet : Closia

### Concept
Plateforme de mise en relation entre **vendeurs pro** (agents immobiliers, mandataires, notaires) et **acheteurs pro** (marchands de biens, promoteurs, foncières) pour des biens à fort potentiel (immeubles à diviser, terrains, locaux avec changement de destination, etc.).

Le vendeur soumet un lead → Closia produit une **analyse experte** → l'acheteur achète le lead qualifié.

### Stack technique
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (thème navy/or)
- **Supabase** (auth + base de données)
- **Stripe** (paiement des leads)
- **Emails transactionnels** (Resend ou Postmark)

### Structure du projet (`C:\Users\Utilisateur\Closia\`)
```
app/
  api/
    analyses/generate-rapport/   → génération rapport IA
    emails/                      → bienvenue, confirm-achat, envoyer-rapport, notify-acheteurs, notify-vendeur, analyse-demande
    stripe/                      → checkout, webhook, analyse-checkout
  auth/login/                    → connexion
  auth/register/acheteur|vendeur → inscription
  dashboard/acheteur|vendeur|admin
  faq/
  leads/                         → listing public des leads
  legal/cgu|cgv|confidentialite|cookies
  rapport/[id]/                  → vue rapport (RapportView.tsx)
  page.tsx                       → landing page
lib/
  achats.ts | auth.ts | biens.ts | supabase.ts | supabase-server.ts
```

### Rôles utilisateurs
- **Vendeur pro** : soumet des biens/leads via son dashboard
- **Acheteur pro** : consulte et achète des leads qualifiés
- **Admin** : gestion globale

### Démarrage local
```bash
cd Closia
npm install
npm run dev
# → http://localhost:3000
```

---

## État d'avancement (dernière connaissance : 2026-06-10)

### Fait
- Structure Next.js complète (pages, API routes)
- Auth Supabase (login/register vendeur/acheteur)
- Dashboards vendeur/acheteur/admin
- Génération de rapport IA
- Intégration Stripe (checkout + webhook)
- Emails transactionnels (bienvenue, confirmation, notification)
- Pages légales (CGU, CGV, confidentialité, cookies)
- Plan de posts LinkedIn (5 semaines, vendeurs + acheteurs)

### En cours / À faire
_(à compléter au fil des sessions)_

---

## Marketing / LinkedIn
Plan de diffusion 5 semaines préparé :
- 2 posts/semaine (mardi + jeudi, 8h-9h ou 12h-13h)
- Alternance vendeurs pro / acheteurs pro
- Ne pas mettre le lien Closia dans le corps du post (pénalité LinkedIn) → mettre en commentaire
- Fichier : `plan-posts-linkedin.md`

---

## Notes de sessions
_(Claude ajoute ici un résumé à chaque fin de session)_

### Session 2026-06-10
- Constat : Cowork plante régulièrement → perte de contexte
- Mise en place de ce fichier MEMOIRE_CLAUDE.md
- Mise en place d'une tâche planifiée de sauvegarde automatique des sessions

---

## Comment utiliser ce fichier

**Au début d'une nouvelle session :**
> "Lis ma mémoire Claude" → je lis ce fichier et reprends le contexte immédiatement

**En fin de session (ou avant de fermer) :**
> "Mets à jour ma mémoire" → je résume ce qu'on a fait et l'ajoute dans "Notes de sessions"

**Si Cowork a planté :**
Les transcripts de sessions sont sauvegardés dans `C:\Users\Utilisateur\Closia\sessions_claude\`
