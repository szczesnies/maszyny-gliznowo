import { NextResponse } from 'next/server'
import { readSession } from '../../../../lib/session'

export async function GET(request) {
  const session = readSession(request)
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })
  return NextResponse.json({ authenticated: true, email: session.email })
}

