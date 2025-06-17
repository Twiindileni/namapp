import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBSDYQoVhoDXDy1l9LvSluhmZBwfJ3U8Wo",
  authDomain: "namapps-production-c738c.firebaseapp.com",
  projectId: "namapps-production-c738c",
  storageBucket: "namapps-production-c738c.appspot.com",
  messagingSenderId: "252587075978",
  appId: "1:252587075978:android:1e07fd805f7f5e3a610073"
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