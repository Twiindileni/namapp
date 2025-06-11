const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBpiq3EvurI917GaTS4gZQGVU71ecD09qE",
  authDomain: "namapps-production.firebaseapp.com",
  projectId: "namapps-production",
  storageBucket: "namapps-production.firebasestorage.app",
  messagingSenderId: "138371124433",
  appId: "1:138371124433:web:9f577d239a41c9150649f0",
  measurementId: "G-DRRDY0K3EC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setAdminPrivileges() {
  try {
    // Get the current user's email and password
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Please provide email and password as arguments');
      console.error('Usage: node set-admin.js <email> <password>');
      process.exit(1);
    }

    // Sign in with the provided credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's role to admin in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      role: 'admin',
      permissions: ['manage_users', 'manage_apps', 'view_analytics'],
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('Admin privileges have been set successfully!');
    console.log('You can now access the admin dashboard.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setAdminPrivileges(); 