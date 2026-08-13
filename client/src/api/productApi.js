import { request } from './http'

export function getProducts(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return request(`/api/products${query}`)
}

export function getProductById(id) {
  return request(`/api/products/${encodeURIComponent(id)}`)
}

export function createProduct(productData) {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  })
}

export function updateProduct(id, productData) {
  return request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  })
}

export function deleteProduct(id) {
  return request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
