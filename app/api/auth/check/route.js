import { NextResponse } from 'next/server'
import { readSession, refreshSessionCookie } from '../../../../lib/session'

export const runtime = 'nodejs'

export async function GET(request) {
  const session = readSession(request)
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })
  const response = NextResponse.json({ authenticated: true })
  response.cookies.set(refreshSessionCookie(session.email))
  return response
}
