import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getUsers } from '../api/userApi'
import { getProducts } from '../api/productApi'
import { getOrders, updateOrderStatus, cancelOrder } from '../api/orderApi'
import { ORDER_STATUS, PAYMENT_STATUS, formatWon } from '../data/adminMock'
import AdminProductList from '../components/AdminProductList'
import AdminProducts from '../components/AdminProducts'
import './Admin.css'

const MENUS = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'orders', label: '주문관리' },
  { id: 'payments', label: '결제 완료' },
  { id: 'members', label: '가입자목록' },
  { id: 'product-manage', label: '상품관리' },
  { id: 'products', label: '상품 등록' },
]

const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS)
const PAYMENT_STATUS_OPTIONS = Object.keys(PAYMENT_STATUS)
const CANCELLABLE = ['pending', 'preparing']

const ORDER_STATUS_FILTERS = [
  { key: 'all', label: '전체', statuses: null },
  { key: 'ordered', label: '주문완료', statuses: ['pending', 'preparing'] },
  { key: 'shipping', label: '배송중', statuses: ['shipping'] },
  { key: 'delivered', label: '완료', statuses: ['delivered'] },
  { key: 'cancelled', label: '취소', statuses: ['cancelled'] },
]

function StatCard({ label, value, tone = 'default', onClick }) {
  const className = `admin-stat admin-stat--${tone}${onClick ? ' admin-stat--link' : ''}`

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <p className="admin-stat__label">{label}</p>
        <p className="admin-stat__value">{value}</p>
      </button>
    )
  }

  return (
    <article className={className}>
      <p className="admin-stat__label">{label}</p>
      <p className="admin-stat__value">{value}</p>
    </article>
  )
}

function formatOrderDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function getOrderProductSummary(order) {
  const items = Array.isArray(order.items) ? order.items : []
  const first = items[0]
  if (!first) {
    return { image: '', name: '-', detail: '' }
  }

  const lineCount = items.length
  const otherCount = Math.max(0, lineCount - 1)
  const totalQty = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )
  const firstQty = Number(first.quantity) || 0

  return {
    image: first.image || '',
    name:
      otherCount > 0
        ? `${first.name || '-'} 외 ${otherCount}건`
        : first.name || '-',
    detail:
      otherCount > 0
        ? `${first.color || '-'} / ${first.size || '-'} · ${firstQty}개 · 총 ${lineCount}건 ${totalQty}개`
        : `${first.color || '-'} / ${first.size || '-'} · ${firstQty}개`,
  }
}

function getOrderStatusLabel(order) {
  if (order.status === 'cancelled') return '주문취소'
  if (order.status === 'delivered') return '배송완료'
  if (order.status === 'shipping') return '배송중'
  if (order.paymentStatus === 'refunded') return '환불완료'
  if (order.paymentStatus === 'paid') return '결제완료'
  if (order.paymentStatus === 'waiting') return '결제대기'
  return ORDER_STATUS[order.status] || order.status
}

