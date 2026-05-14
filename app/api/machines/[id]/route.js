import { NextResponse } from 'next/server'
import { cleanMachine, requireAuth } from '../../../../lib/api'
import { deleteMachineFile, saveMachineFile } from '../../../../lib/files'
import { logError } from '../../../../lib/logger'
import { cleanStatus, cleanText } from '../../../../lib/validation'
import { query } from '../../../../lib/db'

export const runtime = 'nodejs'

const fields = ['name', 'index_number', 'purchase_price', 'vat_price', 'gross_price', 'description', 'note', 'status']

async function machineById(id) {
  const rows = await query('select * from machines where id = :id limit 1', { id })
  return cleanMachine(rows[0])
}

async function insertHistory(machineId, action, details = '') {
  await query('insert into machine_history (machine_id, action, details) values (:machineId, :action, :details)', { machineId, action, details })
}

function cleanField(field, value) {
  if (field === 'status') return cleanStatus(value)
  if (field === 'description') return cleanText(value, 5000)
  if (field === 'note') return cleanText(value, 2000)
  if (field === 'name') return cleanText(value, 255)
  return cleanText(value, 100)
}

function changedDetails(before, updates) {
  const labels = {
    name: 'Nazwa',
    index_number: 'Indeks',
    purchase_price: 'Cena kupna',
    vat_price: 'Cena netto',
    gross_price: 'Cena brutto',
    description: 'Opis',
    note: 'Notatka',
  }

  return Object.entries(labels)
    .filter(([key]) => Object.hasOwn(updates, key) && String(before[key] || '') !== String(updates[key] || ''))
    .map(([key, label]) => `${label} zmieniono z ${before[key] || '-'} na ${updates[key] || '-'}.`)
    .join('\n')
}

async function parseUpdates(request, machine) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const updates = {}
    const deletedImages = []

    fields.forEach((field) => {
      if (formData.has(field)) updates[field] = cleanField(field, formData.get(field))
    })

    for (let index = 1; index <= 4; index += 1) {
      const currentKey = `image${index}`
      const file = formData.get(currentKey)

      if (formData.get(`delete_image${index}`) === 'true') {
        updates[currentKey] = ''
        deletedImages.push(machine[currentKey])
      }

      if (file && file.size) {
        updates[currentKey] = await saveMachineFile(file, index - 1)
        deletedImages.push(machine[currentKey])
      }
    }

    return {
      updates,
      deletedImages,
      historyAction: cleanText(formData.get('history_action'), 255),
      historyDetails: cleanText(formData.get('history_details'), 5000),
    }
  }

  const body = await request.json().catch(() => ({}))
  const updates = {}
  fields.forEach((field) => {
    if (Object.hasOwn(body, field)) updates[field] = cleanField(field, body[field])
  })

  return {
    updates,
    deletedImages: [],
    historyAction: cleanText(body.history_action, 255),
    historyDetails: cleanText(body.history_details, 5000),
  }
}

export async function GET(request, { params }) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  try {
    const { id } = await params
    const machine = await machineById(id)
    if (!machine) return NextResponse.json({ error: 'Nie znaleziono maszyny.' }, { status: 404 })
    return NextResponse.json({ machine })
  } catch (error) {
    logError(error, 'GET /api/machines/[id]')
    return NextResponse.json({ error: 'Nie udało się pobrać maszyny.' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  try {
    const { id } = await params
    const machine = await machineById(id)
    if (!machine) return NextResponse.json({ error: 'Nie znaleziono maszyny.' }, { status: 404 })

    const { updates, deletedImages, historyAction, historyDetails } = await parseUpdates(request, machine)
    if (Object.keys(updates).length === 0) return NextResponse.json({ machine })

    const setSql = Object.keys(updates).map((key) => `${key} = :${key}`).join(', ')
    await query(`update machines set ${setSql}, updated_at = current_timestamp where id = :id`, { ...updates, id })
    await Promise.all(deletedImages.filter(Boolean).map(deleteMachineFile))

    const action = historyAction || (updates.status === 'sold' ? 'Archiwizacja' : updates.status === 'available' ? 'Przywrócenie' : 'Edycja maszyny')
    const details = historyDetails || changedDetails(machine, updates) || 'Zapisano zmiany.'
    await insertHistory(id, action, details)

    return NextResponse.json({ machine: await machineById(id) })
  } catch (error) {
    logError(error, 'PATCH /api/machines/[id]')
    return NextResponse.json({ error: error.message || 'Nie udało się zapisać zmian.' }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const blocked = requireAuth(request)
  if (blocked) return blocked

  try {
    const { id } = await params
    const machine = await machineById(id)
    if (!machine) return NextResponse.json({ error: 'Nie znaleziono maszyny.' }, { status: 404 })

    await insertHistory(id, 'Usunięcie trwałe', 'Maszyna została usunięta z archiwum')
    await query('delete from machines where id = :id', { id })
    await Promise.all([machine.image1, machine.image2, machine.image3, machine.image4].filter(Boolean).map(deleteMachineFile))

    return NextResponse.json({ ok: true })
  } catch (error) {
    logError(error, 'DELETE /api/machines/[id]')
    return NextResponse.json({ error: 'Nie udało się usunąć maszyny.' }, { status: 500 })
  }
}

