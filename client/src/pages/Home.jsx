import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Hero from '../components/Hero'
import ProductSection from '../components/ProductSection'
import { getProducts } from '../api/productApi'
import { PRODUCT_CATEGORIES } from '../data/products'
import './Home.css'

function withDiscount(products) {
  return products.map((product) => {
    const original = Number(product.originalPrice) || 0
    const sale = Number(product.salePrice) || 0
    const discount =
      original > 0 && sale < original
        ? Math.round(((original - sale) / original) * 100)
        : 0

    return { ...product, discount }
  })
}

function Home() {
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || ''
  const isValidCategory = PRODUCT_CATEGORIES.includes(selectedCategory)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    getProducts(isValidCategory ? selectedCategory : undefined)
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '상품을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedCategory, isValidCategory])

  const discounted = useMemo(() => withDiscount(products), [products])

  const { bestProducts, newArrivals } = useMemo(() => {
    const newest = [...discounted].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || 0).getTime()
      return bTime - aTime
    })

    const best = [...discounted].sort((a, b) => {
      if (b.discount !== a.discount) return b.discount - a.discount
      return (Number(b.salePrice) || 0) - (Number(a.salePrice) || 0)
    })

    return {
      bestProducts: best.slice(0, 8),
      newArrivals: newest.slice(0, 8),
    }
  }, [discounted])

  return (
    <div className="home-page">
      {!isValidCategory && <Hero />}

      {loading && <p className="home-page__status">상품을 불러오는 중...</p>}
      {error && <p className="home-page__status home-page__status--error">{error}</p>}

      {!loading && !error && isValidCategory && (
        discounted.length > 0 ? (
          <ProductSection
            title={selectedCategory}
            products={discounted}
            gridClass="product-section__grid--best"
          />
        ) : (
          <p className="home-page__status">
            &apos;{selectedCategory}&apos; 카테고리에 등록된 상품이 없습니다.
          </p>
        )
      )}

      {!loading && !error && !isValidCategory && products.length === 0 && (
        <p className="home-page__status">
          등록된 상품이 없습니다. 어드민에서 상품을 등록해 주세요.
        </p>
      )}

      {!loading && !error && !isValidCategory && bestProducts.length > 0 && (
        <ProductSection
          title="BEST"
          products={bestProducts}
          gridClass="product-section__grid--best"
        />
      )}

      {!loading && !error && !isValidCategory && newArrivals.length > 0 && (
        <ProductSection
          title="NEW ARRIVALS"
          products={newArrivals}
          gridClass="product-section__grid--new"
        />
      )}
    </div>
  )
}

export default Home
