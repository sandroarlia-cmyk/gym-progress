import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB6YY_lcZSoEHEjwiJxAzHO7inKdYuAqoQ",
  authDomain: "allenamento-palestra-pesi-2.firebaseapp.com",
  projectId: "allenamento-palestra-pesi-2",
  storageBucket: "allenamento-palestra-pesi-2.firebasestorage.app",
  messagingSenderId: "205798196468",
  appId: "1:205798196468:web:3037da5d41af79c212caa1"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
