import { NextResponse } from 'next/server'
import { cleanMachine, requireAuth } from '../../../lib/api'
import { saveMachineFile } from '../../../lib/files'
import { logError } from '../../../lib/logger'
import { cleanStatus, cleanText } from '../../../lib/validation'
import { query } from '../../../lib/db'

export const runtime = 'nodejs'

async function insertHistory(machineId, action, details = '') {
  await query('insert into machine_history (machine_id, action, details) values (:machineId, :action, :details)', { machineId, action, details })
}

export async function GET(request) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  try {
    const status = cleanStatus(request.nextUrl.searchParams.get('status'))
    const rows = await query('select * from machines where status = :status order by id desc', { status })
    return NextResponse.json({ machines: rows.map(cleanMachine) })
  } catch (error) {
    logError(error, 'GET /api/machines')
    return NextResponse.json({ error: 'Nie udało się pobrać maszyn.' }, { status: 500 })
  }
}

export async function POST(request) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  try {
    const formData = await request.formData()
    const images = []

    for (let index = 0; index < 4; index += 1) {
      images[index] = await saveMachineFile(formData.get(`image${index + 1}`), index)
    }

    const data = {
      name: cleanText(formData.get('name'), 255),
      index_number: cleanText(formData.get('index_number'), 100),
      purchase_price: cleanText(formData.get('purchase_price'), 100),
      vat_price: cleanText(formData.get('vat_price'), 100),
      gross_price: cleanText(formData.get('gross_price'), 100),
      description: cleanText(formData.get('description'), 5000),
      note: cleanText(formData.get('note'), 2000),
      image1: images[0] || '',
      image2: images[1] || '',
      image3: images[2] || '',
      image4: images[3] || '',
      status: 'available',
    }

    if (!data.name) return NextResponse.json({ error: 'Wpisz nazwę maszyny.' }, { status: 400 })

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
  } catch (error) {
    logError(error, 'POST /api/machines')
    return NextResponse.json({ error: error.message || 'Nie udało się zapisać maszyny.' }, { status: 400 })
  }
}

