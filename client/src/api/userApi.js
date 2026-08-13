import { getToken } from '../utils/auth'
import { request } from './http'

export function createUser(userData) {
  return request('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export function getUsers() {
  const token = getToken()
  return request('/api/users', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
