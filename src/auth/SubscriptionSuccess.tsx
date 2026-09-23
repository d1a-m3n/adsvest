import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URL } from '../config'

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')

  const [membershipActive, setMembershipActive] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setChecking(false)
      return
    }

    let attempts = 0
    const maxAttempts = 12

    const checkMembership = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (
          response.ok &&
          data?.data?.membershipStatus === 'ACTIVE'
        ) {
          setMembershipActive(true)
          setChecking(false)
          return
        }
      } catch (error) {
        console.error('Failed to check membership status:', error)
      }

      attempts += 1

      if (attempts >= maxAttempts) {
        setChecking(false)
        return
      }

      setTimeout(checkMembership, 2000)
    }

    checkMembership()
  }, [])

  const handleDashboardClick = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="subscribe-page">
      <div className="subscribe-card">
        <div className="subscribe-heading">
          <p className="subscribe-label">PAYMENT SUCCESSFUL</p>

          <h1>Welcome to Advest 🎉</h1>

          <p>
            Your membership payment was successful. Your account is being
            updated and you can now access your Advest membership.
          </p>
        </div>

        {reference && (
          <div className="subscription-plan">
            <div>
              <span className="plan-label">Payment Reference</span>
              <h2>{reference}</h2>
            </div>
          </div>
        )}

        {checking && (
          <p>
            Confirming your membership activation...
          </p>
        )}

        {!checking && !membershipActive && (
          <p>
            Your payment was successful, but membership activation is still
            being processed. Please wait a moment and try again.
          </p>
        )}

        <button
          type="button"
          onClick={handleDashboardClick}
          className="subscribe-button"
          disabled={!membershipActive}
        >
          {checking ? 'Activating Membership...' : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  )
}

export default SubscriptionSuccess
