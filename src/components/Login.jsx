import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { doc, setDoc } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Lock, Mail, Loader2, UserPlus, LogIn, User, Phone, MapPin, X, Users } from 'lucide-react'

const inputStyle = "w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none transition"
const labelStyle = "block text-xs font-bold uppercase tracking-wide mb-1.5"

function InputField({ icon: Icon, label, color = '#C4704B', ...props }) {
  return (
    <div>
      <label className={labelStyle} style={{ color }}>{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 w-4 h-4" style={{ color: '#B8943E' }} />
        <input
          {...props}
          className={inputStyle}
          style={{ borderColor: '#E0D5C8', color: '#5D4037', backgroundColor: 'white' }}
          onFocus={(e) => e.target.style.borderColor = color}
          onBlur={(e) => e.target.style.borderColor = '#E0D5C8'}
        />
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  // Register form
  const [regStep, setRegStep] = useState(1)
  const [reg, setReg] = useState({
    name: '', nickname: '', phone: '', location: '', email: '', password: '', confirmPassword: '', relationship: '',
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contrasena incorrecta',
        'auth/invalid-credential': 'Correo o contrasena incorrectos',
        'auth/invalid-email': 'Correo invalido',
      }
      setError(messages[err.code] || 'Correo o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setRegError('')

    if (regStep === 1) {
      if (!reg.name.trim()) return setRegError('El nombre es obligatorio')
      setRegStep(2)
      return
    }

    if (regStep === 2) {
      if (!reg.email.trim()) return setRegError('El correo es obligatorio')
      if (!reg.password) return setRegError('La contrasena es obligatoria')
      if (reg.password.length < 6) return setRegError('La contrasena debe tener al menos 6 caracteres')
      if (reg.password !== reg.confirmPassword) return setRegError('Las contrasenas no coinciden')

      setRegLoading(true)
      try {
        const cred = await createUserWithEmailAndPassword(auth, reg.email, reg.password)
        await updateProfile(cred.user, { displayName: reg.name })

        // Save profile to Firestore
        await setDoc(doc(db, 'userProfiles', cred.user.uid), {
          name: reg.name,
          nickname: reg.nickname,
          phone: reg.phone,
          location: reg.location,
          email: reg.email,
          relationship: reg.relationship,
          createdAt: new Date().toISOString(),
        })
      } catch (err) {
        const messages = {
          'auth/email-already-in-use': 'Este correo ya tiene cuenta',
          'auth/weak-password': 'Contrasena muy debil (minimo 6 caracteres)',
          'auth/invalid-email': 'Correo invalido',
        }
        setRegError(messages[err.code] || 'Error al crear cuenta')
      } finally {
        setRegLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #FEF3E2 50%, #FDEBD3 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #C4704B, #B8943E)' }}>
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold" style={{ color: '#5D4037' }}>Familia Guerrero</h1>
          <p className="text-sm mt-1" style={{ color: '#8A7B6B' }}>Preservando nuestro legado</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: '#FFF8F0', border: '1px solid #E8D5C4' }}>
          <h2 className="text-lg font-bold text-center mb-5" style={{ color: '#5D4037' }}>Iniciar sesion</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <InputField icon={Mail} label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tucorreo@gmail.com" />
            <InputField icon={Lock} label="Contrasena" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Tu contrasena" />

            {error && (
              <p className="text-xs text-center py-2 px-3 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>{error}</p>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition hover:opacity-90" style={{ backgroundColor: '#C4704B' }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4" /> Entrar</>}
            </button>
          </form>

          {/* TODO: Descomentar cuando se abra el registro al publico */}
          {false && <><div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: '#E0D5C8' }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: '#B0A090' }}>o</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#E0D5C8' }} />
          </div>

          <button
            onClick={() => { setShowRegister(true); setRegStep(1); setRegError(''); setReg({ name: '', nickname: '', phone: '', location: '', email: '', password: '', confirmPassword: '', relationship: '' }) }}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{ backgroundColor: '#7A9E7E', color: 'white' }}
          >
            <UserPlus className="w-4 h-4" /> Soy nuevo, registrarme
          </button></>}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: '#B0A090' }}>Solo para miembros de la familia Guerrero</p>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: '#FFF8F0' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E8D5C4', background: 'linear-gradient(135deg, #C4704B15, #B8943E10)' }}>
                <div>
                  <h2 className="text-lg font-serif font-bold" style={{ color: '#5D4037' }}>Crear cuenta</h2>
                  <p className="text-[11px]" style={{ color: '#8A7B6B' }}>Paso {regStep} de 2</p>
                </div>
                <button onClick={() => setShowRegister(false)} className="p-1.5 rounded-full hover:bg-[#5D4037]/10 transition">
                  <X className="w-5 h-5" style={{ color: '#5D4037' }} />
                </button>
              </div>

              {/* Progress */}
              <div className="flex gap-2 px-6 pt-4">
                <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#C4704B' }} />
                <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: regStep >= 2 ? '#C4704B' : '#E0D5C8' }} />
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                {regStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="text-center mb-2">
                      <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#7A9E7E15' }}>
                        <User className="w-7 h-7" style={{ color: '#7A9E7E' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#5D4037' }}>Datos personales</p>
                      <p className="text-[11px]" style={{ color: '#8A7B6B' }}>Para que la familia te identifique</p>
                    </div>

                    <InputField icon={User} label="Nombre completo *" color="#7A9E7E" type="text" value={reg.name} onChange={(e) => setReg(p => ({ ...p, name: e.target.value }))} placeholder="Tu nombre completo" />
                    <InputField icon={Heart} label="Apodo" color="#7A9E7E" type="text" value={reg.nickname} onChange={(e) => setReg(p => ({ ...p, nickname: e.target.value }))} placeholder="Como te dicen (opcional)" />
                    <InputField icon={Phone} label="Telefono" color="#7A9E7E" type="tel" value={reg.phone} onChange={(e) => setReg(p => ({ ...p, phone: e.target.value }))} placeholder="Tu numero (opcional)" />
                    <InputField icon={MapPin} label="Donde vives" color="#7A9E7E" type="text" value={reg.location} onChange={(e) => setReg(p => ({ ...p, location: e.target.value }))} placeholder="Ciudad, Estado (opcional)" />

                    <div>
                      <label className={labelStyle} style={{ color: '#7A9E7E' }}>Parentesco</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 w-4 h-4" style={{ color: '#B8943E' }} />
                        <select
                          value={reg.relationship}
                          onChange={(e) => setReg(p => ({ ...p, relationship: e.target.value }))}
                          className={inputStyle}
                          style={{ borderColor: '#E0D5C8', color: '#5D4037', backgroundColor: 'white' }}
                        >
                          <option value="">Selecciona tu parentesco</option>
                          <option value="hijo">Hijo(a) de los abuelos</option>
                          <option value="nieto">Nieto(a)</option>
                          <option value="bisnieto">Bisnieto(a)</option>
                          <option value="esposo">Esposo(a) de familiar</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {regStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="text-center mb-2">
                      <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#C4704B15' }}>
                        <Lock className="w-7 h-7" style={{ color: '#C4704B' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#5D4037' }}>Datos de acceso</p>
                      <p className="text-[11px]" style={{ color: '#8A7B6B' }}>Para iniciar sesion</p>
                    </div>

                    {/* Show name summary */}
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#7A9E7E10', border: '1px solid #7A9E7E20' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7A9E7E20' }}>
                        <User className="w-5 h-5" style={{ color: '#7A9E7E' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#5D4037' }}>{reg.name}</p>
                        {reg.nickname && <p className="text-[11px]" style={{ color: '#7A9E7E' }}>"{reg.nickname}"</p>}
                      </div>
                    </div>

                    <InputField icon={Mail} label="Correo electronico *" type="email" value={reg.email} onChange={(e) => setReg(p => ({ ...p, email: e.target.value }))} placeholder="tucorreo@gmail.com" />
                    <InputField icon={Lock} label="Contrasena *" type="password" value={reg.password} onChange={(e) => setReg(p => ({ ...p, password: e.target.value }))} placeholder="Minimo 6 caracteres" />
                    <InputField icon={Lock} label="Confirmar contrasena *" type="password" value={reg.confirmPassword} onChange={(e) => setReg(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repite tu contrasena" />
                  </motion.div>
                )}

                {regError && (
                  <p className="text-xs text-center py-2 px-3 rounded-lg mt-3" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>{regError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: '#E8D5C4' }}>
                <button
                  onClick={() => regStep === 1 ? setShowRegister(false) : setRegStep(1)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
                  style={{ color: '#5D4037', border: '2px solid #E0D5C8' }}
                >
                  {regStep === 1 ? 'Cancelar' : 'Atras'}
                </button>
                <button
                  onClick={handleRegister}
                  disabled={regLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
                  style={{ backgroundColor: regStep === 1 ? '#7A9E7E' : '#C4704B' }}
                >
                  {regLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : regStep === 1 ? (
                    'Siguiente'
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Crear cuenta</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
