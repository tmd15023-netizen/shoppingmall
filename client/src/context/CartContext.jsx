import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { addToCart as addToCartApi, getCart } from '../api/cartApi'
import { isLoggedIn } from '../utils/auth'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setCart(null)
      return null
    }

    setLoading(true)
    try {
      const data = await getCart()
      setCart(data)
      return data
    } catch {
      setCart(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCart()

    const onAuthChanged = () => {
      refreshCart()
    }

    window.addEventListener('auth-changed', onAuthChanged)
    window.addEventListener('storage', onAuthChanged)

    return () => {
      window.removeEventListener('auth-changed', onAuthChanged)
      window.removeEventListener('storage', onAuthChanged)
    }
  }, [refreshCart])

  const addItem = useCallback(async ({ productId, color, size, quantity = 1 }) => {
    const data = await addToCartApi({ productId, color, size, quantity })
    setCart(data)
    return data
  }, [])

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount: cart?.itemCount || 0,
      refreshCart,
      addItem,
      setCart,
    }),
    [cart, loading, refreshCart, addItem]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart는 CartProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
