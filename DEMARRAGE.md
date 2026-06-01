# Closia — Démarrage

## Installation

```bash
cd Closia
npm install
npm run dev
```

Ouvrez http://localhost:3000

## Pages disponibles

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/leads` | Listing public des leads |
| `/auth/login` | Connexion |
| `/auth/register` | Inscription (vendeur ou acheteur) |
| `/dashboard/vendeur` | Espace apporteur |
| `/dashboard/acheteur` | Espace acheteur pro + achat de leads |

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (thème navy/or)
- **Stripe** (à intégrer via `STRIPE_PUBLIC_KEY` dans `.env.local`)

## Prochaines étapes

1. **Supabase** — auth, base de données (biens, leads, achats)
2. **Stripe** — vrai paiement avec `@stripe/stripe-js`
3. **Emails** — confirmation achat, notif analyse 48h (Resend ou Postmark)
4. **Timer temps réel** — countdown 72h avec WebSockets ou polling
