// Compress a photo to a JPEG data URL so report images stay small
// (~100-300 KB) and fit comfortably in the free database tier.
const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.8
const MAX_PDF_BYTES = 5 * 1024 * 1024

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export async function prepareReportFile(file) {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF_BYTES) throw new Error('PDF too large (max 5 MB)')
    return { mime: 'application/pdf', dataUrl: await fileToDataUrl(file) }
  }
  if (!file.type.startsWith('image/')) throw new Error('Only images and PDFs are supported')

  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return { mime: 'image/jpeg', dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY) }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = src
  })
}

// Split "data:image/jpeg;base64,AAAA" into parts for storage.
export function splitDataUrl(dataUrl) {
  const [head, data] = dataUrl.split(',')
  return { base64: data, mime: head.match(/data:(.*?);/)[1] }
}

export function joinDataUrl(mime, base64) {
  return `data:${mime};base64,${base64}`
}
