// Test AVIF export support once at module load
export const CANVAS_EXPORT_SUPPORT_AVIF = (() => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  let avifSupported = false
  canvas.toBlob((blob) => {
    avifSupported = blob?.type === 'image/avif'
  }, 'image/avif')
  
  return avifSupported
})()

// Test WebP export support once at module load
export const CANVAS_EXPORT_SUPPORT_WEBP = (() => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  let webpSupported = false
  canvas.toBlob((blob) => {
    webpSupported = blob?.type === 'image/webp'
  }, 'image/webp')
  
  return webpSupported
})()

// Determine best default format based on support
export const getDefaultImageFormat = () => {
  if (CANVAS_EXPORT_SUPPORT_AVIF) return 'avif'
  if (CANVAS_EXPORT_SUPPORT_WEBP) return 'webp'
  return 'jpeg'
}