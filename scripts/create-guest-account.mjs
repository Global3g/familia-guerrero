// Script de un solo uso: crea la cuenta compartida para invitados.
// Uso: node scripts/create-guest-account.mjs
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyBWN-o1zMqZ5DKj3zTRkHi0f9LSIWr-F58',
  authDomain: 'guerrero-65fa4.firebaseapp.com',
  projectId: 'guerrero-65fa4',
  storageBucket: 'guerrero-65fa4.firebasestorage.app',
  messagingSenderId: '990889658118',
  appId: '1:990889658118:web:88cd42daa7d4f41187c087',
}

const GUEST_EMAIL = 'familiar@guerrero.com'
const GUEST_PASSWORD = 'Guerrero2026'
const GUEST_DISPLAY_NAME = 'Familiar Guerrero'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

try {
  const cred = await createUserWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD)
  await updateProfile(cred.user, { displayName: GUEST_DISPLAY_NAME })
  console.log('✅ Cuenta creada:', cred.user.email, '— uid:', cred.user.uid)
} catch (err) {
  if (err.code === 'auth/email-already-in-use') {
    console.log('ℹ️  La cuenta ya existe. No se creó de nuevo.')
  } else {
    console.error('❌ Error:', err.code, err.message)
    process.exit(1)
  }
}
process.exit(0)
