import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { Loader2 } from 'lucide-react'

const FAMILY_CODE = import.meta.env.VITE_FAMILY_CODE || ''

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [familyCode, setFamilyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Correo o contraseña incorrectos',
        'auth/invalid-email': 'Correo inválido',
      }
      setError(messages[err.code] || 'Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (FAMILY_CODE && familyCode.trim().toUpperCase() !== FAMILY_CODE.toUpperCase()) {
      setError('Código familiar incorrecto')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'Ya existe una cuenta con este correo, inicia sesión',
        'auth/invalid-email': 'Correo inválido',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      }
      setError(messages[err.code] || 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Escribe tu correo primero'); return }
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(auth, email)
      setError('')
      alert('Se envió un correo para restablecer tu contraseña')
    } catch (e) { setError('Error al enviar correo de recuperación') }
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row" style={{ background: '#FFFDF7' }}>
      {/* Left — Navy monogram panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: '#152238' }}>
        {/* Gold line separator */}
        <div className="absolute top-0 right-0 w-px h-full hidden sm:block" style={{ background: 'linear-gradient(to bottom, transparent, rgba(184,150,62,0.4), transparent)' }} />
        <div className="absolute bottom-0 left-0 w-full h-px sm:hidden" style={{ background: 'linear-gradient(to right, transparent, rgba(184,150,62,0.4), transparent)' }} />

        <h1 className="font-serif italic leading-none mb-4" style={{ fontSize: 'clamp(140px, 18vw, 220px)', color: '#E8C84A', fontWeight: 400 }}>
          G
        </h1>
        <div className="text-2xl mb-6" style={{ color: 'rgba(184,150,62,0.6)' }}>&#10086;</div>
        <p className="font-serif italic text-5xl mb-2" style={{ color: '#FFFDF7', fontWeight: 500 }}>Familia Guerrero</p>
        <p className="text-sm font-light uppercase tracking-[0.15em]" style={{ color: 'rgba(255,253,247,0.5)' }}>Preservando nuestro legado</p>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-10 sm:p-12" style={{ background: '#FFFDF7' }}>
        <div className="w-full max-w-[360px]">
          <h2 className="font-serif text-2xl mb-2" style={{ color: '#152238', fontWeight: 500 }}>
            {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
          </h2>
          <p className="text-sm font-light mb-10" style={{ color: 'rgba(21,34,56,0.6)' }}>
            {mode === 'login' ? 'Ingresa tus credenciales para acceder al archivo familiar.' : 'Regístrate con tu correo y el código que te compartieron.'}
          </p>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            {/* Email */}
            <div className="mb-6">
              <label className="block text-xs font-medium uppercase tracking-[0.1em] mb-2" style={{ color: 'rgba(21,34,56,0.5)' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full bg-transparent border-0 border-b-[1.5px] py-2.5 font-sans text-base outline-none transition-colors"
                style={{ borderColor: 'rgba(184,150,62,0.3)', color: '#152238' }}
                onFocus={(e) => e.target.style.borderColor = '#B8963E'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(184,150,62,0.3)'}
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-xs font-medium uppercase tracking-[0.1em] mb-2" style={{ color: 'rgba(21,34,56,0.5)' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-transparent border-0 border-b-[1.5px] py-2.5 font-sans text-base outline-none transition-colors"
                style={{ borderColor: 'rgba(184,150,62,0.3)', color: '#152238' }}
                onFocus={(e) => e.target.style.borderColor = '#B8963E'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(184,150,62,0.3)'}
              />
            </div>

            {/* Family code — solo en registro */}
            {mode === 'signup' && (
              <div className="mb-2 mt-4">
                <label className="block text-xs font-medium uppercase tracking-[0.1em] mb-2" style={{ color: 'rgba(21,34,56,0.5)' }}>
                  Código familiar
                </label>
                <input
                  type="text"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  required
                  placeholder="El que te compartieron por WhatsApp"
                  className="w-full bg-transparent border-0 border-b-[1.5px] py-2.5 font-sans text-base outline-none transition-colors"
                  style={{ borderColor: 'rgba(184,150,62,0.3)', color: '#152238' }}
                  onFocus={(e) => e.target.style.borderColor = '#B8963E'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(184,150,62,0.3)'}
                />
              </div>
            )}

            {/* Forgot password */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm transition-opacity hover:opacity-100"
                style={{ color: '#B8963E', opacity: 0.8 }}
              >
                Olvidé mi contraseña
              </button>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-center py-2 px-3 rounded-lg mt-4" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-3.5 font-sans text-sm font-medium uppercase tracking-[0.1em] transition-all hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-2"
              style={{ background: '#B8963E', color: '#FFFDF7', border: 'none' }}
              onMouseEnter={(e) => e.target.style.background = '#a07e2f'}
              onMouseLeave={(e) => e.target.style.background = '#B8963E'}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-light" style={{ color: 'rgba(21,34,56,0.6)' }}>
            {mode === 'login' ? (
              <>¿Primera vez? <button onClick={() => { setMode('signup'); setError('') }} className="underline" style={{ color: '#B8963E' }}>Crea tu cuenta</button></>
            ) : (
              <>¿Ya tienes cuenta? <button onClick={() => { setMode('login'); setError('') }} className="underline" style={{ color: '#B8963E' }}>Inicia sesión</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
