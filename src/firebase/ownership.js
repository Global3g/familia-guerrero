import { auth } from './config'
import { ADMIN_EMAIL } from './useAuth'

// Cada quien edita o borra solo lo que escribió (el admin, todo).
// Las reglas de Firestore lo hacen cumplir; esto solo esconde los botones.
export const authorUidFor = (existing) => existing?.authorUid || auth.currentUser?.uid

export const canEdit = (item) =>
  auth.currentUser?.email === ADMIN_EMAIL
  || (!!item?.authorUid && item.authorUid === auth.currentUser?.uid)
