import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './config'

const ADMIN_EMAIL = 'gusguecas@gmail.com'

export function useAuth() {
  const [user, setUser] = useState(auth.currentUser)
  const [loading, setLoading] = useState(!auth.currentUser)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return {
    user,
    loading,
    isAdmin: user?.email === ADMIN_EMAIL,
    isGuest: !!user && user?.email !== ADMIN_EMAIL,
  }
}

export { ADMIN_EMAIL }
