import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBWN-o1zMqZ5DKj3zTRkHi0f9LSIWr-F58",
  authDomain: "guerrero-65fa4.firebaseapp.com",
  projectId: "guerrero-65fa4",
  storageBucket: "guerrero-65fa4.firebasestorage.app",
  messagingSenderId: "990889658118",
  appId: "1:990889658118:web:88cd42daa7d4f41187c087"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
