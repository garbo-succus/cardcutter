// Test AVIF export support once at module load
export const CANVAS_EXPORT_SUPPORT_AVIF = (() => {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/avif').startsWith('data:image/avif')
})()

// Test WebP export support once at module load
export const CANVAS_EXPORT_SUPPORT_WEBP = (() => {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
})()

// Determine best default format based on support
export const getDefaultImageFormat = () => {
  if (CANVAS_EXPORT_SUPPORT_AVIF) return 'avif'
  if (CANVAS_EXPORT_SUPPORT_WEBP) return 'webp'
  return 'jpeg'
}