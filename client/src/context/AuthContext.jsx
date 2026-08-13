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
  setStoredUser,
} from '../utils/auth'

const AuthContext = createContext(null)

async function resolveUser() {
  if (!isLoggedIn()) {
    return null
  }

  const stored = getStoredUser()
  if (stored) return stored

  try {
    return await fetchMe()
  } catch {
    return null
  }
}

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

    resolveUser()
      .then((nextUser) => {
        if (cancelled) return
        if (nextUser) setStoredUser(nextUser)
        setUser(nextUser)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const onAuthChanged = () => {
      if (!isLoggedIn()) {
        setUser(null)
        setLoading(false)
        return
      }

      const stored = getStoredUser()
      if (stored) {
        setUser(stored)
        setLoading(false)
      }

      fetchMe()
        .then((me) => {
          if (cancelled) return
          setStoredUser(me)
          setUser(me)
        })
        .catch(() => {
          if (!cancelled) setUser(null)
        })
    }

    window.addEventListener('auth-changed', onAuthChanged)
    window.addEventListener('storage', onAuthChanged)

    return () => {
      cancelled = true
      window.removeEventListener('auth-changed', onAuthChanged)
      window.removeEventListener('storage', onAuthChanged)
    }
  }, [])

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
