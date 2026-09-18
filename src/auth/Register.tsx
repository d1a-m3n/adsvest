import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import '../styles/register.css'
import '../styles/alert.css'
import Alert from '../components/Alert'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  // Automatically read the referral code from the URL.
  // Example: /register?ref=ADV8F3A21
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ref')?.trim().toUpperCase() || ''
  })

  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setAlert(null)

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
            confirmPassword,
            referralCode:
              referralCode.trim().toUpperCase() || undefined,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setAlert({
          type: 'error',
          message: data.message || 'Registration failed',
        })

        return
      }

      setAlert({
        type: 'success',
        message:
          data.message ||
          'Registration successful! Please check your email to verify your account.',
      })
    } catch (error) {
      console.error('Registration error:', error)

      setAlert({
        type: 'error',
        message: 'Unable to connect to the server',
      })
    }
  }

  return (
    <div className="register-page">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="register-card">
        <div className="register-heading">
          <h1>Create your Advest account</h1>

          <p>
            Register to access opportunities and start earning rewards.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full name</label>

            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

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
            <label htmlFor="phone">Phone number</label>

            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={
                  showConfirmPassword ? 'text' : 'password'
                }
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current,
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="referralCode">
              Referral code <span>(optional)</span>
            </label>

            <input
              id="referralCode"
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(event) =>
                setReferralCode(
                  event.target.value.toUpperCase(),
                )
              }
            />
          </div>

          <button type="submit">
            Continue
          </button>
        </form>

        <p className="register-login">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register