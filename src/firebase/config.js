import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBWN-o1zMqZ5DKj3zTRkHi0f9LSIWr-F58",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "guerrero-65fa4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "guerrero-65fa4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "guerrero-65fa4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "990889658118",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:990889658118:web:88cd42daa7d4f41187c087"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = initializeFirestore(app, { localCache: persistentLocalCache() })
export const storage = getStorage(app)
export default app
