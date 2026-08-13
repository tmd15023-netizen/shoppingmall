import { getToken } from '../utils/auth'
import { request } from './http'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function prepareOrder(orderData) {
  return request('/api/orders/prepare', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(orderData),
  })
}

export function createOrder(orderData) {
  return request('/api/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(orderData),
  })
}

export function getMyOrders() {
  return request('/api/orders/mine', {
    headers: authHeaders(),
  })
}

export function getOrderById(orderId) {
  return request(`/api/orders/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(),
  })
}

export function getOrders(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus)
  const qs = query.toString()

  return request(`/api/orders${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  })
}

export function updateOrderStatus(orderId, payload) {
  return request(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export function cancelOrder(orderId) {
  return request(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
}
