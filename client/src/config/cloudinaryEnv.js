/**
 * Cloudinary Upload Widget에 필요한 클라이언트 환경변수
 *
 * - VITE_CLOUDINARY_CLOUD_NAME
 *   Cloudinary Console 대시보드의 Cloud name
 *
 * - VITE_CLOUDINARY_UPLOAD_PRESET
 *   Settings > Upload > Upload presets 에서 만든 Unsigned preset 이름
 *
 * ※ API Key / API Secret 은 브라우저(.env의 VITE_)에 넣지 마세요.
 */
export const cloudinaryEnv = {
  cloudName: String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim(),
  uploadPreset: String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim(),
}

export function getMissingCloudinaryEnvKeys() {
  const missing = []

  if (!cloudinaryEnv.cloudName) missing.push('VITE_CLOUDINARY_CLOUD_NAME')
  if (!cloudinaryEnv.uploadPreset) missing.push('VITE_CLOUDINARY_UPLOAD_PRESET')

  return missing
}

export function isCloudinaryConfigured() {
  return getMissingCloudinaryEnvKeys().length === 0
}
