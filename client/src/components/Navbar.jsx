import { useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { CATEGORIES, PRODUCT_CATEGORIES } from '../data/products'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { useClickOutside } from '../hooks/useClickOutside'
import CartIcon from './CartIcon'
import './Navbar.css'

function Navbar() {
  const { user, loading, logout } = useAuth()
  const { itemCount } = useCart()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const isAdmin = user?.level === 'admin'
  const isAdminPage = pathname.startsWith('/admin')
  const activeCategory = pathname === '/' ? searchParams.get('category') || '' : ''

  useClickOutside(menuRef, menuOpen, () => setMenuOpen(false))

  return (
    <header className="navbar">
      <div className="navbar__top">
        <Link to="/" className="navbar__logo">
          SSEUNG
        </Link>

        <div className="navbar__utils">
          {isAdminPage ? (
            <div className="navbar__admin-actions">
              <span className="navbar__admin-mode-btn">관리자모드</span>
              <Link to="/" className="navbar__shop-btn">
                쇼핑몰로 이동
              </Link>
            </div>
          ) : (
            <>
              <span className="navbar__util-text">사이즈 무료교환</span>

              {loading ? (
                <span className="navbar__util-text">확인 중...</span>
              ) : user ? (
                <>
                  <div className="navbar__user-menu" ref={menuRef}>
                    <button
                      type="button"
                      className="navbar__welcome"
                      onClick={() => setMenuOpen((open) => !open)}
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                    >
                      {user.name}님
                    </button>
                    {menuOpen && (
                      <div className="navbar__dropdown" role="menu">
                        <Link
                          to="/profile"
                          className="navbar__dropdown-item"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          회원정보 수정
                        </Link>
                        <button
                          type="button"
                          className="navbar__dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false)
                            logout()
                          }}
                        >
                          로그아웃
                        </button>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <Link to="/admin" className="navbar__admin-btn">
                      어드민
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar__link">
                    로그인
                  </Link>
                  <Link to="/register" className="navbar__link">
                    회원가입
                  </Link>
                </>
              )}

              <Link to="/orders" className="navbar__link">
                주문내역
              </Link>

              <Link to="/cart" className="navbar__icon-btn" aria-label="장바구니">
                <CartIcon />
                <span className="navbar__cart-badge">{itemCount}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="navbar__categories" aria-label="상품 카테고리">
        {CATEGORIES.map((category) => {
          const isProductCategory = PRODUCT_CATEGORIES.includes(category)

          if (isProductCategory) {
            return (
              <Link
                key={category}
                to={`/?category=${encodeURIComponent(category)}`}
                className={`navbar__category${
                  activeCategory === category ? ' is-active' : ''
                }`}
              >
                {category}
              </Link>
            )
          }

          return (
            <Link key={category} to="/" className="navbar__category">
              {category}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

export default Navbar
