export const PRODUCT_CATEGORIES = [
  'MADE',
  '신상',
  'BEST',
  '인기상품 재입고',
  '린넨',
  '니트',
  'OUTER',
  'TOPS',
  'BOTTOMS',
  'DRESS',
  'BAGS',
  'ACC.',
]

export const CATEGORIES = [...PRODUCT_CATEGORIES, '바로배송', '상품후기']

export function formatPrice(value) {
  return `${value.toLocaleString('ko-KR')}원`
}
