'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Users } from 'lucide-react'

function RegisterForm() {
  const params = useSearchParams()
  const defaultRole = params.get('role') || ''
  const [role, setRole] = useState<'vendeur' | 'acheteur' | ''>(defaultRole as any)
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Closia" className="h-16 w-auto mx-auto" />
          <h1 className="text-xl font-semibold mt-3 mb-1">Créer un compte</h1>
          <p className="text-gray-400 text-sm">Inscription gratuite · Accès immédiat aux leads</p>
          {defaultRole === 'acheteur' && (
            <div className="mt-3 inline-flex items-center gap-2 bg-[#c9a227]/10 border border-[#c9a227]/30 text-[#c9a227] text-xs px-4 py-2 rounded-full">
              Réservé aux acheteurs professionnels · 100% gratuit
            </div>
          )}
        </div>

        <div className="card">
          {/* Étape 1 : Choix du rôle */}
          {step === 1 && (
            <div>
              <h2 className="font-semibold text-center mb-6">Vous êtes…</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Vendeur */}
                <button
                  onClick={() => setRole('vendeur')}
                  className={`p-5 rounded-xl border-2 transition-all text-center ${
                    role === 'vendeur'
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-navy-600 hover:border-navy-500'
                  }`}
                >
                  <Building2 className={`w-8 h-8 mx-auto mb-3 ${role === 'vendeur' ? 'text-gold-500' : 'text-gray-400'}`} />
                  <div className="font-semibold">Apporteur</div>
                  <div className="text-xs text-gray-400 mt-1">Agent, mandataire, notaire</div>
                </button>
                {/* Acheteur */}
                <button
                  onClick={() => setRole('acheteur')}
                  className={`p-5 rounded-xl border-2 transition-all text-center ${
                    role === 'acheteur'
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-navy-600 hover:border-navy-500'
                  }`}
                >
                  <Users className={`w-8 h-8 mx-auto mb-3 ${role === 'acheteur' ? 'text-gold-500' : 'text-gray-400'}`} />
                  <div className="font-semibold">Acheteur pro</div>
                  <div className="text-xs text-gray-400 mt-1">Marchand de biens, promoteur, foncière</div>
                </button>
              </div>
              <button
                disabled={!role}
                onClick={() => setStep(2)}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          )}

          {/* Étape 2 : Informations */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-semibold">
                  {role === 'vendeur' ? 'Compte apporteur' : 'Compte acheteur pro'}
                </h2>
              </div>
              <form onSubmit={e => { e.preventDefault(); setStep(3) }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prénom</label>
                    <input className="input" placeholder="Jean" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                    <input className="input" placeholder="Dupont" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email professionnel</label>
                  <input type="email" className="input" placeholder="jean.dupont@societe.fr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
                  <input type="tel" className="input" placeholder="06 12 34 56 78" />
                </div>
                {role === 'acheteur' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Société</label>
                      <input className="input" placeholder="Nom de votre société" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Profil</label>
                      <select className="input">
                        <option value="">Sélectionner…</option>
                        <option>Marchand de biens</option>
                        <option>Promoteur immobilier</option>
                        <option>Foncière</option>
                        <option>Investisseur privé</option>
                      </select>
                    </div>
                  </>
                )}
                {role === 'vendeur' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Statut professionnel</label>
                    <select className="input">
                      <option value="">Sélectionner…</option>
                      <option>Agent immobilier</option>
                      <option>Mandataire immobilier</option>
                      <option>Notaire</option>
                      <option>Autre</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
                  <input type="password" className="input" placeholder="Min. 8 caractères" />
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-400">
                  <input type="checkbox" className="mt-0.5 flex-shrink-0" required />
                  <span>J'accepte les <a href="#" className="text-gold-500 hover:underline">CGU</a> et la <a href="#" className="text-gold-500 hover:underline">politique de confidentialité</a></span>
                </div>
                <button type="submit" className="btn-primary w-full justify-center">
                  Créer mon compte
                </button>
              </form>
            </div>
          )}

          {/* Étape 3 : Confirmation */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Compte créé !</h2>
              <p className="text-gray-400 text-sm mb-8">Vérifiez votre email pour activer votre compte.</p>
              <Link
                href={role === 'vendeur' ? '/dashboard/vendeur' : '/dashboard/acheteur'}
                className="btn-primary"
              >
                Accéder à mon espace
              </Link>
            </div>
          )}

          {step < 3 && (
            <div className="mt-6 pt-6 border-t border-navy-700 text-center text-sm text-gray-400">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-gold-500 hover:underline font-medium">
                Se connecter
              </Link>
            </div>
          )}
        </div>

        {/* Indicateur d'étapes */}
        {step < 3 && (
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-gold-500' : 'bg-navy-700'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
