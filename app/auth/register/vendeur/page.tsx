'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { signUp } from '@/lib/auth'

export default function RegisterVendeur() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', tel: '', statut_pro: '', societe_vendeur: '', siret: '', password: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp({ ...form, role: 'vendeur' })
      await fetch('/api/emails/bienvenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, prenom: form.prenom, role: 'vendeur' }),
      })
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
          <h1 className="text-xl font-semibold mb-1">Espace apporteur</h1>
          <p className="text-gray-400 text-sm">Soumettez un bien · Réponse sous 48h · Aucun frais</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 text-xs px-4 py-2">
            Agents immobiliers · Mandataires · Notaires
          </div>
        </div>

        <div className="bg-[#111720] border border-white/10 p-6 rounded-xl">
          {step === 1 && (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prénom *</label>
                    <input className="input" placeholder="Sophie" value={form.prenom} onChange={set('prenom')} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom *</label>
                    <input className="input" placeholder="Martin" value={form.nom} onChange={set('nom')} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email professionnel *</label>
                  <input type="email" className="input" placeholder="sophie.martin@agence.fr" value={form.email} onChange={set('email')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone *</label>
                  <input type="tel" className="input" placeholder="06 12 34 56 78" value={form.tel} onChange={set('tel')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Société *</label>
                  <input className="input" placeholder="Nom de votre société" value={form.societe_vendeur} onChange={set('societe_vendeur')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Numéro SIRET *</label>
                  <input className="input" placeholder="XXX XXX XXX XXXXX" value={form.siret} onChange={set('siret')} required pattern="\d{14}" title="Le SIRET doit contenir 14 chiffres" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Statut professionnel *</label>
                  <select className="input" value={form.statut_pro} onChange={set('statut_pro')} required>
                    <option value="">Sélectionner…</option>
                    <option>Agent immobilier</option>
                    <option>Mandataire immobilier</option>
                    <option>Notaire</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe *</label>
                  <input type="password" className="input" placeholder="Min. 8 caractères" value={form.password} onChange={set('password')} required minLength={8} />
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-400 pt-2">
                  <input type="checkbox" className="mt-0.5 flex-shrink-0" required />
                  <span>J'accepte les <a href="#" className="text-[#c29a6b] hover:underline">CGU</a> et la <a href="#" className="text-[#c29a6b] hover:underline">politique de confidentialité</a></span>
                </div>
                <button type="submit" disabled={loading} className="btn-outline w-full justify-center inline-flex items-center gap-2 !py-3.5 mt-2 disabled:opacity-50">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : 'Créer mon compte apporteur'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#c29a6b]/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#c29a6b]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Compte créé !</h2>
              <p className="text-gray-400 text-sm mb-8">
                Vérifiez votre email pour activer votre compte.
              </p>
              <Link href="/auth/login" className="btn-outline justify-center">
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
          Vous êtes acheteur professionnel ?{' '}
          <Link href="/auth/register/acheteur" className="text-gray-400 hover:text-white transition-colors underline">
            Créer un compte acheteur (gratuit)
          </Link>
        </p>
      </div>
    </div>
  )
}

