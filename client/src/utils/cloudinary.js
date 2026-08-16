import {
  cloudinaryEnv,
  getMissingCloudinaryEnvKeys,
  isCloudinaryConfigured,
} from '../config/cloudinaryEnv'

const WIDGET_SCRIPT_URL = 'https://upload-widget.cloudinary.com/latest/global/all.js'

let scriptPromise = null

function loadCloudinaryScript() {
  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve(window.cloudinary)
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${WIDGET_SCRIPT_URL}"]`)

      if (existing) {
        existing.addEventListener('load', () => resolve(window.cloudinary), { once: true })
        existing.addEventListener('error', () => reject(new Error('Cloudinary 스크립트 로드 실패')), {
          once: true,
        })
        return
      }

      const script = document.createElement('script')
      script.src = WIDGET_SCRIPT_URL
      script.async = true
      script.onload = () => resolve(window.cloudinary)
      script.onerror = () => reject(new Error('Cloudinary 스크립트 로드 실패'))
      document.body.appendChild(script)
    })
  }

  return scriptPromise
}

export function getCloudinaryConfig() {
  return { ...cloudinaryEnv }
}

export async function openCloudinaryUploadWidget({
  onSuccess,
  onError,
  onClose,
  maxFiles = 6,
} = {}) {
  if (!isCloudinaryConfigured()) {
    const missing = getMissingCloudinaryEnvKeys().join(', ')
    const message = `Cloudinary 환경변수가 없습니다: ${missing}. client/.env에 값을 넣고 개발 서버를 재시작하세요.`
    onError?.(new Error(message))
    throw new Error(message)
  }

  const allowedFiles = Math.max(1, Number(maxFiles) || 1)
  const { cloudName, uploadPreset } = cloudinaryEnv
  const cloudinary = await loadCloudinaryScript()

  if (!cloudinary?.createUploadWidget) {
    const message = 'Cloudinary 위젯을 초기화하지 못했습니다.'
    onError?.(new Error(message))
    throw new Error(message)
  }

  const widget = cloudinary.createUploadWidget(
    {
      cloudName,
      uploadPreset,
      multiple: allowedFiles > 1,
      maxFiles: allowedFiles,
      sources: ['local', 'url', 'camera'],
      resourceType: 'image',
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      folding: false,
    },
    (error, result) => {
      if (error) {
        onError?.(error)
        return
      }

      // 여러 장 선택 시 파일마다 success 이벤트가 발생합니다.
      if (result?.event === 'success') {
        const imageUrl = result.info?.secure_url || result.info?.url || ''
        if (imageUrl) {
          onSuccess?.(imageUrl, result.info)
        }
        return
      }

      if (result?.event === 'close' || result?.event === 'abort') {
        onClose?.()
      }
    }
  )

  widget.open()
  return widget
}
