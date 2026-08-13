import ProductCard from './ProductCard'

function ProductSection({ title, products, gridClass }) {
  return (
    <section className="product-section">
      <h2 className="product-section__title">{title}</h2>
      <div className={`product-section__grid ${gridClass}`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default ProductSection
