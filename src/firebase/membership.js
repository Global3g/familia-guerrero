import { doc, setDoc } from 'firebase/firestore'
import { db } from './config'

// El código NO vive en la app: las reglas de Firestore lo comparan contra
// config/familyCode, que nadie puede leer. Si no coincide, Firestore rechaza.
// Al crearse la cuenta, App cambia de pantalla antes de que el registro
// termine; este aviso viaja a JoinFamily si el código no pasó.
let codeRejected = false
export const markCodeRejected = () => {
  codeRejected = true
  window.dispatchEvent(new Event('family-code-rejected'))
}
export const takeCodeRejected = () => { const r = codeRejected; codeRejected = false; return r }

export async function joinFamily(user, code) {
  await setDoc(doc(db, 'members', user.uid), {
    code: code.trim().toUpperCase(),
    name: user.displayName || '',
    email: user.email || '',
    joinedAt: new Date().toISOString(),
  })
}
