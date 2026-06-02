'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function RegisterForm() {
  const params = useSearchParams()
  const router = useRouter()
  const defaultRole = params.get('role') || ''
  const [role, setRole] = useState<'vendeur' | 'acheteur' | ''>(defaultRole as any)
  const [step, setStep] = useState(1)

  // Champs du formulaire
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [profil, setProfil] = useState('')
  const [statut, setStatut] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleRegister called', { email, password })
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          phone,
          company,
          profil,
          statut,
          role
        }
      }
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setStep(3)
  }

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
        </div>
        <div className="card">
          {/* Étape 1 */}
          {step === 1 && (
            <div>
              <h2 className="font-semibold text-center mb-6">Vous êtes…</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setRole('vendeur')}
                  className={`p-5 rounded-xl border-2 transition-all text-center ${
                    role === 'vendeur'
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-navy-600 hover:border-navy-500'
                  }`}
                >
                  <Building2 className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold">Apporteur</div>
                </button>
                <button
                  onClick={() => setRole('acheteur')}
                  className={`p-5 rounded-xl border-2 transition-all text-center ${
                    role === 'acheteur'
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-navy-600 hover:border-navy-500'
                  }`}
                >
                  <Users className="w-8 h-8 mx-auto mb-3" />
                  <div className="font-semibold">Acheteur pro</div>
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

          {/* Étape 2 */}
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
              <form onSubmit={handleRegister} className="space-y-4">
                {errorMessage && (
                  <div className="text-red-500 text-sm">{errorMessage}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <input className="input" placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  <input className="input" placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
                <input type="email" className="input" placeholder="Email professionnel" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="tel" className="input" placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} required />
                {role === 'acheteur' && (
                  <>
                    <input className="input" placeholder="Société" value={company} onChange={e => setCompany(e.target.value)} />
                    <select className="input" value={profil} onChange={e => setProfil(e.target.value)}>
                      <option value="">Profil…</option>
                      <option>Marchand de biens</option>
                      <option>Promoteur immobilier</option>
                      <option>Foncière</option>
                      <option>Investisseur privé</option>
                    </select>
                  </>
                )}
                {role === 'vendeur' && (
                  <select className="input" value={statut} onChange={e => setStatut(e.target.value)}>
                    <option value="">Statut…</option>
                    <option>Agent immobilier</option>
                    <option>Mandataire immobilier</option>
                    <option>Notaire</option>
                    <option>Autre</option>
                  </select>
                )}
                <input type="password" className="input" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                  {loading ? 'Création…' : 'Créer mon compte'}
                </button>
              </form>
            </div>
          )}

          {/* Étape 3 */}
          {step === 3 && (
            <div className="text-center py-6">
              <h2 className="text-xl font-bold mb-2">Compte créé !</h2>
              <p className="text-gray-400 text-sm mb-8">Vérifiez votre email pour activer votre compte.</p>
              <Link href="/auth/login" className="btn-primary">Se connecter</Link>
            </div>
          )}
        </div>
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


