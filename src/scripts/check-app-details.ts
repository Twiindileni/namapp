import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

async function checkAppDetails() {
  try {
    const appId = 'Nh4tbKInlsZnLjwuEzbt'
    const appRef = doc(db, 'apps', appId)
    const appDoc = await getDoc(appRef)
    
    if (appDoc.exists()) {
      const data = appDoc.data()
      console.log('App details:', {
        id: appDoc.id,
        ...data
      })
    } else {
      console.log('App not found')
    }
  } catch (error) {
    console.error('Error checking app details:', error)
  }
}

checkAppDetails() 