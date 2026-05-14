import { mkdir, unlink, writeFile } from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'

const uploadRoot = process.env.UPLOAD_DIR || path.join('public', 'uploads', 'machines')
const publicPrefix = process.env.UPLOAD_PUBLIC_PREFIX || '/uploads/machines'

function safeName(name) {
  return String(name || 'image')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
}

export async function saveMachineFile(file, index = 0) {
  if (!file || !file.size) return ''

  await mkdir(uploadRoot, { recursive: true })
  const extension = path.extname(file.name || '') || '.jpg'
  const fileName = `${Date.now()}-${index}-${crypto.randomUUID()}-${safeName(file.name || `image${extension}`)}`
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadRoot, fileName), bytes)
  return `${publicPrefix}/${fileName}`
}

export async function deleteMachineFile(publicUrl) {
  if (!publicUrl || !String(publicUrl).startsWith(publicPrefix)) return

  const fileName = path.basename(publicUrl)
  if (!fileName) return

  try {
    await unlink(path.join(uploadRoot, fileName))
  } catch {
    // The database update should not fail only because an old image file is already gone.
  }
}
