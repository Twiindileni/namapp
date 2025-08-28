import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

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

async function createAdminUser() {
  try {
    const email = 'admin@namapps.com'
    const password = 'admin123'
    const name = 'Admin User'

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create admin document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: ['manage_users', 'manage_apps', 'view_analytics']
    })

    console.log('Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

createAdminUser() 