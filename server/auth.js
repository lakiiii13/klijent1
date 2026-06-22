import { getAdminSession, deleteAdminSession } from './db.js'

export const SESSION_COOKIE = 'la_vie_admin'

export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  return password === expected
}

export function authMiddleware(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE]
  const session = getAdminSession(sessionId)

  if (!session) {
    return res.status(401).json({ error: 'Niste prijavljeni. Ulogujte se ponovo.' })
  }

  req.adminSession = session
  next()
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

export function logoutSession(req, res) {
  const sessionId = req.cookies?.[SESSION_COOKIE]
  deleteAdminSession(sessionId)
  clearSessionCookie(res)
}
