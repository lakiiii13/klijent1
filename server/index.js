import 'dotenv/config'
import app from './app.js'
import { verifyEmailConnection, isEmailConfigured } from './email.js'
import { isSupabaseConfigured } from './db.js'

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, async () => {
  console.log(`\n🌸 La Vie API → port ${PORT}`)
  console.log(`   Baza: ${isSupabaseConfigured() ? 'Supabase' : 'NIJE PODEŠENA'}`)
  console.log(`   SITE_URL: ${process.env.SITE_URL || '(nije podešen)'}`)

  if (!isEmailConfigured()) {
    console.warn('   ⚠️  Email nije podešen — dodaj BREVO_API_KEY u .env')
  } else {
    const email = await verifyEmailConnection()
    console.log(email.ok ? `   ✅ Email [${email.provider}]` : `   ❌ Email: ${email.error}`)
  }
  console.log('')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} je zauzet! Pokreni ponovo: npm run dev\n`)
  } else {
    console.error(err)
  }
  process.exit(1)
})
