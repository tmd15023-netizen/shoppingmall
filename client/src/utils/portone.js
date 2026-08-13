import * as PortOne from '@portone/browser-sdk/v2'

export const PORTONE_STORE_ID =
  import.meta.env.VITE_PORTONE_STORE_ID ||
  'store-c92709e0-6d2a-432d-9a99-63a0c9f3a0d0'

export const PORTONE_CHANNEL_KEY =
  (
    import.meta.env.VITE_PORTONE_CHANNEL_KEY ||
    'channel-key-f7ee5e7c-348c-428d-b4a6-82dbdb3d82a2'
  ).trim()

/**
 * V2는 IMP.init 불필요. 호환용으로 남겨둠.
 */
export async function initPortone() {
  return PortOne
}

function getPayMethod(paymentMethod) {
  switch (paymentMethod) {
    case 'npay':
    case 'payco':
      return 'EASY_PAY'
    case 'mobile':
      return 'MOBILE'
    case 'escrow':
      return 'TRANSFER'
    case 'bank':
      return 'VIRTUAL_ACCOUNT'
    case 'card':
    default:
      return 'CARD'
  }
}

function getEasyPayProvider(paymentMethod) {
  if (paymentMethod === 'npay') return 'NAVERPAY'
  if (paymentMethod === 'payco') return 'PAYCO'
  return undefined
}

function createPaymentId() {
  // KG이니시스 oid 제한: 1~40자 (ASCII)
  // 예: pay_1712345678901_ab12cd34  => 26자
  const rand = Math.random().toString(36).slice(2, 10)
  return `pay_${Date.now()}_${rand}`.slice(0, 40)
}

/**
 * PortOne V2 결제창 호출
 * - 현재 콘솔 채널(inicis_v2)은 V1 IMP.request_pay 의 pg 로는 사용할 수 없음
 */
export async function requestPortonePay({
  paymentMethod,
  amount,
  orderName,
  buyerName,
  buyerEmail,
  buyerTel,
  paymentId: givenPaymentId,
}) {
  if (!PORTONE_STORE_ID) {
    throw new Error('포트원 Store ID가 없습니다. VITE_PORTONE_STORE_ID 를 설정하세요.')
  }
  if (!PORTONE_CHANNEL_KEY) {
    throw new Error('포트원 채널키가 없습니다. VITE_PORTONE_CHANNEL_KEY 를 설정하세요.')
  }

  const paymentId = (givenPaymentId || createPaymentId()).slice(0, 40)
  const payMethod = getPayMethod(paymentMethod)
  const easyPayProvider = getEasyPayProvider(paymentMethod)

  const request = {
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY,
    paymentId,
    orderName,
    totalAmount: Number(amount),
    currency: 'CURRENCY_KRW',
    payMethod,
    customer: {
      fullName: buyerName || undefined,
      email: buyerEmail || undefined,
      phoneNumber: (buyerTel || '').replace(/[^\d]/g, '') || undefined,
    },
    redirectUrl: `${window.location.origin}/checkout`,
  }

  if (payMethod === 'EASY_PAY' && easyPayProvider) {
    request.easyPay = { easyPayProvider }
  }

  const response = await PortOne.requestPayment(request)

  // 사용자가 결제창을 닫거나 실패한 경우
  if (response?.code != null) {
    throw new Error(response.message || '결제가 취소되었거나 실패했습니다.')
  }

  return {
    ...response,
    paymentId: response?.paymentId || paymentId,
    // 기존 주문 API 필드와 호환
    imp_uid: response?.txId || response?.paymentId || paymentId,
    merchant_uid: response?.paymentId || paymentId,
  }
}
