import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBpiq3EvurI917GaTS4gZQGVU71ecD09qE",
  authDomain: "namapps-production.firebaseapp.com",
  projectId: "namapps-production",
  storageBucket: "namapps-production.firebasestorage.app",
  messagingSenderId: "138371124433",
  appId: "1:138371124433:web:9f577d239a41c9150649f0",
  measurementId: "G-DRRDY0K3EC"
}

// Debug: Log the configuration (without the API key for security)
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : 'undefined'
})

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage } 