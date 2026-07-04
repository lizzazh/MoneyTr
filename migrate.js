import { initializeApp } from 'firebase/admin/app';
import { getFirestore } from 'firebase/admin/firestore';
import { readFileSync } from 'fs';

// To run this, we need service account credentials, or we can just use the client SDK?
// Wait, client SDK doesn't have permissions to read ALL connections unless rules allow.
// But wait! We can just use the client SDK with the user's login? No, the user can only read their own.
