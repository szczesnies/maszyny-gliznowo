import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/api'
import { logError } from '../../../../../lib/logger'
import { query } from '../../../../../lib/db'

export const runtime = 'nodejs'

export async function GET(request, { params }) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  try {
    const { id } = await params
    const rows = await query('select * from machine_history where machine_id = :id order by created_at desc limit 30', { id })
    return NextResponse.json({ history: rows })
  } catch (error) {
    logError(error, 'GET /api/machines/[id]/history')
    return NextResponse.json({ history: [] })
  }
}

