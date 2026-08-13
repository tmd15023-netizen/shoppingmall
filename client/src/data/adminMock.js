export const ORDER_STATUS = {
  pending: '주문접수',
  preparing: '상품준비중',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
}

export const PAYMENT_STATUS = {
  paid: '결제완료',
  waiting: '결제대기',
  refunded: '환불완료',
}

export function formatWon(value) {
  return `${Number(value).toLocaleString('ko-KR')}원`
}
