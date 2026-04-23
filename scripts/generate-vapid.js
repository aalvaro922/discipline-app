#!/usr/bin/env node
// Genera claves VAPID para Web Push
// Ejecuta: node scripts/generate-vapid.js

const webpush = require('web-push')
const keys = webpush.generateVAPIDKeys()

console.log('\n✅ VAPID Keys generadas. Copia estas líneas en tu .env.local:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_EMAIL=mailto:tu@email.com`)
console.log('\n⚠️  Nunca publiques VAPID_PRIVATE_KEY en repositorios públicos.\n')
