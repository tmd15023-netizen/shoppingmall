import { useState } from 'react'
import { createProduct } from '../api/productApi'
import {
  getMissingCloudinaryEnvKeys,
  isCloudinaryConfigured,
} from '../config/cloudinaryEnv'
import { PRODUCT_CATEGORIES } from '../data/products'
import { openCloudinaryUploadWidget } from '../utils/cloudinary'

const MAX_IMAGES = 6
const SIZE_OPTIONS = ['FREE', 'S', 'M', 'L']

const initialForm = {
  id: '',
  name: '',
  originalPrice: '',
  salePrice: '',
  categories: [],
  images: [],
  colors: [],
  sizes: [],
  description: '',
}

function AdminProducts({ onRegistered }) {
  const [form, setForm] = useState(initialForm)
  const [colorInput, setColorInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const cloudinaryReady = isCloudinaryConfigured()
  const missingCloudinaryKeys = getMissingCloudinaryEnvKeys()
  const canAddMore = form.images.length < MAX_IMAGES

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggleCategory = (category) => {
    setForm((prev) => {
      const selected = prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category]
      return { ...prev, categories: selected }
    })
  }

  const handleAddColor = () => {
    const nextColors = colorInput
      .split(/[,|/]/)
      .map((color) => color.trim())
      .filter(Boolean)

    if (!nextColors.length) {
      setError('추가할 색상을 입력해 주세요.')
      return
    }

    setForm((prev) => ({
      ...prev,
      colors: [...new Set([...prev.colors, ...nextColors])],
    }))
    setColorInput('')
    setError('')
  }

  const handleRemoveColor = (index) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }

  const handleToggleSize = (size) => {
    setForm((prev) => {
      const selected = prev.sizes.includes(size)
        ? prev.sizes.filter((item) => item !== size)
        : [...prev.sizes, size]
      return { ...prev, sizes: selected }
    })
  }

  const handleAddSize = () => {
    const nextSizes = sizeInput
      .split(/[,|/]/)
      .map((size) => size.trim())
      .filter(Boolean)

    if (!nextSizes.length) {
      setError('추가할 사이즈를 입력해 주세요.')
      return
    }

    setForm((prev) => ({
      ...prev,
      sizes: [...new Set([...prev.sizes, ...nextSizes])],
    }))
    setSizeInput('')
    setError('')
  }

  const handleRemoveSize = (index) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  const handleUploadImage = async () => {
    if (!canAddMore) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있습니다.`)
      return
    }

    setError('')
    setMessage('')
    setUploading(true)

    try {
      await openCloudinaryUploadWidget({
        onSuccess: (imageUrl) => {
          setForm((prev) => {
            if (prev.images.length >= MAX_IMAGES) return prev
            if (prev.images.includes(imageUrl)) return prev
            return { ...prev, images: [...prev.images, imageUrl] }
          })
          setMessage('이미지가 추가되었습니다.')
          setUploading(false)
        },
        onError: (err) => {
          setError(err?.message || '이미지 업로드에 실패했습니다.')
          setUploading(false)
        },
        onClose: () => {
          setUploading(false)
        },
      })
    } catch (err) {
      setError(err.message || '이미지 업로드에 실패했습니다.')
      setUploading(false)
    }
  }

  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (
      !form.id ||
      !form.name ||
      form.originalPrice === '' ||
      form.salePrice === '' ||
      form.categories.length === 0 ||
      form.images.length === 0 ||
      form.colors.length === 0 ||
      form.sizes.length === 0
    ) {
      setError('id, 이름, 정가, 판매가, 카테고리, 이미지, 색상, 사이즈는 필수입니다.')
      return
    }

    setSubmitting(true)

    try {
      const images = form.images.map((url) => url.trim()).filter(Boolean).slice(0, MAX_IMAGES)
      await createProduct({
        id: form.id.trim(),
        name: form.name.trim(),
        originalPrice: Number(form.originalPrice),
        salePrice: Number(form.salePrice),
        category: form.categories[0],
        categories: form.categories,
        image: images[0],
        images,
        colors: form.colors,
        sizes: form.sizes,
        description: form.description.trim(),
      })
      setMessage('상품이 등록되었습니다.')
      setForm(initialForm)
      setColorInput('')
      setSizeInput('')
      onRegistered?.()
    } catch (err) {
      setError(err.message || '상품 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="admin-content__header">
        <h2>상품 등록</h2>
        <p>상품 정보를 입력하고 Cloudinary로 이미지를 최대 {MAX_IMAGES}장까지 업로드해 등록하세요.</p>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__grid">
          <label>
            상품 ID *
            <input
              name="id"
              value={form.id}
              onChange={handleChange}
              placeholder="예: P-001"
              required
            />
          </label>
          <label>
            상품명 *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="상품 이름"
              required
            />
          </label>
          <label>
            정가 *
            <input
              type="number"
              name="originalPrice"
              min="0"
              value={form.originalPrice}
              onChange={handleChange}
              placeholder="39000"
              required
            />
          </label>
          <label>
            판매가 *
            <input
              type="number"
              name="salePrice"
              min="0"
              value={form.salePrice}
              onChange={handleChange}
              placeholder="29000"
              required
            />
          </label>
          <div className="admin-form__full admin-category-field">
            <span className="admin-image-field__label">
              카테고리 * ({form.categories.length})
            </span>
            <p className="admin-image-field__hint">
              여러 카테고리를 선택할 수 있습니다. 선택한 카테고리는 상단 메뉴 클릭 시 상품이 노출됩니다.
            </p>
            <div className="admin-category-field__list">
              {PRODUCT_CATEGORIES.map((category) => {
                const checked = form.categories.includes(category)
                return (
                  <label
                    key={category}
                    className={`admin-category-chip${checked ? ' is-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleCategory(category)}
                    />
                    <span>{category}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="admin-form__full admin-color-field">
            <span className="admin-image-field__label">색상 * ({form.colors.length})</span>
            <p className="admin-image-field__hint">
              상품 상세에 표시될 색상만 입력하세요. 여러 개는 쉼표로 구분해 한 번에 추가할 수 있습니다.
            </p>
            <div className="admin-color-field__row">
              <input
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddColor()
                  }
                }}
                placeholder="예: 아이보리, 블랙"
              />
              <button type="button" className="admin-upload-btn" onClick={handleAddColor}>
                색상 추가
              </button>
            </div>
            {form.colors.length > 0 ? (
              <ul className="admin-color-chips">
                {form.colors.map((color, index) => (
                  <li key={`${color}-${index}`}>
                    <span>{color}</span>
                    <button type="button" onClick={() => handleRemoveColor(index)}>
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-image-field__hint">아직 추가된 색상이 없습니다.</p>
            )}
          </div>

          <div className="admin-form__full admin-color-field">
            <span className="admin-image-field__label">사이즈 * ({form.sizes.length})</span>
            <p className="admin-image-field__hint">
              상품 상세에 표시될 사이즈를 선택하세요. 필요하면 직접 입력해 추가할 수도 있습니다.
            </p>
            <div className="admin-category-field__list">
              {SIZE_OPTIONS.map((size) => {
                const checked = form.sizes.includes(size)
                return (
                  <label
                    key={size}
                    className={`admin-category-chip${checked ? ' is-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleSize(size)}
                    />
                    <span>{size}</span>
                  </label>
                )
              })}
            </div>
            <div className="admin-color-field__row">
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSize()
                  }
                }}
                placeholder="예: XL, 28"
              />
              <button type="button" className="admin-upload-btn" onClick={handleAddSize}>
                사이즈 추가
              </button>
            </div>
            {form.sizes.length > 0 ? (
              <ul className="admin-color-chips">
                {form.sizes.map((size, index) => (
                  <li key={`${size}-${index}`}>
                    <span>{size}</span>
                    <button type="button" onClick={() => handleRemoveSize(index)}>
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-image-field__hint">아직 추가된 사이즈가 없습니다.</p>
            )}
          </div>

          <div className="admin-form__full admin-image-field">
            <span className="admin-image-field__label">
              상품 이미지 * ({form.images.length}/{MAX_IMAGES})
            </span>
            <p className="admin-image-field__hint">
              첫 번째 이미지가 대표 이미지로 사용됩니다. 최대 {MAX_IMAGES}장까지 추가할 수 있습니다.
            </p>

            <div className="admin-image-field__actions">
              <button
                type="button"
                className="admin-upload-btn"
                onClick={handleUploadImage}
                disabled={uploading || !cloudinaryReady || !canAddMore}
              >
                {uploading
                  ? '위젯 여는 중...'
                  : canAddMore
                    ? '이미지 추가 업로드'
                    : `최대 ${MAX_IMAGES}장까지 등록됨`}
              </button>
            </div>

            {!cloudinaryReady && (
              <p className="admin-error">
                Cloudinary 환경변수 필요: {missingCloudinaryKeys.join(', ')}
                {' '}(client/.env 설정 후 Vite 재시작)
              </p>
            )}

            {form.images.length > 0 ? (
              <ul className="admin-image-grid">
                {form.images.map((src, index) => (
                  <li key={`${src}-${index}`} className="admin-image-grid__item">
                    <img src={src} alt={`상품 이미지 ${index + 1}`} />
                    {index === 0 && <span className="admin-image-grid__badge">대표</span>}
                    <button
                      type="button"
                      className="admin-image-grid__remove"
                      onClick={() => handleRemoveImage(index)}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="admin-image-preview admin-image-preview--empty">
                업로드한 이미지가 여기에 미리보기로 표시됩니다.
              </div>
            )}
          </div>

          <label className="admin-form__full">
            설명 (선택)
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="상품 설명"
            />
          </label>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {message && <p className="admin-success">{message}</p>}

        <button
          type="submit"
          className="admin-form__submit"
          disabled={
            submitting ||
            form.images.length === 0 ||
            form.colors.length === 0 ||
            form.sizes.length === 0
          }
        >
          {submitting ? '등록 중...' : '상품 등록하기'}
        </button>
      </form>
    </>
  )
}

export default AdminProducts
