'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { signUp } from '@/lib/auth'

export default function RegisterAcheteur() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', tel: '', societe: '',
    profil_type: '', zones: '', password: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp({ ...form, role: 'acheteur' })
      setStep(2)
    } catch (err: any) {
      setError(err.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Closia" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-1">Espace acheteur professionnel</h1>
          <p className="text-gray-400 text-sm">Inscription gratuite · Accès immédiat aux leads</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-[#c29a6b]/10 border border-[#c29a6b]/30 text-[#c29a6b] text-xs px-4 py-2">
            Marchands de biens · Promoteurs · Foncières · Lotisseurs
          </div>
        </div>
        <div className="bg-[#111720] border border-white/10 p-6 rounded-xl">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prénom *</label>
                  <input className="input" placeholder="Jean" required value={form.prenom} onChange={set('prenom')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nom *</label>
                  <input className="input" placeholder="Dupont" required value={form.nom} onChange={set('nom')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email professionnel *</label>
                <input type="email" className="input" placeholder="jean.dupont@societe.fr" required value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone *</label>
                <input type="tel" className="input" placeholder="06 12 34 56 78" required value={form.tel} onChange={set('tel')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Société *</label>
                <input className="input" placeholder="Nom de votre société" required value={form.societe} onChange={set('societe')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profil *</label>
                <select className="input" required value={form.profil_type} onChange={set('profil_type')}>
                  <option value="">Sélectionner…</option>
                  <option>Marchand de biens</option>
                  <option>Promoteur immobilier</option>
                  <option>Foncière</option>
                  <option>Lotisseur</option>
                  <option>Investisseur privé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zones géographiques d'intérêt</label>
                <input className="input" placeholder="Ex : Lyon, Rhône-Alpes, PACA…" value={form.zones} onChange={set('zones')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe *</label>
                <input type="password" className="input" placeholder="Min. 8 caractères" required minLength={8} value={form.password} onChange={set('password')} />
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-400 pt-2">
                <input type="checkbox" className="mt-0.5 flex-shrink-0" required />
                <span>J'accepte les <a href="#" className="text-[#c29a6b] hover:underline">CGU</a> et la <a href="#" className="text-[#c29a6b] hover:underline">politique de confidentialité</a></span>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center !py-3.5 mt-2 disabled:opacity-50 inline-flex items-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : 'Créer mon compte gratuitement'}
              </button>
            </form>
          )}
          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#c29a6b]/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#c29a6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Bienvenue sur Closia !</h2>
              <p className="text-gray-400 text-sm mb-8">Votre compte acheteur est créé. Accédez dès maintenant aux leads disponibles.</p>
              <Link href="/auth/login" className="btn-primary justify-center">
                Se connecter
              </Link>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-[#c29a6b] hover:underline font-medium">
              Se connecter
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">
          Vous êtes un apporteur de biens ?{' '}
          <Link href="/auth/register/vendeur" className="text-gray-400 hover:text-white transition-colors underline">
            Créer un compte apporteur
          </Link>
        </p>
      </div>
    </div>
  )
}

