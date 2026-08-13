import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { cancelOrder, getOrderById } from '../api/orderApi'
import { useAuth } from '../hooks/useAuth'
import { ORDER_STATUS, PAYMENT_STATUS, formatWon } from '../data/adminMock'
import { formatPrice } from '../data/products'
import './OrderDetail.css'

const CANCELLABLE = ['pending', 'preparing']

const PAYMENT_METHOD_LABEL = {
  card: '카드 결제',
  bank: '무통장 입금',
  npay: '네이버페이',
  payco: 'PAYCO',
  mobile: '휴대폰 결제',
  escrow: '에스크로',
}

const DETAIL_TABS = [
  { key: 'all', label: '전체' },
  { key: 'shipping', label: '배송중', match: ['shipping'] },
  { key: 'cancelled', label: '취소', match: ['cancelled'] },
  { key: 'delivered', label: '배송완료', match: ['delivered'] },
]

const STATUS_GROUP_LABEL = {
  pending: '주문접수',
  preparing: '상품준비중',
  shipping: '배송중',
  delivered: '배송완료',
  cancelled: '취소된 주문',
}

function statusTone(status) {
  if (status === 'cancelled') return 'danger'
  if (status === 'shipping') return 'blue'
  if (status === 'delivered') return 'green'
  if (status === 'preparing' || status === 'pending') return 'orange'
  return 'gray'
}

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [cancelling, setCancelling] = useState(false)

  const loadOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getOrderById(id)
      setOrder(data)
    } catch (err) {
      setOrder(null)
      setError(err.message || '주문 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) loadOrder()
  }, [user, id])

  const itemCount = order?.items?.length || 0

  const tabCounts = useMemo(() => {
    if (!order) {
      return { all: 0, shipping: 0, cancelled: 0, delivered: 0 }
    }
    return {
      all: itemCount,
      shipping: order.status === 'shipping' ? itemCount : 0,
      cancelled: order.status === 'cancelled' ? itemCount : 0,
      delivered: order.status === 'delivered' ? itemCount : 0,
    }
  }, [order, itemCount])

  const showItems = useMemo(() => {
    if (!order) return false
    if (activeTab === 'all') return true
    const tab = DETAIL_TABS.find((item) => item.key === activeTab)
    return tab?.match?.includes(order.status) || false
  }, [order, activeTab])

  const canCancel = order && CANCELLABLE.includes(order.status)

  const handleCancel = async () => {
    if (!order || !canCancel) {
      alert('배송이 시작된 주문은 취소할 수 없습니다.')
      return
    }
    if (!window.confirm(`주문 ${order.orderNumber}을(를) 취소할까요?`)) return

    setCancelling(true)
    setError('')
    setMessage('')
    try {
      const updated = await cancelOrder(order._id)
      setOrder(updated)
      setMessage('주문이 취소되었습니다.')
    } catch (err) {
      setError(err.message || '주문 취소에 실패했습니다.')
    } finally {
      setCancelling(false)
    }
  }

  if (authLoading) {
    return (
      <main className="order-detail">
        <p className="order-detail__status">확인 중...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <main className="order-detail">
        <p className="order-detail__status">주문 불러오는 중...</p>
      </main>
    )
  }

  if (error && !order) {
    return (
      <main className="order-detail">
        <p className="order-detail__status order-detail__status--error">{error}</p>
        <Link to="/orders" className="order-detail__back-link">
          주문 목록으로
        </Link>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="order-detail">
        <p className="order-detail__status">주문을 찾을 수 없습니다.</p>
        <Link to="/orders" className="order-detail__back-link">
          주문 목록으로
        </Link>
      </main>
    )
  }

  const groupLabel = STATUS_GROUP_LABEL[order.status] || ORDER_STATUS[order.status]

  return (
    <main className="order-detail">
      <div className="order-detail__shell">
        <header className="order-detail__header">
          <div className="order-detail__header-main">
            <button
              type="button"
              className="order-detail__back"
              onClick={() => navigate('/orders')}
              aria-label="주문 목록으로"
            >
              ←
            </button>
            <div>
              <div className="order-detail__title-row">
                <h1>{order.orderNumber}</h1>
                <span
                  className={`order-detail__chip order-detail__chip--${statusTone(order.status)}`}
                >
                  {ORDER_STATUS[order.status] || order.status}
                </span>
                <span
                  className={`order-detail__chip order-detail__chip--${
                    order.paymentStatus === 'refunded' ? 'danger' : 'gray'
                  }`}
                >
                  {PAYMENT_STATUS[order.paymentStatus] || order.paymentStatus}
                </span>
              </div>
              <p className="order-detail__date">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString('ko-KR')
                  : '-'}
              </p>
            </div>
          </div>

          <div className="order-detail__header-actions">
            {canCancel && (
              <button
                type="button"
                className="order-detail__action-btn order-detail__action-btn--danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? '취소 중...' : '주문 취소'}
              </button>
            )}
            <Link to="/" className="order-detail__action-btn">
              쇼핑 계속하기
            </Link>
          </div>
        </header>

        <nav className="order-detail__tabs" aria-label="주문 상태 필터">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`order-detail__tab${activeTab === tab.key ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} {tabCounts[tab.key]}
            </button>
          ))}
        </nav>

        {error && <p className="order-detail__banner order-detail__banner--error">{error}</p>}
        {message && (
          <p className="order-detail__banner order-detail__banner--success">{message}</p>
        )}

        <div className="order-detail__layout">
          <section className="order-detail__main">
            {showItems ? (
              <article className="order-detail__group">
                <header className="order-detail__group-head">
                  <h2>
                    {groupLabel} <em>({itemCount})</em>
                  </h2>
                </header>

                <ul className="order-detail__items">
                  {order.items.map((item, index) => (
                    <li key={`${order._id}-${item.productId}-${index}`}>
                      <Link
                        to={`/product/${encodeURIComponent(item.productId)}`}
                        className="order-detail__thumb"
                      >
                        <img src={item.image} alt={item.name} />
                      </Link>
                      <div className="order-detail__item-body">
                        <Link
                          to={`/product/${encodeURIComponent(item.productId)}`}
                          className="order-detail__item-name"
                        >
                          {item.name}
                        </Link>
                        <div className="order-detail__pills">
                          <span>사이즈 {item.size}</span>
                          <span>색상 {item.color}</span>
                          <span>수량 {item.quantity}개</span>
                        </div>
                        <div className="order-detail__item-price">
                          {item.originalPrice > item.salePrice && (
                            <span className="order-detail__price-origin">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                          <span>
                            {formatPrice(item.salePrice)} × {item.quantity}
                          </span>
                          <strong>{formatWon(item.lineTotal)}</strong>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="order-detail__group-foot">
                  {canCancel ? (
                    <button
                      type="button"
                      className="order-detail__primary-btn order-detail__primary-btn--danger"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? '취소 중...' : '주문 취소하기'}
                    </button>
                  ) : (
                    <p className="order-detail__hint">
                      {order.status === 'cancelled'
                        ? '이 주문은 취소되었습니다.'
                        : order.status === 'shipping'
                          ? '상품이 배송 중입니다.'
                          : order.status === 'delivered'
                            ? '배송이 완료된 주문입니다.'
                            : '배송 시작 후 취소가 불가합니다.'}
                    </p>
                  )}
                </footer>
              </article>
            ) : (
              <div className="order-detail__empty-panel">
                선택한 상태에 해당하는 상품이 없습니다.
              </div>
            )}
          </section>

          <aside className="order-detail__aside">
            <section className="order-detail__card">
              <h3>결제정보</h3>
              <dl>
                <div>
                  <dt>주문금액</dt>
                  <dd>{formatWon(order.itemsAmount)}</dd>
                </div>
                <div>
                  <dt>배송비</dt>
                  <dd>{formatWon(order.shippingFee || 0)}</dd>
                </div>
                <div>
                  <dt>할인</dt>
                  <dd>-{formatWon(order.discountAmount || 0)}</dd>
                </div>
                {order.paymentStatus === 'refunded' && (
                  <div>
                    <dt>환불</dt>
                    <dd className="is-danger">{formatWon(order.totalAmount)}</dd>
                  </div>
                )}
              </dl>
              <div className="order-detail__paid">
                <span>
                  {order.paymentStatus === 'refunded' ? '환불된 금액' : '결제된 금액'}
                </span>
                <strong>{formatWon(order.totalAmount)}</strong>
              </div>
              <p className="order-detail__method">
                {PAYMENT_METHOD_LABEL[order.payment?.method] || order.payment?.method || '-'}
                {' · '}
                {PAYMENT_STATUS[order.paymentStatus] || order.paymentStatus}
              </p>
            </section>

            <section className="order-detail__card">
              <h3>구매자 정보</h3>
              <dl className="order-detail__info-list">
                <div>
                  <dt>이름</dt>
                  <dd>{order.customerName}</dd>
                </div>
                <div>
                  <dt>이메일</dt>
                  <dd>{order.customerEmail}</dd>
                </div>
              </dl>
            </section>

            <section className="order-detail__card">
              <h3>배송지 정보</h3>
              <dl className="order-detail__info-list">
                <div>
                  <dt>받는 분</dt>
                  <dd>{order.shipping?.receiverName || '-'}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd className="is-link">{order.shipping?.phone || '-'}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{order.shipping?.address || '-'}</dd>
                </div>
                {order.shipping?.memo ? (
                  <div>
                    <dt>배송메모</dt>
                    <dd>{order.shipping.memo}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default OrderDetail
