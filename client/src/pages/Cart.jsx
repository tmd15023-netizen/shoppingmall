import { Link, useNavigate } from 'react-router-dom'
import { removeCartItem, updateCartItem } from '../api/cartApi'
import CartIcon from '../components/CartIcon'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { formatPrice } from '../data/products'
import './Cart.css'

function Cart() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { cart, loading, setCart, refreshCart } = useCart()

  const handleQuantity = async (itemId, quantity) => {
    if (quantity < 1) return
    try {
      const data = await updateCartItem(itemId, quantity)
      setCart(data)
    } catch (err) {
      alert(err.message || '수량 변경에 실패했습니다.')
    }
  }

  const handleRemove = async (itemId) => {
    if (!window.confirm('해당 상품을 장바구니에서 삭제할까요?')) return
    try {
      const data = await removeCartItem(itemId)
      setCart(data)
    } catch (err) {
      alert(err.message || '삭제에 실패했습니다.')
    }
  }

  if (authLoading || loading) {
    return (
      <main className="cart-page">
        <p className="cart-page__status">장바구니를 불러오는 중...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="cart-page">
        <h1>장바구니</h1>
        <p className="cart-page__status">로그인 후 장바구니를 이용할 수 있습니다.</p>
        <Link to="/login" className="cart-page__link">
          로그인하기
        </Link>
      </main>
    )
  }

  const items = cart?.items || []

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <h1>장바구니</h1>
        <button type="button" className="cart-page__refresh" onClick={refreshCart}>
          새로고침
        </button>
      </header>

      {items.length === 0 ? (
        <div className="cart-page__empty">
          <div className="cart-page__empty-icon" aria-hidden="true">
            <CartIcon size={56} />
          </div>
          <p>장바구니가 비어 있습니다.</p>
          <Link to="/" className="cart-page__empty-btn">
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-page__list">
            {items.map((item) => (
              <article key={item._id} className="cart-item">
                <Link to={`/product/${encodeURIComponent(item.productId)}`} className="cart-item__thumb">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="cart-item__info">
                  <Link to={`/product/${encodeURIComponent(item.productId)}`}>
                    <h2>{item.name}</h2>
                  </Link>
                  <p>
                    옵션: {item.color} / {item.size || '-'}
                  </p>
                  <p className="cart-item__price">
                    <span>{formatPrice(item.originalPrice)}</span>
                    <strong>{formatPrice(item.salePrice)}</strong>
                  </p>
                </div>
                <div className="cart-item__qty">
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantity(item._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <p className="cart-item__total">{formatPrice(item.salePrice * item.quantity)}</p>
                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => handleRemove(item._id)}
                >
                  삭제
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-page__summary">
            <p>
              총 수량 <strong>{cart.itemCount}개</strong>
            </p>
            <p>
              결제 예정 금액 <strong>{formatPrice(cart.totalAmount)}</strong>
            </p>
            <button
              type="button"
              className="cart-page__checkout"
              onClick={() => navigate('/checkout')}
            >
              주문하기
            </button>
          </aside>
        </>
      )}
    </main>
  )
}

export default Cart
