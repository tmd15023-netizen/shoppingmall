import { clearAuth, getToken, isTokenExpired, saveAuth } from '../utils/auth'
import { request } from './http'

export async function loginUser({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (!data?.token) {
    throw new Error('서버에서 토큰을 받지 못했습니다.')
  }

  saveAuth(data.token, data.user)
  return data
}

export async function fetchMe() {
  const token = getToken()

  if (!token || isTokenExpired(token)) {
    clearAuth()
    throw new Error('토큰이 만료되었습니다. 다시 로그인해 주세요.')
  }

  try {
    return await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    clearAuth()
    throw error
  }
}
