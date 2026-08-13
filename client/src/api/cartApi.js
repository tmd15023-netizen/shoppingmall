import { getToken } from '../utils/auth'
import { request } from './http'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getCart() {
  return request('/api/cart', {
    headers: authHeaders(),
  })
}

export function addToCart({ productId, color, size, quantity = 1 }) {
  return request('/api/cart/items', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ productId, color, size, quantity }),
  })
}

export function updateCartItem(itemId, quantity) {
  return request(`/api/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ quantity }),
  })
}

export function removeCartItem(itemId) {
  return request(`/api/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export function clearCart() {
  return request('/api/cart', {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
