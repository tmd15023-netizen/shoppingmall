import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatPrice } from '../data/products'
import './OrderComplete.css'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12.5 10 17.5 19 7"
      />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7zM12 5.2l6.2 3.8L12 12.7 5.8 9 12 5.2zM5 10.7l6 3.6v5.4l-6-3.7v-5.3zm8 9v-5.4l6-3.6v5.3l-6 3.7z"
      />
    </svg>
  )
}

function DeliveryIcon() {
  return (
    <img
      className="order-complete__delivery-icon"
      src="/delivery-truck.png"
      alt=""
      width="40"
      height="40"
      aria-hidden="true"
    />
  )
}

function formatOrderDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function OrderComplete() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const order = location.state?.order

  const customerName =
    order?.customerName ||
    order?.shipping?.receiverName ||
    user?.name ||
    '고객'

  const items = order?.items || []

  return (
    <main className="order-complete">
      <div className="order-complete__inner">
        <div className="order-complete__check" aria-hidden="true">
          <CheckIcon />
        </div>

        <h1 id="order-complete-title">주문 완료</h1>
        <p className="order-complete__thanks">
          {customerName}님 주문해 주셔서 감사합니다.
        </p>
        <p className="order-complete__message">
          고객님께 예쁘게 달려갈게요
          <DeliveryIcon />
        </p>

        <section className="order-complete__info" aria-labelledby="order-info-title">
          <header className="order-complete__info-head">
            <PackageIcon />
            <h2 id="order-info-title">주문 정보</h2>
          </header>

          {order ? (
            <>
              <div className="order-complete__meta">
                <div>
                  <span>주문 번호</span>
                  <strong>{order.orderNumber}</strong>
                </div>
                <div>
                  <span>주문 날짜</span>
                  <strong>{formatOrderDate(order.createdAt)}</strong>
                </div>
              </div>

              <ul className="order-complete__products">
                {items.map((item, index) => (
                  <li key={`${item.productId}-${index}`}>
                    <div className="order-complete__thumb">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="order-complete__product-text">
                      <p className="order-complete__product-name">{item.name}</p>
                      <p className="order-complete__product-option">
                        Color: {item.color}
                        {item.size ? ` / Size: ${item.size}` : ''}
                        {item.quantity ? ` · ${item.quantity}개` : ''}
                      </p>
                      <p className="order-complete__product-price">
                        {formatPrice(item.lineTotal ?? item.salePrice * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="order-complete__total">
                <span>결제금액</span>
                <strong>{formatPrice(order.totalAmount)}</strong>
              </div>
            </>
          ) : (
            <p className="order-complete__empty-info">
              주문 상세는 주문 내역에서 확인할 수 있습니다.
              {id ? ` (ref: ${id})` : ''}
            </p>
          )}
        </section>

        <div className="order-complete__actions">
          <Link to="/" className="order-complete__btn">
            쇼핑 계속하기
          </Link>
          <Link
            to={order?._id ? `/orders/${order._id}` : '/orders'}
            className="order-complete__btn"
          >
            주문 상세
          </Link>
        </div>
      </div>
    </main>
  )
}

export default OrderComplete
