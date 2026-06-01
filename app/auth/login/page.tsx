'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Closia" className="h-16 w-auto mx-auto" />
          <h1 className="text-xl font-semibold mt-3 mb-1">Connexion</h1>
          <p className="text-gray-400 text-sm">Accédez à votre espace Closia</p>
        </div>

        <div className="card rounded-xl">
          <form onSubmit={e => e.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                className="input"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Se souvenir de moi
              </label>
              <a href="#" className="text-gold-500 hover:underline">Mot de passe oublié ?</a>
            </div>

            <button type="submit" className="btn-primary w-full justify-center">
              Se connecter
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-navy-700 text-center text-sm text-gray-400">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-gold-500 hover:underline font-medium">
              Créer un compte gratuitement
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
