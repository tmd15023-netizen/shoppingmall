import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProductById } from '../api/productApi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { formatPrice } from '../data/products'
import './ProductDetail.css'

const SIZE_OPTIONS = ['FREE', 'S', 'M', 'L']

const DETAIL_TABS = [
  { id: 'size', label: '사이즈' },
  { id: 'description', label: '상품설명' },
  { id: 'review', label: '리뷰' },
]

const SIZE_ROWS = [
  { size: 'FREE', shoulder: '38', chest: '52', sleeve: '58', length: '62' },
  { size: 'S', shoulder: '36', chest: '48', sleeve: '56', length: '60' },
  { size: 'M', shoulder: '38', chest: '52', sleeve: '58', length: '62' },
  { size: 'L', shoulder: '40', chest: '56', sleeve: '60', length: '64' },
]

const MAX_GALLERY_IMAGES = 6

const REVIEW_PHOTOS = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=200&q=80',
]

const TEXT_REVIEWS = [
  {
    id: 1,
    user: '김**',
    rating: 5,
    date: '2026.08.08',
    content: '핏이 예쁘고 소재가 부드러워요. 사이즈 표대로 딱 맞았습니다.',
  },
  {
    id: 2,
    user: '이**',
    rating: 5,
    date: '2026.08.05',
    content: '색감이 화면이랑 거의 같고 데일리로 입기 좋아요.',
  },
  {
    id: 3,
    user: '박**',
    rating: 4,
    date: '2026.08.01',
    content: '배송도 빠르고 마감도 깔끔합니다. 다음 색상도 구매할 예정이에요.',
  },
]

