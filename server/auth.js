import { getAdminSession, deleteAdminSession } from './db.js'

export const SESSION_COOKIE = 'la_vie_admin'

export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  return password === expected
}

export async function authMiddleware(req, res, next) {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE]
    const session = await getAdminSession(sessionId)

    if (!session) {
      return res.status(401).json({ error: 'Niste prijavljeni. Ulogujte se ponovo.' })
    }

    req.adminSession = session
    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri autentifikaciji.' })
  }
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

export async function logoutSession(req, res) {
  const sessionId = req.cookies?.[SESSION_COOKIE]
  await deleteAdminSession(sessionId)
  clearSessionCookie(res)
}
