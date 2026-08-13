import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import './ProductCard.css'

function getDiscount(product) {
  if (typeof product.discount === 'number') return product.discount

  const original = Number(product.originalPrice) || 0
  const sale = Number(product.salePrice) || 0
  if (original <= 0 || sale >= original) return 0
  return Math.round(((original - sale) / original) * 100)
}

function ProductCard({ product }) {
  const discount = getDiscount(product)
  const colors = Array.isArray(product.colors) ? product.colors : []
  const rating = typeof product.rating === 'number' ? product.rating : null
  const reviews = typeof product.reviews === 'number' ? product.reviews : null

  return (
    <Link to={`/product/${encodeURIComponent(product.id)}`} className="product-card">
      <div className="product-card__thumb">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      <h3 className="product-card__name">{product.name}</h3>
      {product.description ? (
        <p className="product-card__desc">{product.description}</p>
      ) : null}
      <div className="product-card__price">
        <span className="product-card__original">{formatPrice(product.originalPrice)}</span>
        <span className="product-card__sale">{formatPrice(product.salePrice)}</span>
        {discount > 0 ? <span className="product-card__discount">{discount}%</span> : null}
      </div>
      {product.badge ? <p className="product-card__badge">{product.badge}</p> : null}
      {Array.isArray(product.categories) && product.categories.length > 0 ? (
        <p className="product-card__category">{product.categories.join(' · ')}</p>
      ) : product.category ? (
        <p className="product-card__category">{product.category}</p>
      ) : null}
      {colors.length > 0 ? (
        <div className="product-card__colors">
          {colors.map((color) => (
            <span
              key={`${product.id}-${color}`}
              className="product-card__swatch"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : null}
      {rating != null ? (
        <p className="product-card__rating">
          <span className="product-card__star">★</span>
          {rating.toFixed(1)}
          {reviews != null ? (
            <span className="product-card__reviews">| 리뷰 {reviews}건</span>
          ) : null}
        </p>
      ) : null}
    </Link>
  )
}

export default ProductCard
