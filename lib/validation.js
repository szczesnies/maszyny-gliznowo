export const maxImageSize = Number(process.env.MAX_IMAGE_SIZE || 5 * 1024 * 1024)
export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function cleanText(value, maxLength = 5000) {
  return String(value || '').trim().replace(/\0/g, '').slice(0, maxLength)
}

export function cleanStatus(value) {
  return value === 'sold' ? 'sold' : 'available'
}

export function validateImageFile(file) {
  if (!file || !file.size) return null
  if (!allowedImageTypes.includes(file.type)) return 'Dozwolone są tylko zdjęcia JPG, PNG, WEBP lub GIF.'
  if (file.size > maxImageSize) return `Zdjęcie jest za duże. Maksymalny rozmiar to ${Math.round(maxImageSize / 1024 / 1024)} MB.`
  return null
}

