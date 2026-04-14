import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBpiq3EvurI917GaTS4gZQGVU71ecD09qE",
  authDomain: "namapps-production.firebaseapp.com",
  projectId: "namapps-production",
  storageBucket: "namapps-production.firebasestorage.app",
  messagingSenderId: "138371124433",
  appId: "1:138371124433:web:9f577d239a41c9150649f0",
  measurementId: "G-DRRDY0K3EC"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function verifyAndCreateAdmin() {
  try {
    // Try to sign in with admin credentials
    const email = 'admin@namapps.com'
    const password = 'admin123'
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        // Create admin document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          name: 'Admin User',
          email: email,
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: ['manage_users', 'manage_apps', 'view_analytics']
        })
        console.log('Admin user document created in Firestore')
      } else {
        // Update role to admin if it's not already
        const userData = userDoc.data()
        if (userData.role !== 'admin') {
          await setDoc(doc(db, 'users', user.uid), {
            ...userData,
            role: 'admin',
            updatedAt: new Date().toISOString()
          }, { merge: true })
          console.log('User role updated to admin')
        } else {
          console.log('Admin user already exists and has correct role')
        }
      }
    } catch (error) {
      // If sign in fails, create new admin user
      console.log('Creating new admin user...')
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Create admin document
      await setDoc(doc(db, 'users', user.uid), {
        name: 'Admin User',
        email: email,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: ['manage_users', 'manage_apps', 'view_analytics']
      })
      console.log('New admin user created successfully')
    }
    
    console.log('Admin verification complete')
  } catch (error) {
    console.error('Error:', error)
  }
}

verifyAndCreateAdmin() 