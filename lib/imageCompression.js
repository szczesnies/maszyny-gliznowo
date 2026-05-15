const maxWidth = 1600
const maxHeight = 1200
const jpegQuality = 0.78

function canCompress(file) {
  return file && file.type?.startsWith('image/') && file.type !== 'image/gif'
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Nie udało się skompresować zdjęcia.'))
    }, type, quality)
  })
}

export async function compressImageFile(file) {
  if (!canCompress(file)) return file

  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
  const width = Math.max(1, Math.round(bitmap.width * ratio))
  const height = Math.max(1, Math.round(bitmap.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { alpha: false })
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await canvasToBlob(canvas, outputType, outputType === 'image/jpeg' ? jpegQuality : undefined)

  if (blob.size >= file.size) return file

  const extension = outputType === 'image/png' ? 'png' : 'jpg'
  const originalName = file.name?.replace(/\.[^.]+$/, '') || 'zdjecie'
  return new File([blob], `${originalName}-web.${extension}`, { type: outputType, lastModified: Date.now() })
}

export async function compressImageFiles(files, onProgress) {
  const selected = Array.from(files || []).slice(0, 4)
  const compressed = []

  for (let index = 0; index < selected.length; index += 1) {
    onProgress?.(index + 1, selected.length)
    compressed.push(await compressImageFile(selected[index]))
  }

  return compressed
}

