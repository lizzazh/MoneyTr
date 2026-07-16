const fs = require('fs');
const txt = fs.readFileSync('old_index.js', 'utf8');

const match = txt.match(/apiKey:['"]?([^'",}]+)['"]?,authDomain:['"]?([^'",}]+)['"]?,projectId:['"]?([^'",}]+)['"]?,storageBucket:['"]?([^'",}]+)['"]?,messagingSenderId:['"]?([^'",}]+)['"]?,appId:['"]?([^'",}]+)['"]?/);

if (match) {
  console.log(`VITE_FIREBASE_API_KEY=${match[1]}`);
  console.log(`VITE_FIREBASE_AUTH_DOMAIN=${match[2]}`);
  console.log(`VITE_FIREBASE_PROJECT_ID=${match[3]}`);
  console.log(`VITE_FIREBASE_STORAGE_BUCKET=${match[4]}`);
  console.log(`VITE_FIREBASE_MESSAGING_SENDER_ID=${match[5]}`);
  console.log(`VITE_FIREBASE_APP_ID=${match[6]}`);
} else {
  const apiKeyMatch = txt.match(/apiKey:['"]?([^'",}]+)['"]?/);
  console.log('API Key match separately:', apiKeyMatch ? apiKeyMatch[1] : 'not found');
}
