import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Closia — Dealflow immobilier off-market',
  description: 'Plateforme de leads immobiliers off-market pour marchands de biens, promoteurs et foncières.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
