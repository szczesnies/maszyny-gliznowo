import { NextResponse } from 'next/server'
import { expiredSessionCookie } from '../../../../lib/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(expiredSessionCookie())
  return response
}

