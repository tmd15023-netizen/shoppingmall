const API_BASE = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function request(path, { headers, ...options } = {}) {
  if (!API_BASE && import.meta.env.PROD) {
    throw new Error(
      'API 서버 주소가 없습니다. Vercel 환경변수 VITE_API_URL에 Heroku 주소를 넣고 다시 배포해 주세요.'
    )
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    })
  } catch {
    throw new Error(
      '서버에 연결하지 못했습니다. VITE_API_URL(Heroku 주소)과 서버 상태를 확인해 주세요.'
    )
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? 'API를 찾을 수 없습니다. Heroku에 최신 코드가 배포됐는지 확인해 주세요.'
        : response.status === 401
          ? '로그인이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.'
          : '요청에 실패했습니다.'
    throw new Error(data?.message || fallback)
  }

  return data
}
