import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <nav className="border-b border-white/5 px-6 lg:px-10 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src="/logo.png" alt="Closia" className="h-10 w-auto" />
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors tracking-widest uppercase">
            ← Retour à l'accueil
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
        {children}
      </main>
      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-gray-600">
        © 2026 Closia · <Link href="/legal/cgu" className="hover:text-gray-400">CGU</Link> · <Link href="/legal/cgv" className="hover:text-gray-400">CGV</Link> · <Link href="/legal/confidentialite" className="hover:text-gray-400">Confidentialité</Link> · <Link href="/legal/cookies" className="hover:text-gray-400">Cookies</Link>
      </footer>
    </div>
  )
}
