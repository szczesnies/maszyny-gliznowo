import { NextResponse } from 'next/server'
import { createSession, sessionCookie, validLogin } from '../../../../lib/session'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!validLogin(email, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookie(createSession(email)))
  return response
}