function OrdersTable({ orders, onChanged, manageable = false }) {
  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status })
      onChanged?.()
    } catch (err) {
      alert(err.message || '주문상태 변경에 실패했습니다.')
    }
  }

  const handlePaymentChange = async (orderId, paymentStatus) => {
    try {
      await updateOrderStatus(orderId, { paymentStatus })
      onChanged?.()
    } catch (err) {
      alert(err.message || '결제상태 변경에 실패했습니다.')
    }
  }

  const handleCancel = async (order) => {
    if (!CANCELLABLE.includes(order.status)) {
      alert('배송이 시작된 주문은 취소할 수 없습니다.')
      return
    }
    if (!window.confirm(`주문 ${order.orderNumber}을(를) 취소할까요?`)) return

    try {
      await cancelOrder(order._id)
      onChanged?.()
    } catch (err) {
      alert(err.message || '주문 취소에 실패했습니다.')
    }
  }

  const handleStartShipping = async (order) => {
    if (!window.confirm(`주문 ${order.orderNumber} 배송을 시작할까요?`)) return
    await handleStatusChange(order._id, 'shipping')
  }

  const handleCompleteDelivery = async (order) => {
    if (!window.confirm(`주문 ${order.orderNumber}을(를) 배송완료 처리할까요?`)) return
    await handleStatusChange(order._id, 'delivered')
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-orders-table">
        <thead>
          <tr>
            <th>상품정보</th>
            <th>주문일자</th>
            <th>주문고객</th>
            <th>주문금액</th>
            <th>주문상태</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="admin-orders-table__empty">
                주문이 없습니다.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const product = getOrderProductSummary(order)
              const canStartShipping =
                manageable &&
                order.paymentStatus === 'paid' &&
                CANCELLABLE.includes(order.status)
              const canCancel =
                manageable && CANCELLABLE.includes(order.status)
              const canComplete =
                manageable && order.status === 'shipping'

              return (
                <tr key={order._id || order.orderNumber}>
                  <td>
                    <div className="admin-orders-table__product">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <span className="admin-orders-table__thumb-empty" />
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        {product.detail ? <span>{product.detail}</span> : null}
                      </div>
                    </div>
                  </td>
                  <td className="admin-orders-table__center">
                    <div className="admin-orders-table__date-block">
                      <strong>{formatOrderDateTime(order.createdAt)}</strong>
                      <span>{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="admin-orders-table__center">
                    <div className="admin-orders-table__customer">
                      <strong>{order.customerName || '-'}</strong>
                      <span>{order.customerEmail || '-'}</span>
                    </div>
                  </td>
                  <td className="admin-orders-table__center admin-orders-table__amount">
                    {Number(order.totalAmount || 0).toLocaleString('ko-KR')}원
                  </td>
                  <td>
                    <div className="admin-orders-table__status-cell">
                      {manageable ? (
                        <>
                          <div className="admin-orders-table__selects">
                            <label className="admin-orders-table__select-label">
                              <span>주문상태</span>
                              <select
                                className="admin-order-select"
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusChange(order._id, e.target.value)
                                }
                                disabled={order.status === 'cancelled'}
                              >
                                {ORDER_STATUS_OPTIONS.map((key) => (
                                  <option key={key} value={key}>
                                    {ORDER_STATUS[key]}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="admin-orders-table__select-label">
                              <span>결제상태</span>
                              <select
                                className="admin-order-select"
                                value={order.paymentStatus}
                                onChange={(e) =>
                                  handlePaymentChange(order._id, e.target.value)
                                }
                                disabled={order.status === 'cancelled'}
                              >
                                {PAYMENT_STATUS_OPTIONS.map((key) => (
                                  <option key={key} value={key}>
                                    {PAYMENT_STATUS[key]}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="admin-orders-table__actions">
                            {canStartShipping && (
                              <button
                                type="button"
                                className="admin-orders-table__btn"
                                onClick={() => handleStartShipping(order)}
                              >
                                배송시작
                              </button>
                            )}
                            {canComplete && (
                              <button
                                type="button"
                                className="admin-orders-table__btn"
                                onClick={() => handleCompleteDelivery(order)}
                              >
                                배송완료
                              </button>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                className="admin-orders-table__btn"
                                onClick={() => handleCancel(order)}
                              >
                                주문취소
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <span
                          className={`admin-orders-table__status${
                            order.status === 'cancelled' ||
                            order.paymentStatus === 'refunded'
                              ? ' is-danger'
                              : ''
                          }`}
                        >
                          {getOrderStatusLabel(order)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function Admin() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [members, setMembers] = useState([])
  const [membersError, setMembersError] = useState('')
  const [membersLoading, setMembersLoading] = useState(true)
  const [productCount, setProductCount] = useState(0)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')

  const loadOrders = () => {
    setOrdersLoading(true)
    return getOrders()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : [])
        setOrdersError('')
      })
      .catch((error) => {
        setOrders([])
        setOrdersError(error.message || '주문 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        setOrdersLoading(false)
      })
  }

  useEffect(() => {
    let cancelled = false

    getUsers()
      .then((data) => {
        if (!cancelled) setMembers(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        if (!cancelled) setMembersError(error.message || '가입자 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    getProducts()
      .then((data) => {
        if (!cancelled) setProductCount(Array.isArray(data) ? data.length : 0)
      })
      .catch(() => {
        if (!cancelled) setProductCount(0)
      })

    return () => {
      cancelled = true
    }
  }, [tab])

  useEffect(() => {
    loadOrders()
  }, [tab])

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'paid'),
    [orders]
  )

  const filteredOrders = useMemo(() => {
    const filter = ORDER_STATUS_FILTERS.find((item) => item.key === orderStatusFilter)
    if (!filter || !filter.statuses) return orders
    return orders.filter((order) => filter.statuses.includes(order.status))
  }, [orders, orderStatusFilter])

  const orderFilterCounts = useMemo(() => {
    const counts = { all: orders.length }
    ORDER_STATUS_FILTERS.forEach((filter) => {
      if (!filter.statuses) return
      counts[filter.key] = orders.filter((order) =>
        filter.statuses.includes(order.status)
      ).length
    })
    return counts
  }, [orders])

  const stats = useMemo(() => {
    const paidAmount = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const pendingCount = orders.filter((order) => order.status === 'pending').length
    const shippingCount = orders.filter((order) => order.status === 'shipping').length

    return {
      paidAmount,
      paidCount: paidOrders.length,
      pendingCount,
      shippingCount,
      memberCount: members.length,
    }
  }, [paidOrders, orders, members.length])

  if (loading) {
    return <main className="admin-page admin-page--center">권한 확인 중...</main>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.level !== 'admin') {
    return (
      <main className="admin-page admin-page--center">
        <h1>접근 권한이 없습니다</h1>
        <p>어드민 계정으로 로그인해 주세요.</p>
        <Link to="/">메인으로 돌아가기</Link>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <h1>관리자 대시보드</h1>
          <p className="admin-sidebar__user">{user.name} 관리자</p>
          <nav className="admin-menu">
            {MENUS.map((menu) => (
              <button
                key={menu.id}
                type="button"
                className={`admin-menu__item ${tab === menu.id ? 'is-active' : ''}`}
                onClick={() => {
                  setTab(menu.id)
                  if (menu.id === 'orders') {
                    setOrderStatusFilter('all')
                  }
                }}
              >
                {menu.label}
              </button>
            ))}
          </nav>
          <div className="admin-sidebar__checklist">
            <h3>운영 체크리스트</h3>
            <ul className="admin-checklist">
              <li>결제완료 주문 배송 준비 여부 확인</li>
              <li>신규 가입자 환영 메일/쿠폰 발송</li>
              <li>품절 임박 상품 재고 점검</li>
              <li>취소/환불 요청 처리</li>
            </ul>
          </div>
        </aside>

        <section className="admin-content">
          {tab === 'dashboard' && (
            <>
              <header className="admin-content__header admin-content__header--soft">
                <h2>대시보드 요약</h2>
                <p>주문·결제·가입 현황을 한눈에 확인하세요.</p>
              </header>
              <div className="admin-stats">
                <StatCard
                  label="결제완료 매출"
                  value={formatWon(stats.paidAmount)}
                  tone="green"
                  onClick={() => setTab('payments')}
                />
                <StatCard
                  label="결제완료 건수"
                  value={`${stats.paidCount}건`}
                  tone="blue"
                  onClick={() => setTab('payments')}
                />
                <StatCard
                  label="주문접수 대기"
                  value={`${stats.pendingCount}건`}
                  tone="orange"
                  onClick={() => {
                    setOrderStatusFilter('ordered')
                    setTab('orders')
                  }}
                />
                <StatCard
                  label="배송중"
                  value={`${stats.shippingCount}건`}
                  onClick={() => {
                    setOrderStatusFilter('shipping')
                    setTab('orders')
                  }}
                />
                <StatCard
                  label="가입자 수"
                  value={`${stats.memberCount}명`}
                  tone="pink"
                  onClick={() => setTab('members')}
                />
                <StatCard
                  label="등록 상품"
                  value={`${productCount}개`}
                  onClick={() => setTab('product-manage')}
                />
              </div>
              <div className="admin-panels">
                <article className="admin-panel admin-panel--full admin-panel--soft">
                  <h3>최근 주문</h3>
                  {ordersLoading ? (
                    <p>주문 불러오는 중...</p>
                  ) : ordersError ? (
                    <p className="admin-error">{ordersError}</p>
                  ) : (
                    <OrdersTable orders={orders.slice(0, 4)} />
                  )}
                </article>
              </div>
            </>
          )}

          {tab === 'orders' && (
            <>
              <header className="admin-content__header">
                <h2>주문관리</h2>
                <p>주문 목록을 확인하고 배송시작·주문취소 등 상태를 처리합니다.</p>
              </header>
              <div className="admin-status-tabs" role="tablist" aria-label="주문 상태 필터">
                {ORDER_STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={orderStatusFilter === filter.key}
                    className={`admin-status-tab${
                      orderStatusFilter === filter.key ? ' is-active' : ''
                    }`}
                    onClick={() => setOrderStatusFilter(filter.key)}
                  >
                    {filter.label}
                    <span>{orderFilterCounts[filter.key] || 0}</span>
                  </button>
                ))}
              </div>
              {ordersLoading ? (
                <p>주문 불러오는 중...</p>
              ) : ordersError ? (
                <p className="admin-error">{ordersError}</p>
              ) : (
                <OrdersTable orders={filteredOrders} manageable onChanged={loadOrders} />
              )}
            </>
          )}

          {tab === 'payments' && (
            <>
              <header className="admin-content__header">
                <h2>결제 완료</h2>
                <p>결제가 완료된 주문만 모아서 봅니다.</p>
              </header>
              <div className="admin-stats admin-stats--compact">
                <StatCard label="결제완료 합계" value={formatWon(stats.paidAmount)} tone="green" />
                <StatCard label="결제완료 건수" value={`${stats.paidCount}건`} tone="blue" />
              </div>
              {ordersLoading ? (
                <p>주문 불러오는 중...</p>
              ) : ordersError ? (
                <p className="admin-error">{ordersError}</p>
              ) : (
                <OrdersTable orders={paidOrders} manageable onChanged={loadOrders} />
              )}
            </>
          )}

          {tab === 'members' && (
            <>
              <header className="admin-content__header">
                <h2>가입자목록</h2>
                <p>실제 DB에 저장된 회원 목록입니다.</p>
              </header>
              {membersLoading && <p>가입자 불러오는 중...</p>}
              {membersError && <p className="admin-error">{membersError}</p>}
              {!membersLoading && !membersError && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>이름</th>
                        <th>이메일</th>
                        <th>권한</th>
                        <th>연락처</th>
                        <th>주소</th>
                        <th>가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member._id}>
                          <td>{member.name}</td>
                          <td>{member.email}</td>
                          <td>
                            <span
                              className={`admin-badge ${
                                member.level === 'admin'
                                  ? 'admin-badge--admin'
                                  : 'admin-badge--customer'
                              }`}
                            >
                              {member.level}
                            </span>
                          </td>
                          <td>{member.phone || '-'}</td>
                          <td>{member.address || '-'}</td>
                          <td>
                            {member.createdAt
                              ? new Date(member.createdAt).toLocaleString('ko-KR')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'product-manage' && (
            <AdminProductList
              onGoRegister={() => setTab('products')}
              onGoDashboard={() => setTab('dashboard')}
            />
          )}

          {tab === 'products' && (
            <AdminProducts onRegistered={() => setTab('product-manage')} />
          )}
        </section>
      </div>
    </main>
  )
}

export default Admin
