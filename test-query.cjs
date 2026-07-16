require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    await signInAnonymously(auth);
    console.log('Signed in anonymously:', auth.currentUser.uid);

    const connectionsCol = collection(db, 'connections');
    const q = query(connectionsCol, where('inviteCode', '==', 'TEST-1234'), where('status', '==', 'pending_invite'));
    console.log('Running query...');
    const snap = await getDocs(q);
    console.log('Query success! Docs found:', snap.size);
  } catch (error) {
    console.error('Query failed:', error);
  }
  process.exit(0);
}

test();
