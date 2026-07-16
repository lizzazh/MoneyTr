import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const env = loadEnv('production', rootDir, '')

const requiredFirebaseEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

let missing = false

for (const key of requiredFirebaseEnvKeys) {
  if (!env[key]) {
    console.error(`❌ Error: Missing required environment variable: ${key}`)
    missing = true
  }
}

if (missing) {
  console.error('\nPlease ensure these variables are defined in your .env.local file.')
  process.exit(1)
} else {
  console.log('✅ Environment variables validated successfully.')
}
