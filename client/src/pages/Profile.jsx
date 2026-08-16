import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { updateMyProfile } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'
import { setStoredUser } from '../utils/auth'
import './Profile.css'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

const emptyForm = {
  email: '',
  name: '',
  phone: '',
  address: '',
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
}

function Profile() {
  const navigate = useNavigate()
  const { user, loading: authLoading, setUser, refreshUser } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    setForm({
      email: user.email || '',
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    })
  }, [user, authLoading, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.name.trim()) {
      setError('이름은 필수입니다.')
      return
    }

    const changingPassword = Boolean(form.newPassword || form.newPasswordConfirm)

    if (changingPassword) {
      if (!form.currentPassword) {
        setError('비밀번호를 변경하려면 현재 비밀번호를 입력해 주세요.')
        return
      }
      if (!PASSWORD_RULE.test(form.newPassword)) {
        setError('새 비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.')
        return
      }
      if (form.newPassword !== form.newPasswordConfirm) {
        setError('새 비밀번호가 일치하지 않습니다.')
        return
      }
    }

    setSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      }

      if (changingPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }

      const data = await updateMyProfile(payload)
      const nextUser = data.user || data

      setStoredUser(nextUser)
      setUser(nextUser)
      await refreshUser()

      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
        name: nextUser.name || prev.name,
        phone: nextUser.phone || '',
        address: nextUser.address || '',
      }))

      setMessage(data.message || '회원정보가 수정되었습니다.')
    } catch (err) {
      setError(err.message || '회원정보 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !user) {
    return (
      <main className="profile">
        <p className="profile__status">회원정보를 불러오는 중...</p>
      </main>
    )
  }

  return (
    <main className="profile">
      <div className="profile__inner">
        <nav className="profile__breadcrumb" aria-label="breadcrumb">
          <Link to="/">Home</Link>
          <span className="profile__breadcrumb-sep">&gt;</span>
          <span>회원정보 수정</span>
        </nav>

        <header className="profile__header">
          <h1>회원정보 수정</h1>
          <p className="profile__note">이름, 연락처, 주소, 비밀번호를 변경할 수 있습니다.</p>
        </header>

        <form className="profile__form" onSubmit={handleSubmit}>
          <table className="profile__table">
            <tbody>
              <tr>
                <th>E-mail</th>
                <td>
                  <input type="email" value={form.email} disabled readOnly />
                  <p className="profile__hint">이메일은 변경할 수 없습니다.</p>
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
                <th>휴대폰</th>
                <td>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                  />
                </td>
              </tr>

              <tr>
                <th>주소</th>
                <td>
                  <input
                    type="text"
                    name="address"
                    className="profile__input--wide"
                    value={form.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                    placeholder="배송지 주소를 입력해 주세요"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <section className="profile__password" aria-labelledby="password-heading">
            <h2 id="password-heading">비밀번호 변경</h2>
            <p className="profile__hint">변경하지 않으려면 아래 칸을 비워 두세요.</p>

            <table className="profile__table">
              <tbody>
                <tr>
                  <th>현재 비밀번호</th>
                  <td>
                    <input
                      type="password"
                      name="currentPassword"
                      value={form.currentPassword}
                      onChange={handleChange}
                      autoComplete="current-password"
                    />
                  </td>
                </tr>
                <tr>
                  <th>새 비밀번호</th>
                  <td>
                    <input
                      type="password"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <p className="profile__hint">
                      8자 이상, 영문/숫자/특수문자 포함
                    </p>
                  </td>
                </tr>
                <tr>
                  <th>새 비밀번호 확인</th>
                  <td>
                    <input
                      type="password"
                      name="newPasswordConfirm"
                      value={form.newPasswordConfirm}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {error && <p className="profile__error">{error}</p>}
          {message && <p className="profile__success">{message}</p>}

          <div className="profile__actions">
            <button type="submit" className="profile__submit" disabled={submitting}>
              {submitting ? '저장 중...' : '저장하기'}
            </button>
            <Link to="/" className="profile__cancel">
              취소
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Profile
