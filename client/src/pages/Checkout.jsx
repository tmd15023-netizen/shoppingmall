import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { createOrder, prepareOrder } from '../api/orderApi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { formatPrice } from '../data/products'
import { requestPortonePay } from '../utils/portone'
import './Checkout.css'

const AVAILABLE_POINTS = 3167

const EASY_PAY_OPTIONS = [
  { value: 'npay', label: '네이버페이' },
  { value: 'payco', label: '페이코(간편결제)' },
]

const GENERAL_PAY_OPTIONS = [
  { value: 'card', label: '카드 결제' },
  { value: 'bank', label: '무통장 입금' },
  { value: 'mobile', label: '휴대폰 결제' },
  { value: 'escrow', label: '에스크로(실시간 계좌이체)' },
]

function Checkout() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { cart, loading: cartLoading, refreshCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pointsInput, setPointsInput] = useState('')
  const [usedPoints, setUsedPoints] = useState(0)
  const [savePayment, setSavePayment] = useState(true)
  const [showInstallment, setShowInstallment] = useState(false)
  const [form, setForm] = useState({
    receiverName: '',
    phone: '',
    address: '',
    memo: '',
    paymentMethod: 'card',
  })

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      receiverName: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
    }))
  }, [user])

  const items = cart?.items || []
  const itemsAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
    [items]
  )
  const originalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    [items]
  )
  const basicDiscount = Math.max(0, originalAmount - itemsAmount)
  const shippingFee = itemsAmount >= 50000 || itemsAmount === 0 ? 0 : 3000
  const regionalShipping = 0
  const couponDiscount = 0
  const discountAmount = basicDiscount + couponDiscount + usedPoints
  const totalAmount = Math.max(0, originalAmount + shippingFee + regionalShipping - discountAmount)
  const expectedPoints = Math.floor(totalAmount * 0.01)

  const isEasyPay = EASY_PAY_OPTIONS.some((option) => option.value === form.paymentMethod)
  const isGeneralPay = GENERAL_PAY_OPTIONS.some((option) => option.value === form.paymentMethod)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const applyPoints = (rawValue) => {
    const numeric = Number(String(rawValue).replace(/[^\d]/g, '')) || 0
    const maxUsable = Math.min(AVAILABLE_POINTS, Math.max(0, itemsAmount + shippingFee))
    const next = Math.min(numeric, maxUsable)
    setUsedPoints(next)
    setPointsInput(next ? String(next) : '')
  }

  const handleUseAllPoints = () => {
    applyPoints(AVAILABLE_POINTS)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.receiverName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('수령인, 연락처, 주소는 필수입니다.')
      return
    }

    if (items.length === 0) {
      setError('장바구니가 비어 있습니다.')
      return
    }

    setSubmitting(true)
    try {
      // 1) 주문 초안/결제번호 발급 + 최근 중복 주문 체크
      const prepared = await prepareOrder({
        shippingFee,
        discountAmount: usedPoints + couponDiscount,
      })

      // 2) PortOne V2 결제창 호출 (서버가 준 paymentId/금액 사용)
      const payment = await requestPortonePay({
        paymentMethod: form.paymentMethod,
        amount: prepared.totalAmount,
        orderName: prepared.orderName,
        buyerName: form.receiverName.trim(),
        buyerEmail: user.email,
        buyerTel: form.phone.trim(),
        paymentId: prepared.paymentId,
      })

      // 3) 서버에서 결제번호 중복 체크 + 포트원 결제 검증 후 주문 생성
      const order = await createOrder({
        receiverName: form.receiverName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        memo: form.memo.trim(),
        paymentMethod: form.paymentMethod,
        shippingFee,
        discountAmount: usedPoints + couponDiscount,
        paymentId: prepared.paymentId,
        merchantUid: prepared.paymentId,
        impUid: payment.imp_uid || payment.txId || '',
      })
      await refreshCart()
      navigate(`/order-complete/${order._id}`, {
        replace: true,
        state: { order, savePayment, payment },
      })
    } catch (err) {
      navigate('/order-fail', {
        replace: true,
        state: {
          message: err.message || '결제가 취소되었거나 주문 처리 중 문제가 발생했습니다.',
        },
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || cartLoading) {
    return (
      <main className="checkout-page">
        <p className="checkout-page__status">주문 정보를 불러오는 중...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <h1>주문하기</h1>
        <p className="checkout-page__status">장바구니가 비어 있습니다.</p>
        <Link to="/" className="checkout-page__link">
          쇼핑 계속하기
        </Link>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <header className="checkout-page__header">
        <h1>주문/결제</h1>
        <Link to="/cart">장바구니로</Link>
      </header>

      <form className="checkout-page__grid" onSubmit={handleSubmit}>
        <div className="checkout-main">
          <section className="checkout-card">
            <h2>배송 정보</h2>
            <label>
              수령인 *
              <input
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              연락처 *
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label>
              주소 *
              <input name="address" value={form.address} onChange={handleChange} required />
            </label>
            <label>
              배송 메모
              <textarea name="memo" rows={3} value={form.memo} onChange={handleChange} />
            </label>
          </section>

          <section className="checkout-card">
            <h2>적립금</h2>
            <div className="checkout-points">
              <input
                type="text"
                inputMode="numeric"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                onBlur={() => applyPoints(pointsInput)}
                placeholder="0"
              />
              <span>원</span>
              <button type="button" className="checkout-points__all" onClick={handleUseAllPoints}>
                모두사용
              </button>
            </div>
            <p className="checkout-points__meta">
              보유 적립금 <strong>{AVAILABLE_POINTS.toLocaleString('ko-KR')}</strong> 원
              <span>(최대 {AVAILABLE_POINTS.toLocaleString('ko-KR')}원까지 사용 가능)</span>
            </p>
          </section>

          <section className="checkout-card">
            <h2>결제수단</h2>

            <div className="checkout-easy">
              {EASY_PAY_OPTIONS.map((option) => (
                <label key={option.value} className="checkout-easy__item">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={form.paymentMethod === option.value}
                    onChange={handleChange}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <label className="checkout-general-toggle">
              <input
                type="radio"
                name="paymentGroup"
                checked={isGeneralPay}
                onChange={() => setForm((prev) => ({ ...prev, paymentMethod: 'card' }))}
              />
              <span>일반결제</span>
            </label>

            {(isGeneralPay || !isEasyPay) && (
              <div className="checkout-pay-grid">
                {GENERAL_PAY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`checkout-pay-grid__btn ${
                      form.paymentMethod === option.value ? 'is-selected' : ''
                    }`}
                    onClick={() => setForm((prev) => ({ ...prev, paymentMethod: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            <label className="checkout-save">
              <input
                type="checkbox"
                checked={savePayment}
                onChange={(e) => setSavePayment(e.target.checked)}
              />
              결제수단과 입력정보를 다음에도 사용
            </label>

            <p className="checkout-pay-note">
              카카오페이는 PG사 정책에 따라 결제금액 제한이 있을 수 있습니다.
            </p>

            <button
              type="button"
              className="checkout-accordion"
              onClick={() => setShowInstallment((open) => !open)}
            >
              <span>{showInstallment ? '−' : '+'}</span>
              무이자 할부 안내(~31일)
            </button>
            {showInstallment && (
              <div className="checkout-accordion__body">
                카드사별 무이자 할부 행사는 결제 시점에 따라 달라질 수 있습니다.
              </div>
            )}
          </section>

          {error && <p className="checkout-page__error">{error}</p>}
        </div>

        <aside className="checkout-side">
          <section className="checkout-card checkout-reward">
            <button type="button" className="checkout-reward__toggle">
              <span>적립 예정 적립금</span>
              <strong>{expectedPoints.toLocaleString('ko-KR')} 원</strong>
            </button>
            <ul>
              <li>
                <span>상품별 적립금</span>
                <span>0 원</span>
              </li>
              <li>
                <span>회원 적립금</span>
                <span>{expectedPoints.toLocaleString('ko-KR')} 원</span>
              </li>
              <li>
                <span>쿠폰 적립금</span>
                <span>0 원</span>
              </li>
            </ul>
          </section>

          <section className="checkout-card checkout-total-card">
            <h2>총 결제 금액</h2>
            <p className="checkout-total-card__amount">{formatPrice(totalAmount)}</p>

            <div className="checkout-total-card__rows">
              <p>
                <span>주문상품</span>
                <strong>{formatPrice(originalAmount)}</strong>
              </p>
              <p>
                <span>배송비</span>
                <strong>+{formatPrice(shippingFee)}</strong>
              </p>
              <p>
                <span>지역별 배송비</span>
                <strong>+{formatPrice(regionalShipping)}</strong>
              </p>
              <p>
                <span>할인/부가결제</span>
                <strong className="is-discount">-{formatPrice(discountAmount)}</strong>
              </p>
              <ul className="checkout-total-card__detail">
                <li>
                  <span>기본 할인</span>
                  <span>-{formatPrice(basicDiscount)}</span>
                </li>
                <li>
                  <span>쿠폰 할인</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </li>
                <li>
                  <span>적립금 사용</span>
                  <span>-{formatPrice(usedPoints)}</span>
                </li>
              </ul>
            </div>

            <div className="checkout-side__items">
              {items.map((item) => (
                <div key={item._id} className="checkout-side__item">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.color} / {item.size} · {item.quantity}개
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="checkout-form__submit" disabled={submitting}>
              {submitting ? '결제 처리 중...' : `${formatPrice(totalAmount)} 결제하기`}
            </button>
          </section>
        </aside>
      </form>
    </main>
  )
}

export default Checkout
