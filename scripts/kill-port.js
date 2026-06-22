import { execSync } from 'child_process'

const PORT = process.env.PORT || 3001

try {
  const out = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const line = out.trim().split('\n')[0]
  const pid = line?.trim().split(/\s+/).pop()
  if (pid && pid !== '0') {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
    console.log(`\n♻️  Ugašen stari server na portu ${PORT} (PID ${pid})\n`)
  }
} catch {
  // port slobodan
}
