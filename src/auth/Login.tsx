import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import '../styles/login.css'
import '../styles/alert.css'
import Alert from '../components/Alert'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  useEffect(() => {
    const verified = searchParams.get('verified')

    if (verified === 'true') {
      setAlert({
        type: 'success',
        message:
          'Email verified successfully! You can now log in.',
      })

      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setAlert(null)

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setAlert({
          type: 'error',
          message: data.message || 'Login failed',
        })

        return
      }

      login(data.data.token, data.data)

      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)

      setAlert({
        type: 'error',
        message: 'Unable to connect to the server',
      })
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-heading">
          <h1>Welcome back</h1>

          <p>
            Log in to your Advest account to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button type="submit">
            Log in
          </button>
        </form>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            inline
            onClose={() => setAlert(null)}
          />
        )}

        <p className="login-register">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default Login