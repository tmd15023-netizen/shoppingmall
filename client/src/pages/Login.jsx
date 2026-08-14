import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { setUser, refreshUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)

    try {
      const { user } = await loginUser({
        email: form.email.trim(),
        password: form.password,
      })

      setUser(user)
      await refreshUser()

      alert(`${user.name}님, 로그인되었습니다.`)
      navigate('/')
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSocialLogin = (provider) => {
    alert(`${provider} 로그인은 아직 연동 준비 중입니다.`)
  }

  return (
    <div className="login">
      <div className="login__inner">
        <nav className="login__breadcrumb" aria-label="breadcrumb">
          <Link to="/">Home</Link>
          <span className="login__breadcrumb-sep">&gt;</span>
          <span>로그인</span>
        </nav>

        <header className="login__header">
          <h1>로그인</h1>
        </header>

        <form className="login__form" onSubmit={handleSubmit}>
          <table className="login__table">
            <tbody>
              <tr>
                <th>E-mail</th>
                <td>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </td>
              </tr>
              <tr>
                <th>비밀번호</th>
                <td>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {error && <p className="login__error">{error}</p>}

          <div className="login__actions">
            <button type="submit" className="login__submit" disabled={submitting}>
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>

        <div className="login__divider">
          <span>또는</span>
        </div>

        <div className="login__social">
          <button
            type="button"
            className="login__social-btn login__social-btn--google"
            onClick={() => handleSocialLogin('Google')}
          >
            Google로 로그인
          </button>
          <button
            type="button"
            className="login__social-btn login__social-btn--naver"
            onClick={() => handleSocialLogin('네이버')}
          >
            네이버로 로그인
          </button>
        </div>

        <p className="login__signup-prompt">
          아직 계정이 없으신가요?{' '}
          <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
