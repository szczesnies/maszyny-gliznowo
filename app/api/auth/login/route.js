import { NextResponse } from 'next/server'
import { createSession, sessionCookie, validLogin } from '../../../../lib/session'
import { cleanText } from '../../../../lib/validation'

export const runtime = 'nodejs'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const email = cleanText(body.email, 255).toLowerCase()
  const password = cleanText(body.password, 255)

  if (!validLogin(email, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookie(createSession(email)))
  return response
}

