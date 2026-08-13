const API_BASE = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function request(path, { headers, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.message || '요청에 실패했습니다.')
  }

  return data
}
