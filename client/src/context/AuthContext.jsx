import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { fetchMe } from '../api/authApi'
import {
  clearAuth,
  getStoredUser,
  getToken,
  isLoggedIn,
  isTokenExpired,
  setStoredUser,
} from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isLoggedIn() ? getStoredUser() : null))
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const refreshUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setUser(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    try {
      const stored = getStoredUser()
      if (stored) {
        setUser(stored)
      }

      const me = await fetchMe()
      setStoredUser(me)
      setUser(me)
      return me
    } catch {
      clearAuth()
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const applyLoggedOut = () => {
      if (cancelled) return
      setUser(null)
      setLoading(false)
    }

    // 마운트 시 서버에서 유저 재확인 (스토리지만 믿지 않음)
    refreshUser().finally(() => {
      if (!cancelled) setLoading(false)
    })

    const onAuthChanged = () => {
      if (!isLoggedIn()) {
        applyLoggedOut()
        return
      }

      const stored = getStoredUser()
      if (stored && !cancelled) {
        setUser(stored)
        setLoading(false)
      }

      refreshUser()
    }

    const onFocus = () => {
      const token = getToken()
      if (!token || isTokenExpired(token)) {
        if (token) clearAuth()
        applyLoggedOut()
        return
      }

      if (!getStoredUser()) {
        refreshUser()
      }
    }

    window.addEventListener('auth-changed', onAuthChanged)
    window.addEventListener('storage', onAuthChanged)
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('auth-changed', onAuthChanged)
      window.removeEventListener('storage', onAuthChanged)
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshUser])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    alert('로그아웃되었습니다.')
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
