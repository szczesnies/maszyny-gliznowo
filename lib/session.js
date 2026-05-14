import crypto from 'node:crypto'

const cookieName = 'maszyny_session'
const maxAgeSeconds = 60 * 60 * 24 * 30

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error('Missing AUTH_SECRET environment variable')
  return value
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '')
}

export function configuredUsers() {
  const usersJson = cleanEnvValue(process.env.APP_USERS)
  if (usersJson) {
    try {
      const parsed = JSON.parse(usersJson)
      if (Array.isArray(parsed)) {
        return parsed.map((user) => ({
          email: cleanEnvValue(user.email),
          password: cleanEnvValue(user.password),
        }))
      }
    } catch {
      // Fall back to ADMIN_EMAIL/ADMIN_PASSWORD when APP_USERS is malformed.
    }
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    return [{ email: cleanEnvValue(process.env.ADMIN_EMAIL), password: cleanEnvValue(process.env.ADMIN_PASSWORD) }]
  }

  return []
}

export function validLogin(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const rawPassword = String(password || '').trim()

  return configuredUsers().some((user) => {
    const userEmail = String(user.email || '').trim().toLowerCase()
    const userPassword = String(user.password || '')
    return timingSafeEqualText(normalizedEmail, userEmail) && timingSafeEqualText(rawPassword, userPassword)
  })
}

export function authDiagnostics() {
  const users = configuredUsers()

  return {
    hasAuthSecret: Boolean(cleanEnvValue(process.env.AUTH_SECRET)),
    hasAdminEmail: Boolean(cleanEnvValue(process.env.ADMIN_EMAIL)),
    hasAdminPassword: Boolean(cleanEnvValue(process.env.ADMIN_PASSWORD)),
    hasAppUsers: Boolean(cleanEnvValue(process.env.APP_USERS)),
    userCount: users.length,
    emails: users.map((user) => cleanEnvValue(user.email)).filter(Boolean),
  }
}

export function createSession(email) {
  const payload = encode({
    email: String(email || '').trim().toLowerCase(),
    exp: Date.now() + maxAgeSeconds * 1000,
  })

  return `${payload}.${sign(payload)}`
}

export function readSession(request) {
  const token = request.cookies.get(cookieName)?.value
  if (!token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature || !timingSafeEqualText(signature, sign(payload))) return null

  try {
    const session = decode(payload)
    if (!session.exp || Date.now() > session.exp) return null
    return session
  } catch {
    return null
  }
}

export function sessionCookie(token) {
  return {
    name: cookieName,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export function expiredSessionCookie() {
  return {
    name: cookieName,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }
}

export function isAuthorized(request) {
  return Boolean(readSession(request))
}
