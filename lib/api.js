import { NextResponse } from 'next/server'
import { isAuthorized } from './session'

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function requireAuth(request) {
  if (!isAuthorized(request)) return unauthorized()
  return null
}

export function cleanMachine(row) {
  if (!row) return null
  return {
    ...row,
    id: Number(row.id),
    name: row.name || '',
    index_number: row.index_number || '',
    purchase_price: row.purchase_price || '',
    vat_price: row.vat_price || '',
    gross_price: row.gross_price || '',
    description: row.description || '',
    note: row.note || '',
    image1: row.image1 || '',
    image2: row.image2 || '',
    image3: row.image3 || '',
    image4: row.image4 || '',
    status: row.status || 'available',
  }
}

