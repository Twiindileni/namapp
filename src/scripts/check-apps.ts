import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

async function checkApps() {
  try {
    const appsRef = collection(db, 'apps')
    const snapshot = await getDocs(appsRef)
    
    console.log('Total apps:', snapshot.size)
    
    snapshot.forEach(doc => {
      const data = doc.data()
      console.log('App:', {
        id: doc.id,
        name: data.name,
        status: data.status,
        downloads: data.downloads
      })
    })
  } catch (error) {
    console.error('Error checking apps:', error)
  }
}

checkApps() 