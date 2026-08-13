import { useEffect, useMemo, useState } from 'react'
import { deleteProduct, getProducts, updateProduct } from '../api/productApi'
import { formatWon } from '../data/adminMock'
import { PRODUCT_CATEGORIES } from '../data/products'
import { openCloudinaryUploadWidget } from '../utils/cloudinary'
import './AdminProductList.css'

const CATEGORY_TABS = ['전체', ...PRODUCT_CATEGORIES]
const PAGE_SIZE_OPTIONS = [10, 20, 40]
const MAX_IMAGES = 6
const SIZE_OPTIONS = ['FREE', 'S', 'M', 'L']

function getProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length) {
    return product.images.filter(Boolean).slice(0, MAX_IMAGES)
  }
  return product?.image ? [product.image] : []
}

function getProductCategories(product) {
  if (Array.isArray(product?.categories) && product.categories.length) {
    return product.categories.filter(Boolean)
  }
  return product?.category ? [product.category] : []
}

function productHasCategory(product, categoryName) {
  return getProductCategories(product).includes(categoryName)
}

function AdminProductList({ onGoRegister, onGoDashboard }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('전체')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [colorInput, setColorInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [saving, setSaving] = useState(false)

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || '상품 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [category, pageSize])

  const filteredProducts = useMemo(() => {
    if (category === '전체') return products
    return products.filter((product) => productHasCategory(product, category))
  }, [products, category])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleDelete = async (id) => {
    if (!window.confirm(`상품 ${id}을(를) 삭제할까요?`)) return

    setError('')
    setMessage('')

    try {
      await deleteProduct(id)
      setMessage('상품이 삭제되었습니다.')
      await loadProducts()
    } catch (err) {
      setError(err.message || '상품 삭제에 실패했습니다.')
    }
  }

  const openEdit = (product) => {
    setEditing({
      id: product.id,
      name: product.name || '',
      originalPrice: product.originalPrice ?? '',
      salePrice: product.salePrice ?? '',
      categories: getProductCategories(product),
      images: getProductImages(product),
      colors: Array.isArray(product.colors) ? product.colors.filter(Boolean) : [],
      sizes:
        Array.isArray(product.sizes) && product.sizes.length
          ? product.sizes.filter(Boolean)
          : [...SIZE_OPTIONS],
      description: product.description || '',
    })
    setColorInput('')
    setSizeInput('')
    setError('')
    setMessage('')
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditing((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggleEditCategory = (categoryName) => {
    setEditing((prev) => {
      if (!prev) return prev
      const selected = prev.categories.includes(categoryName)
        ? prev.categories.filter((item) => item !== categoryName)
        : [...prev.categories, categoryName]
      return { ...prev, categories: selected }
    })
  }

  const handleAddEditImage = async () => {
    if (!editing) return
    if (editing.images.length >= MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있습니다.`)
      return
    }

    try {
      await openCloudinaryUploadWidget({
        onSuccess: (imageUrl) => {
          setEditing((prev) => {
            if (!prev || prev.images.length >= MAX_IMAGES) return prev
            if (prev.images.includes(imageUrl)) return prev
            return { ...prev, images: [...prev.images, imageUrl] }
          })
        },
        onError: (err) => {
          setError(err?.message || '이미지 업로드에 실패했습니다.')
        },
      })
    } catch (err) {
      setError(err.message || '이미지 업로드에 실패했습니다.')
    }
  }

  const handleRemoveEditImage = (index) => {
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }
    })
  }

  const handleAddEditColor = () => {
    const nextColors = colorInput
      .split(/[,|/]/)
      .map((color) => color.trim())
      .filter(Boolean)

    if (!nextColors.length) {
      setError('추가할 색상을 입력해 주세요.')
      return
    }

    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        colors: [...new Set([...prev.colors, ...nextColors])],
      }
    })
    setColorInput('')
    setError('')
  }

  const handleRemoveEditColor = (index) => {
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        colors: prev.colors.filter((_, i) => i !== index),
      }
    })
  }

  const handleToggleEditSize = (size) => {
    setEditing((prev) => {
      if (!prev) return prev
      const selected = prev.sizes.includes(size)
        ? prev.sizes.filter((item) => item !== size)
        : [...prev.sizes, size]
      return { ...prev, sizes: selected }
    })
  }

  const handleAddEditSize = () => {
    const nextSizes = sizeInput
      .split(/[,|/]/)
      .map((size) => size.trim())
      .filter(Boolean)

    if (!nextSizes.length) {
      setError('추가할 사이즈를 입력해 주세요.')
      return
    }

    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sizes: [...new Set([...prev.sizes, ...nextSizes])],
      }
    })
    setSizeInput('')
    setError('')
  }

  const handleRemoveEditSize = (index) => {
    setEditing((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index),
      }
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editing) return

    const images = editing.images.map((url) => url.trim()).filter(Boolean).slice(0, MAX_IMAGES)
    const colors = editing.colors.map((color) => color.trim()).filter(Boolean)
    const sizes = editing.sizes.map((size) => size.trim()).filter(Boolean)
    if (!images.length) {
      setError('이미지는 최소 1장 필요합니다.')
      return
    }
    if (!colors.length) {
      setError('색상은 최소 1개 필요합니다.')
      return
    }
    if (!sizes.length) {
      setError('사이즈는 최소 1개 필요합니다.')
      return
    }
    if (!editing.categories.length) {
      setError('카테고리는 최소 1개 필요합니다.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await updateProduct(editing.id, {
        name: editing.name.trim(),
        originalPrice: Number(editing.originalPrice),
        salePrice: Number(editing.salePrice),
        category: editing.categories[0],
        categories: editing.categories,
        image: images[0],
        images,
        colors,
        sizes,
        description: editing.description.trim(),
      })
      setMessage('상품이 수정되었습니다.')
      setEditing(null)
      setColorInput('')
      setSizeInput('')
      await loadProducts()
    } catch (err) {
      setError(err.message || '상품 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="product-inquiry">
      <header className="product-inquiry__header">
        <div>
          <p className="product-inquiry__eyebrow">PRODUCT MANAGEMENT</p>
          <h2>상품 조회</h2>
          <p className="product-inquiry__sub">
            등록된 상품을 카테고리별로 확인하고 관리하세요.
          </p>
        </div>
        <div className="product-inquiry__actions">
          <button type="button" className="product-inquiry__btn-primary" onClick={onGoRegister}>
            새상품 등록하기
          </button>
          <button type="button" className="product-inquiry__btn-secondary" onClick={onGoDashboard}>
            대시보드로
          </button>
        </div>
      </header>

      <div className="product-inquiry__filters">
        <div className="product-inquiry__tabs" role="tablist" aria-label="상품 카테고리">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={category === tab}
              className={`product-inquiry__tab ${category === tab ? 'is-active' : ''}`}
              onClick={() => setCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="product-inquiry__meta-group">
          <label className="product-inquiry__page-size">
            페이지당
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="페이지당 상품 수"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}개
                </option>
              ))}
            </select>
          </label>
          <p className="product-inquiry__meta">
            총 {filteredProducts.length}개 · {currentPage}/{totalPages}페이지
          </p>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      {loading ? (
        <p>상품 불러오는 중...</p>
      ) : (
        <div className="product-inquiry__table-wrap">
          <table className="product-inquiry__table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>상품 아이디</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>설명</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="product-inquiry__empty">
                    조회된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                pagedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        className="product-inquiry__thumb"
                        src={product.image}
                        alt={product.name}
                      />
                    </td>
                    <td>{product.id}</td>
                    <td className="product-inquiry__name">{product.name}</td>
                    <td>
                      <div className="product-inquiry__badge-list">
                        {getProductCategories(product).map((item) => (
                          <span key={`${product.id}-${item}`} className="product-inquiry__badge">
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{formatWon(product.salePrice)}</td>
                    <td>{product.description || '-'}</td>
                    <td>
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                    <td>
                      <div className="product-inquiry__row-actions">
                        <button
                          type="button"
                          className="product-inquiry__btn-edit"
                          onClick={() => openEdit(product)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="product-inquiry__btn-delete"
                          onClick={() => handleDelete(product.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="product-inquiry__pagination">
        <button
          type="button"
          className="product-inquiry__page-btn"
          disabled={currentPage <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          이전
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="product-inquiry__page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          다음
        </button>
      </div>

      {editing && (
        <div className="product-inquiry__modal-backdrop" role="presentation">
          <form className="product-inquiry__modal" onSubmit={handleSaveEdit}>
            <h3>상품 수정</h3>
            <p className="product-inquiry__modal-id">ID: {editing.id}</p>

            <label>
              상품명
              <input name="name" value={editing.name} onChange={handleEditChange} required />
            </label>
            <label>
              정가
              <input
                type="number"
                name="originalPrice"
                min="0"
                value={editing.originalPrice}
                onChange={handleEditChange}
                required
              />
            </label>
            <label>
              판매가
              <input
                type="number"
                name="salePrice"
                min="0"
                value={editing.salePrice}
                onChange={handleEditChange}
                required
              />
            </label>
            <div className="product-inquiry__modal-categories">
              <span>카테고리 * ({editing.categories.length})</span>
              <div className="admin-category-field__list">
                {[
                  ...PRODUCT_CATEGORIES,
                  ...editing.categories.filter((item) => !PRODUCT_CATEGORIES.includes(item)),
                ].map((item) => {
                  const checked = editing.categories.includes(item)
                  return (
                    <label
                      key={item}
                      className={`admin-category-chip${checked ? ' is-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleEditCategory(item)}
                      />
                      <span>{item}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <label>
              설명
              <textarea
                name="description"
                rows={3}
                value={editing.description}
                onChange={handleEditChange}
              />
            </label>

            <div className="product-inquiry__modal-colors">
              <div className="product-inquiry__modal-images-head">
                <span>색상 ({editing.colors.length})</span>
              </div>
              <div className="product-inquiry__color-row">
                <input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddEditColor()
                    }
                  }}
                  placeholder="예: 아이보리, 블랙"
                />
                <button
                  type="button"
                  className="product-inquiry__btn-secondary"
                  onClick={handleAddEditColor}
                >
                  색상 추가
                </button>
              </div>
              {editing.colors.length > 0 ? (
                <ul className="product-inquiry__color-chips">
                  {editing.colors.map((color, index) => (
                    <li key={`${color}-${index}`}>
                      <span>{color}</span>
                      <button type="button" onClick={() => handleRemoveEditColor(index)}>
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="product-inquiry__image-empty">색상을 1개 이상 추가해 주세요.</p>
              )}
            </div>

            <div className="product-inquiry__modal-colors">
              <div className="product-inquiry__modal-images-head">
                <span>사이즈 ({editing.sizes.length})</span>
              </div>
              <div className="admin-category-field__list">
                {SIZE_OPTIONS.map((size) => {
                  const checked = editing.sizes.includes(size)
                  return (
                    <label
                      key={size}
                      className={`admin-category-chip${checked ? ' is-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleEditSize(size)}
                      />
                      <span>{size}</span>
                    </label>
                  )
                })}
              </div>
              <div className="product-inquiry__color-row">
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddEditSize()
                    }
                  }}
                  placeholder="예: XL, 28"
                />
                <button
                  type="button"
                  className="product-inquiry__btn-secondary"
                  onClick={handleAddEditSize}
                >
                  사이즈 추가
                </button>
              </div>
              {editing.sizes.length > 0 ? (
                <ul className="product-inquiry__color-chips">
                  {editing.sizes.map((size, index) => (
                    <li key={`${size}-${index}`}>
                      <span>{size}</span>
                      <button type="button" onClick={() => handleRemoveEditSize(index)}>
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="product-inquiry__image-empty">사이즈를 1개 이상 선택해 주세요.</p>
              )}
            </div>

            <div className="product-inquiry__modal-images">
              <div className="product-inquiry__modal-images-head">
                <span>
                  상품 이미지 ({editing.images.length}/{MAX_IMAGES})
                </span>
                <button
                  type="button"
                  className="product-inquiry__btn-secondary"
                  onClick={handleAddEditImage}
                  disabled={editing.images.length >= MAX_IMAGES}
                >
                  이미지 추가
                </button>
              </div>
              {editing.images.length > 0 ? (
                <ul className="product-inquiry__image-grid">
                  {editing.images.map((src, index) => (
                    <li key={`${src}-${index}`}>
                      <img src={src} alt={`상품 이미지 ${index + 1}`} />
                      {index === 0 && <span>대표</span>}
                      <button type="button" onClick={() => handleRemoveEditImage(index)}>
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="product-inquiry__image-empty">이미지를 1장 이상 추가해 주세요.</p>
              )}
            </div>

            <div className="product-inquiry__modal-actions">
              <button
                type="button"
                className="product-inquiry__btn-secondary"
                onClick={() => setEditing(null)}
              >
                취소
              </button>
              <button type="submit" className="product-inquiry__btn-primary" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AdminProductList
