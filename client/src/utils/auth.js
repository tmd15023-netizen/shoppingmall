const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function notifyAuthChanged() {
  window.dispatchEvent(new Event('auth-changed'))
}

export function saveAuth(token, user) {
  if (!token) {
    throw new Error('저장할 토큰이 없습니다.')
  }

  localStorage.setItem(TOKEN_KEY, token)

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  notifyAuthChanged()
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    return
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  notifyAuthChanged()
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isTokenExpired(token = getToken()) {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function isLoggedIn() {
  const token = getToken()
  if (!token) return false

  if (isTokenExpired(token)) {
    clearAuth()
    return false
  }

  return true
}