function getDiscount(product) {
  const original = Number(product?.originalPrice) || 0
  const sale = Number(product?.salePrice) || 0
  if (original <= 0 || sale >= original) return 0
  return Math.round(((original - sale) / original) * 100)
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideAnimated, setSlideAnimated] = useState(true)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedOptions, setSelectedOptions] = useState([])
  const [activeTab, setActiveTab] = useState('size')
  const [cartLoading, setCartLoading] = useState(false)
  const sectionRefs = useRef({})
  const swipeStartX = useRef(null)
  const slideLock = useRef(false)
  const optionsReady = selectedOptions.length > 0

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')
    setSelectedColor('')
    setSelectedSize('')
    setSelectedOptions([])
    setActiveImage(0)
    setSlideIndex(0)
    setSlideAnimated(false)
    setActiveTab('size')

    getProductById(id)
      .then((data) => {
        if (!cancelled) setProduct(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setProduct(null)
          setError(err.message || '상품을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const gallery = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.images) && product.images.length) {
      return product.images.filter(Boolean).slice(0, MAX_GALLERY_IMAGES)
    }
    return product.image ? [product.image] : []
  }, [product])

  const loopSlides = useMemo(() => {
    if (gallery.length <= 1) return gallery
    return [gallery[gallery.length - 1], ...gallery, gallery[0]]
  }, [gallery])

  useEffect(() => {
    slideLock.current = false
    setActiveImage(0)
    setSlideAnimated(false)
    setSlideIndex(gallery.length > 1 ? 1 : 0)
  }, [gallery])

  const colorOptions = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.colors) && product.colors.length) {
      return product.colors.map((color) => String(color).trim()).filter(Boolean)
    }
    return []
  }, [product])

  const sizeOptions = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.sizes) && product.sizes.length) {
      return product.sizes.map((size) => String(size).trim()).filter(Boolean)
    }
    return SIZE_OPTIONS
  }, [product])

  useEffect(() => {
    if (selectedColor && !colorOptions.includes(selectedColor)) {
      setSelectedColor('')
    }
  }, [colorOptions, selectedColor])

  useEffect(() => {
    if (selectedSize && !sizeOptions.includes(selectedSize)) {
      setSelectedSize('')
    }
  }, [sizeOptions, selectedSize])

  const addSelectedOption = (color, size) => {
    if (!color || !size) return

    setSelectedOptions((prev) => {
      const existing = prev.find((item) => item.color === color && item.size === size)
      if (existing) {
        return prev.map((item) =>
          item.color === color && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prev,
        {
          id: `${color}-${size}-${Date.now()}`,
          color,
          size,
          quantity: 1,
        },
      ]
    })

    setSelectedSize('')
  }

  const handleSelectColor = (color) => {
    setSelectedColor(color)
    if (selectedSize) {
      addSelectedOption(color, selectedSize)
    }
  }

  const handleSelectSize = (size) => {
    if (!selectedColor) {
      setSelectedSize(size)
      return
    }
    setSelectedSize(size)
    addSelectedOption(selectedColor, size)
  }

  const updateOptionQuantity = (optionId, nextQuantity) => {
    setSelectedOptions((prev) =>
      prev.map((item) =>
        item.id === optionId
          ? { ...item, quantity: Math.max(1, nextQuantity) }
          : item
      )
    )
  }

  const removeSelectedOption = (optionId) => {
    setSelectedOptions((prev) => prev.filter((item) => item.id !== optionId))
  }

  const goToImage = (index) => {
    if (!gallery.length) return
    const next = ((index % gallery.length) + gallery.length) % gallery.length
    slideLock.current = false
    setActiveImage(next)
    setSlideAnimated(gallery.length > 1)
    setSlideIndex(gallery.length > 1 ? next + 1 : 0)
  }

  const showPrevImage = () => {
    if (gallery.length <= 1 || slideLock.current) return
    slideLock.current = true
    setSlideAnimated(true)
    setSlideIndex((prev) => prev - 1)
  }

  const showNextImage = () => {
    if (gallery.length <= 1 || slideLock.current) return
    slideLock.current = true
    setSlideAnimated(true)
    setSlideIndex((prev) => prev + 1)
  }

  const handleSlideTransitionEnd = (event) => {
    if (event.target !== event.currentTarget) return

    if (gallery.length <= 1) {
      slideLock.current = false
      return
    }

    if (slideIndex === 0) {
      setSlideAnimated(false)
      setSlideIndex(gallery.length)
      setActiveImage(gallery.length - 1)
      slideLock.current = false
      return
    }

    if (slideIndex === gallery.length + 1) {
      setSlideAnimated(false)
      setSlideIndex(1)
      setActiveImage(0)
      slideLock.current = false
      return
    }

    setActiveImage(slideIndex - 1)
    slideLock.current = false
  }

  const handleGalleryPointerDown = (event) => {
    swipeStartX.current = event.clientX
  }

  const handleGalleryPointerUp = (event) => {
    if (swipeStartX.current == null) return
    const deltaX = event.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(deltaX) < 40) return
    if (deltaX > 0) showPrevImage()
    else showNextImage()
  }

  useEffect(() => {
    if (!product) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target?.id) {
          setActiveTab(visible[0].target.id.replace('detail-', ''))
        }
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.15, 0.35, 0.55],
      }
    )

    DETAIL_TABS.forEach((tab) => {
      const el = sectionRefs.current[tab.id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [product])

  const scrollToTab = (tabId) => {
    setActiveTab(tabId)
    const el = sectionRefs.current[tabId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const discount = getDiscount(product)
  const discountAmount =
    product && discount > 0
      ? Number(product.originalPrice) - Number(product.salePrice)
      : 0
  const unitPrice = Number(product?.salePrice) || 0
  const totalQuantity = selectedOptions.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = selectedOptions.reduce(
    (sum, item) => sum + unitPrice * item.quantity,
    0
  )

  const handleBuy = () => {
    if (!optionsReady) {
      alert('color와 size를 선택해 주세요.')
      return
    }
    alert('바로구매 기능은 준비 중입니다.')
  }

  const handleCart = async () => {
    if (!optionsReady) {
      alert('color와 size를 선택해 주세요.')
      return
    }

    if (!user) {
      alert('로그인 후 장바구니에 담을 수 있습니다.')
      navigate('/login')
      return
    }

    setCartLoading(true)
    try {
      for (const option of selectedOptions) {
        await addItem({
          productId: product.id,
          color: option.color,
          size: option.size,
          quantity: option.quantity,
        })
      }
      setSelectedOptions([])
      setSelectedColor('')
      setSelectedSize('')
      alert(`장바구니에 ${selectedOptions.length}개 옵션을 담았습니다.`)
    } catch (err) {
      alert(err.message || '장바구니 담기에 실패했습니다.')
    } finally {
      setCartLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="product-detail">
        <p className="product-detail__status">상품을 불러오는 중...</p>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="product-detail">
        <p className="product-detail__status product-detail__status--error">
          {error || '상품을 찾을 수 없습니다.'}
        </p>
        <Link to="/" className="product-detail__back">
          메인으로 돌아가기
        </Link>
      </main>
    )
  }

  return (
    <main className="product-detail">
      <div className="product-detail__top">
        <section className="product-detail__gallery" aria-label="상품 이미지">
          <div className="product-detail__thumbs" role="tablist" aria-label="상품 이미지 목록">
            {gallery.map((src, index) => (
              <button
                key={`${product.id}-thumb-${index}`}
                type="button"
                role="tab"
                aria-selected={activeImage === index}
                className={`product-detail__thumb ${activeImage === index ? 'is-active' : ''}`}
                onClick={() => goToImage(index)}
                aria-label={`상품 이미지 ${index + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>

          <div className="product-detail__stage">
            <div
              className="product-detail__main-image"
              onPointerDown={handleGalleryPointerDown}
              onPointerUp={handleGalleryPointerUp}
              onPointerCancel={() => {
                swipeStartX.current = null
              }}
            >
              <div
                className={`product-detail__slider${slideAnimated ? '' : ' is-instant'}`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                onTransitionEnd={handleSlideTransitionEnd}
              >
                {loopSlides.map((src, index) => (
                  <div className="product-detail__slide" key={`${product.id}-slide-${index}`}>
                    <img
                      src={src}
                      alt={`${product.name} 이미지 ${
                        gallery.length <= 1
                          ? 1
                          : ((index - 1 + gallery.length) % gallery.length) + 1
                      }`}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="product-detail__nav product-detail__nav--prev"
                    onClick={showPrevImage}
                    aria-label="이전 이미지"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="product-detail__nav product-detail__nav--next"
                    onClick={showNextImage}
                    aria-label="다음 이미지"
                  >
                    ›
                  </button>

                  <div className="product-detail__dots" aria-hidden="true">
                    {gallery.map((_, index) => (
                      <span
                        key={`${product.id}-dot-${index}`}
                        className={`product-detail__dot ${activeImage === index ? 'is-active' : ''}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className="product-detail__policy">
              등록된 이미지 {gallery.length}장 · 좌우 버튼·스와이프로 확인할 수 있습니다.
            </p>
          </div>
        </section>

        <section className="product-detail__info">
          <div className="product-detail__title-row">
            <h1>{product.name}</h1>
            <span className="product-detail__badge">주문폭주</span>
          </div>
          <p className="product-detail__status-text">
            {(Array.isArray(product.categories) && product.categories.length
              ? product.categories.join(' · ')
              : product.category)}{' '}
            · 바로배송 가능 · 인기 상품
          </p>
          <p className="product-detail__desc">
            {product.description || '데일리로 활용하기 좋은 실루엣과 편안한 착용감을 담았습니다.'}
          </p>

          <dl className="product-detail__price-box">
            <div>
              <dt>판매가</dt>
              <dd className="product-detail__price-original">
                {formatPrice(product.originalPrice)}
              </dd>
            </div>
            <div>
              <dt>할인가</dt>
              <dd className="product-detail__price-sale">
                <strong>{formatPrice(product.salePrice)}</strong>
                {discount > 0 && (
                  <>
                    <span className="product-detail__price-off">
                      {formatPrice(discountAmount)} 할인
                    </span>
                    <span className="product-detail__price-rate">{discount}%</span>
                  </>
                )}
              </dd>
            </div>
          </dl>

          <div className="product-detail__option">
            <p className="product-detail__option-label">color</p>
            <div className="product-detail__colors">
              {colorOptions.length > 0 ? (
                colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`product-detail__color ${
                      selectedColor === color ? 'is-selected' : ''
                    }`}
                    onClick={() => handleSelectColor(color)}
                  >
                    {color}
                  </button>
                ))
              ) : (
                <p className="product-detail__required">등록된 색상이 없습니다.</p>
              )}
            </div>
            <p className="product-detail__required">[필수] color 선택</p>
          </div>

          <div className="product-detail__option">
            <p className="product-detail__option-label">size</p>
            <div className="product-detail__sizes">
              {sizeOptions.length > 0 ? (
                sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`product-detail__size ${
                      selectedSize === size ? 'is-selected' : ''
                    }`}
                    onClick={() => handleSelectSize(size)}
                  >
                    {size}
                  </button>
                ))
              ) : (
                <p className="product-detail__required">등록된 사이즈가 없습니다.</p>
              )}
            </div>
            <p className="product-detail__required">[필수] size 선택</p>
            <ul className="product-detail__notes">
              <li>최소주문수량 1개 이상</li>
              <li>컬러와 사이즈를 고르면 아래에 옵션이 추가됩니다.</li>
            </ul>
          </div>

          <div className="product-detail__selected">
            <h2>선택된 옵션</h2>
            {optionsReady ? (
              <ul className="product-detail__selected-list">
                {selectedOptions.map((option) => (
                  <li key={option.id} className="product-detail__selected-row">
                    <div>
                      <p className="product-detail__selected-name">{product.name}</p>
                      <p className="product-detail__selected-option">
                        color: {option.color} / size: {option.size}
                      </p>
                    </div>
                    <div className="product-detail__qty">
                      <button
                        type="button"
                        onClick={() =>
                          updateOptionQuantity(option.id, option.quantity - 1)
                        }
                        aria-label="수량 감소"
                      >
                        -
                      </button>
                      <span>{option.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateOptionQuantity(option.id, option.quantity + 1)
                        }
                        aria-label="수량 증가"
                      >
                        +
                      </button>
                    </div>
                    <p className="product-detail__selected-price">
                      {formatPrice(unitPrice * option.quantity)}
                    </p>
                    <button
                      type="button"
                      className="product-detail__selected-remove"
                      onClick={() => removeSelectedOption(option.id)}
                      aria-label="선택 옵션 삭제"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="product-detail__selected-empty">컬러와 사이즈를 선택해 주세요.</p>
            )}
          </div>

          <div className="product-detail__total">
            <span>최종 결제금액</span>
            <strong>
              {formatPrice(totalPrice)}
              <em> ({totalQuantity}개)</em>
            </strong>
          </div>

          <div className="product-detail__actions">
            <button type="button" className="product-detail__buy" onClick={handleBuy}>
              바로구매하기
            </button>
            <button
              type="button"
              className="product-detail__cart"
              onClick={handleCart}
              disabled={cartLoading}
            >
              {cartLoading ? '담는 중...' : '장바구니'}
            </button>
            <button type="button" className="product-detail__wish">
              ♡ 관심상품
            </button>
          </div>

          <div className="product-detail__npay">
            <button type="button" className="product-detail__npay-buy">
              N Pay 구매
            </button>
            <button type="button" className="product-detail__npay-like">
              찜
            </button>
          </div>
        </section>
      </div>

      <nav className="product-detail__tabs" aria-label="상품 상세 탭">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`product-detail__tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => scrollToTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        id="detail-size"
        ref={(el) => {
          sectionRefs.current.size = el
        }}
        className="product-detail__panel"
      >
        <h2>사이즈</h2>
        <p className="product-detail__panel-desc">
          단위: cm / 측정 방법에 따라 1~3cm 오차가 있을 수 있습니다.
        </p>
        <div className="product-detail__size-wrap">
          <table className="product-detail__size-table">
            <thead>
              <tr>
                <th>사이즈</th>
                <th>어깨</th>
                <th>가슴</th>
                <th>소매</th>
                <th>총장</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map((row) => (
                <tr key={row.size}>
                  <td>{row.size}</td>
                  <td>{row.shoulder}</td>
                  <td>{row.chest}</td>
                  <td>{row.sleeve}</td>
                  <td>{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="product-detail__panel-notes">
          <li>모델 착용 사이즈: FREE</li>
          <li>신축성이 있는 소재로 체형에 따라 편안하게 착용됩니다.</li>
        </ul>
      </section>

      <section
        id="detail-description"
        ref={(el) => {
          sectionRefs.current.description = el
        }}
        className="product-detail__panel"
      >
        <h2>상품설명</h2>
        <div className="product-detail__desc-card">
          <img src={product.image} alt={product.name} />
          <div>
            <h3>{product.name}</h3>
            <p>
              {product.description ||
                '데일리로 활용하기 좋은 실루엣과 편안한 착용감을 담았습니다.'}
            </p>
            <ul>
              <li>
                카테고리:{' '}
                {Array.isArray(product.categories) && product.categories.length
                  ? product.categories.join(', ')
                  : product.category}
              </li>
              <li>상품 코드: {product.id}</li>
              <li>판매가: {formatPrice(product.originalPrice)}</li>
              <li>할인가: {formatPrice(product.salePrice)}</li>
            </ul>
            <p>
              은은한 실루엣과 착용감을 고려해 제작된 아이템입니다. 단독으로도,
              레이어드 스타일로도 활용하기 좋습니다.
            </p>
          </div>
        </div>
      </section>

      <section
        id="detail-review"
        ref={(el) => {
          sectionRefs.current.review = el
        }}
        className="product-detail__panel product-detail__review"
      >
        <h2>리뷰</h2>
        <div className="product-detail__review-body">
          <div className="product-detail__rating">
            <strong>5.0</strong>
            <span>★★★★★</span>
          </div>
          <div className="product-detail__review-photos">
            {REVIEW_PHOTOS.map((src) => (
              <img key={src} src={src} alt="포토 리뷰" loading="lazy" />
            ))}
          </div>
          <button type="button" className="product-detail__review-next" aria-label="다음 리뷰">
            ›
          </button>
        </div>

        <ul className="product-detail__review-list">
          {TEXT_REVIEWS.map((review) => (
            <li key={review.id}>
              <div className="product-detail__review-meta">
                <strong>{review.user}</strong>
                <span>{'★'.repeat(review.rating)}</span>
                <em>{review.date}</em>
              </div>
              <p>{review.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default ProductDetail
