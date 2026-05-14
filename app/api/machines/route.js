import { NextResponse } from 'next/server'
import { cleanMachine, requireAuth } from '../../../lib/api'
import { saveMachineFile } from '../../../lib/files'
import { query } from '../../../lib/db'

export const runtime = 'nodejs'

async function insertHistory(machineId, action, details = '') {
  await query(
    'insert into machine_history (machine_id, action, details) values (:machineId, :action, :details)',
    { machineId, action, details }
  )
}

export async function GET(request) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  const status = request.nextUrl.searchParams.get('status') || 'available'
  const rows = await query(
    'select * from machines where status = :status order by id desc',
    { status }
  )

  return NextResponse.json({ machines: rows.map(cleanMachine) })
}

export async function POST(request) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  const formData = await request.formData()
  const images = []

  for (let index = 0; index < 4; index += 1) {
    images[index] = await saveMachineFile(formData.get(`image${index + 1}`), index)
  }

  const data = {
    name: String(formData.get('name') || '').trim(),
    index_number: String(formData.get('index_number') || '').trim(),
    purchase_price: String(formData.get('purchase_price') || '').trim(),
    vat_price: String(formData.get('vat_price') || '').trim(),
    gross_price: String(formData.get('gross_price') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    note: String(formData.get('note') || '').trim(),
    image1: images[0] || '',
    image2: images[1] || '',
    image3: images[2] || '',
    image4: images[3] || '',
    status: 'available',
  }

  if (!data.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const result = await query(
    `insert into machines
      (name, index_number, purchase_price, vat_price, gross_price, description, note, image1, image2, image3, image4, status)
     values
      (:name, :index_number, :purchase_price, :vat_price, :gross_price, :description, :note, :image1, :image2, :image3, :image4, :status)`,
    data
  )

  const id = Number(result.insertId)
  await insertHistory(id, 'Dodano maszynę', `Nazwa: ${data.name}`)

  return NextResponse.json({ id }, { status: 201 })
}

