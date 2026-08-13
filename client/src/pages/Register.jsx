import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUser } from '../api/userApi'
import './Register.css'

const initialForm = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  address: '',
  agreeTerms: false,
  agreePrivacy: false,
}

const PASSWORD_RULE =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.name || !form.password) {
      setError('이메일, 이름, 비밀번호는 필수입니다.')
      return
    }

    if (!PASSWORD_RULE.test(form.password)) {
      setError('비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.')
      return
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (!form.agreeTerms || !form.agreePrivacy) {
      setError('필수 약관에 동의해 주세요.')
      return
    }

    setSubmitting(true)

    try {
      // 서버 User 컨트롤러(POST /api/users)로 저장
      const savedUser = await createUser({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        level: 'customer',
      })

      console.log('저장된 유저:', savedUser)
      alert('회원가입이 완료되었습니다. 로그인해 주세요.')
      navigate('/login')
    } catch (err) {
      setError(err.message || '서버에 저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="register">
      <div className="register__inner">
        <nav className="register__breadcrumb" aria-label="breadcrumb">
          <Link to="/">Home</Link>
          <span className="register__breadcrumb-sep">&gt;</span>
          <span>회원정보 입력</span>
        </nav>

        <header className="register__header">
          <h1>회원정보 입력</h1>
          <p className="register__required-note">
            <span className="required">*</span> 필수입력사항
          </p>
        </header>

        <form className="register__form" onSubmit={handleSubmit}>
          <table className="register__table">
            <tbody>
              <tr>
                <th>
                  <span className="required">*</span> E-mail
                </th>
                <td>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                  <p className="register__hint">로그인 시 사용할 이메일을 입력해 주세요.</p>
                </td>
              </tr>

              <tr>
                <th>
                  <span className="required">*</span> 비밀번호
                </th>
                <td>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <p className="register__hint">
                    (8자 이상, 영문/숫자/특수문자 포함)
                  </p>
                </td>
              </tr>

              <tr>
                <th>
                  <span className="required">*</span> 비밀번호 확인
                </th>
                <td>
                  <input
                    type="password"
                    name="passwordConfirm"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </td>
              </tr>

              <tr>
                <th>
                  <span className="required">*</span> 이름
                </th>
                <td>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </td>
              </tr>

              <tr>
                <th>휴대전화</th>
                <td>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder="010-1234-5678"
                  />
                </td>
              </tr>

              <tr>
                <th>주소</th>
                <td>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                    className="register__input--wide"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <section className="register__terms" aria-label="이용약관 동의">
            <label className="register__terms-item">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
              />
              <span>
                이용약관 동의 <span className="required">(필수)</span>
              </span>
            </label>
            <label className="register__terms-item">
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={form.agreePrivacy}
                onChange={handleChange}
              />
              <span>
                개인정보 수집 및 이용 동의 <span className="required">(필수)</span>
              </span>
            </label>
          </section>

          {error && <p className="register__error">{error}</p>}

          <div className="register__actions">
            <button type="submit" className="register__submit" disabled={submitting}>
              {submitting ? '저장 중...' : '회원가입하기'}
            </button>
            <Link to="/" className="register__cancel">
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
