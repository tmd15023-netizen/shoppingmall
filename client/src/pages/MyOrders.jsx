import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { cancelOrder, getMyOrders } from '../api/orderApi'
import { useAuth } from '../hooks/useAuth'
import { ORDER_STATUS, PAYMENT_STATUS, formatWon } from '../data/adminMock'
import { formatPrice } from '../data/products'
import './MyOrders.css'

const CANCELLABLE = ['pending', 'preparing']

const SHIPPING_STEPS = [
  { key: 'pending', label: '주문접수' },
  { key: 'preparing', label: '상품준비중' },
  { key: 'shipping', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
]

const SHIPPING_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '주문접수' },
  { key: 'preparing', label: '상품준비중' },
  { key: 'shipping', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'cancelled', label: '취소' },
]

function getStepIndex(status) {
  if (status === 'cancelled') return -1
  const index = SHIPPING_STEPS.findIndex((step) => step.key === status)
  return index >= 0 ? index : 0
}

function MyOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('orders')
  const [shippingFilter, setShippingFilter] = useState('all')

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || '주문 내역을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  const shippingOrders = useMemo(() => {
    if (shippingFilter === 'all') return orders
    return orders.filter((order) => order.status === shippingFilter)
  }, [orders, shippingFilter])

  const handleCancel = async (order) => {
    if (!CANCELLABLE.includes(order.status)) {
      alert('배송이 시작된 주문은 취소할 수 없습니다.')
      return
    }

    if (!window.confirm(`주문 ${order.orderNumber}을(를) 취소할까요?`)) return

    setMessage('')
    setError('')
    try {
      await cancelOrder(order._id)
      setMessage('주문이 취소되었습니다.')
      await loadOrders()
    } catch (err) {
      setError(err.message || '주문 취소에 실패했습니다.')
    }
  }

  if (authLoading) {
    return (
      <main className="my-orders">
        <p className="my-orders__status">확인 중...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="my-orders">
      <header className="my-orders__header">
        <div>
          <h1>내 주문</h1>
          <p>
            {activeTab === 'shipping'
              ? '주문별 배송 진행 상태를 확인할 수 있습니다.'
              : '본인 주문만 조회·취소할 수 있습니다. (배송 시작 전만 취소 가능)'}
          </p>
        </div>
        <Link to="/">쇼핑 계속하기</Link>
      </header>

      <nav className="my-orders__tabs" aria-label="주문 메뉴">
        <button
          type="button"
          className={`my-orders__tab${activeTab === 'orders' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          주문목록
        </button>
        <button
          type="button"
          className={`my-orders__tab${activeTab === 'shipping' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          배송현황
        </button>
      </nav>

      {error && <p className="my-orders__error">{error}</p>}
      {message && <p className="my-orders__success">{message}</p>}

      {loading ? (
        <p className="my-orders__status">주문 불러오는 중...</p>
      ) : orders.length === 0 ? (
        <div className="my-orders__empty">
          <p>주문 내역이 없습니다.</p>
          <Link to="/">상품 보러가기</Link>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="my-orders__list">
          {orders.map((order) => {
            const canCancel = CANCELLABLE.includes(order.status)

            return (
              <article key={order._id} className="my-order-card">
                <div className="my-order-card__top">
                  <div>
                    <Link
                      to={`/orders/${order._id}`}
                      className="my-order-card__number"
                    >
                      {order.orderNumber}
                    </Link>
                    <p>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('ko-KR')
                        : '-'}
                    </p>
                    <Link to={`/orders/${order._id}`} className="my-order-card__detail-link">
                      주문 상세보기
                    </Link>
                  </div>
                  <div className="my-order-card__badges">
                    <span
                      className={`my-order-card__status${
                        order.status === 'cancelled' ? ' my-order-card__status--danger' : ''
                      }`}
                    >
                      {ORDER_STATUS[order.status] || order.status}
                    </span>
                    <span
                      className={`my-order-card__status${
                        order.paymentStatus === 'refunded' ? ' my-order-card__status--danger' : ''
                      }`}
                    >
                      {PAYMENT_STATUS[order.paymentStatus] || order.paymentStatus}
                    </span>
                  </div>
                </div>

                <ul className="my-order-card__items">
                  {order.items.map((item, index) => (
                    <li key={`${order._id}-${item.productId}-${index}`}>
                      <Link
                        to={`/product/${encodeURIComponent(item.productId)}`}
                        className="my-order-card__thumb"
                      >
                        <img src={item.image} alt={item.name} />
                      </Link>
                      <div>
                        <Link
                          to={`/product/${encodeURIComponent(item.productId)}`}
                          className="my-order-card__name"
                        >
                          {item.name}
                        </Link>
                        <p>
                          {item.color} / {item.size} · {item.quantity}개
                        </p>
                        <p>{formatPrice(item.lineTotal)}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="my-order-card__footer">
                  <p>
                    결제금액 <strong>{formatWon(order.totalAmount)}</strong>
                  </p>
                  {canCancel ? (
                    <button
                      type="button"
                      className="my-order-card__cancel"
                      onClick={() => handleCancel(order)}
                    >
                      주문 취소
                    </button>
                  ) : (
                    <span className="my-order-card__hint">
                      {order.status === 'cancelled'
                        ? '취소된 주문'
                        : '배송 시작 후 취소 불가'}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <section className="my-orders__shipping">
          <div className="my-orders__filters" role="tablist" aria-label="배송 상태 필터">
            {SHIPPING_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                role="tab"
                aria-selected={shippingFilter === filter.key}
                className={`my-orders__filter${
                  shippingFilter === filter.key ? ' is-active' : ''
                }`}
                onClick={() => setShippingFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {shippingOrders.length === 0 ? (
            <div className="my-orders__empty">
              <p>해당 상태의 주문이 없습니다.</p>
            </div>
          ) : (
            <div className="my-orders__list">
              {shippingOrders.map((order) => {
                const currentStep = getStepIndex(order.status)
                const isCancelled = order.status === 'cancelled'
                const firstItem = order.items?.[0]

                return (
                  <article key={order._id} className="shipping-card">
                    <div className="shipping-card__top">
                      <div>
                        <Link
                          to={`/orders/${order._id}`}
                          className="my-order-card__number"
                        >
                          {order.orderNumber}
                        </Link>
                        <p>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString('ko-KR')
                            : '-'}
                        </p>
                      </div>
                      <span
                        className={`shipping-card__badge${
                          isCancelled ? ' shipping-card__badge--danger' : ''
                        }`}
                      >
                        {ORDER_STATUS[order.status] || order.status}
                      </span>
                    </div>

                    {firstItem && (
                      <div className="shipping-card__product">
                        <img src={firstItem.image} alt={firstItem.name} />
                        <div>
                          <p className="shipping-card__name">
                            {order.items.length > 1
                              ? `${firstItem.name} 외 ${order.items.length - 1}건`
                              : firstItem.name}
                          </p>
                          <p>
                            {firstItem.color} / {firstItem.size} · {firstItem.quantity}
                            개
                            {order.items.length > 1
                              ? ` · 총 ${order.items.length}건 ${order.items.reduce(
                                  (sum, item) => sum + (Number(item.quantity) || 0),
                                  0
                                )}개`
                              : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {isCancelled ? (
                      <p className="shipping-card__cancelled">이 주문은 취소되었습니다.</p>
                    ) : (
                      <ol className="shipping-tracker" aria-label="배송 진행 현황">
                        {SHIPPING_STEPS.map((step, index) => {
                          const done = index <= currentStep
                          const current = index === currentStep
                          return (
                            <li
                              key={step.key}
                              className={`shipping-tracker__step${
                                done ? ' is-done' : ''
                              }${current ? ' is-current' : ''}`}
                            >
                              <span className="shipping-tracker__dot" aria-hidden="true" />
                              <span className="shipping-tracker__label">{step.label}</span>
                            </li>
                          )
                        })}
                      </ol>
                    )}

                    <div className="shipping-card__footer">
                      <p>
                        결제금액 <strong>{formatWon(order.totalAmount)}</strong>
                      </p>
                      <Link to={`/orders/${order._id}`} className="shipping-card__link">
                        주문 상세보기
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default MyOrders
