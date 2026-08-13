import { Link, useLocation } from 'react-router-dom'
import './OrderFail.css'

function FailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        d="M7 7l10 10M17 7 7 17"
      />
    </svg>
  )
}

function OrderFail() {
  const location = useLocation()
  const message =
    location.state?.message ||
    '결제가 취소되었거나 주문 처리 중 문제가 발생했습니다.'

  return (
    <main className="order-fail">
      <div className="order-fail__inner">
        <div className="order-fail__icon" aria-hidden="true">
          <FailIcon />
        </div>

        <h1>주문 실패</h1>
        <p className="order-fail__title">주문을 완료하지 못했습니다.</p>
        <p className="order-fail__message">{message}</p>

        <section className="order-fail__card">
          <h2>안내</h2>
          <ul>
            <li>결제창을 닫으면 주문이 생성되지 않습니다.</li>
            <li>결제 금액/상태 검증에 실패하면 주문이 생성되지 않습니다.</li>
            <li>문제가 계속되면 잠시 후 다시 시도해 주세요.</li>
          </ul>
        </section>

        <div className="order-fail__actions">
          <Link to="/checkout" className="order-fail__btn">
            다시 결제하기
          </Link>
          <Link to="/cart" className="order-fail__btn">
            장바구니
          </Link>
        </div>
      </div>
    </main>
  )
}

export default OrderFail
