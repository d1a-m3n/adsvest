import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/subscribe.css'
import { API_URL } from "../config";
import { ArrowLeft } from "lucide-react";

function Subscribe() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isExpired = user?.membershipStatus === 'EXPIRED'

  const expiryDate = user?.membershipExpiresAt
    ? new Date(user.membershipExpiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const handleSubscribe = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')

      if (!token) {
        setError('Please log in before subscribing.')
        setLoading(false)
        return
      }

      const response = await fetch(
        `${API_URL}/payments/subscribe`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(
          data.message || 'Unable to initialize payment. Please try again.',
        )
        setLoading(false)
        return
      }

      window.location.href = data.data.authorizationUrl
    } catch (error) {
      console.error('Subscription error:', error)

      setError(
        'Something went wrong while starting your payment. Please try again.',
      )

      setLoading(false)
    }
  }

  return (
    <div className="subscribe-page">
      <div className="subscribe-card">
        <div className="subscribe-heading">
          <p className="subscribe-label">ADVEST MEMBERSHIP</p>

          <h1>
            {isExpired
              ? 'Your membership has expired'
              : 'Unlock your Advest account'}
          </h1>

          <p>
            {isExpired
              ? `Your previous membership ended on ${expiryDate}. Renew your membership for another 30 days and continue earning.`
              : 'Get access to available opportunities and start earning rewards.'}
          </p>
        </div>

        <div className="subscription-plan">
          <div>
            <span className="plan-label">Monthly Membership</span>
            <h2>₦1,000</h2>
          </div>

          <span className="plan-duration">30 days</span>
        </div>

        <div className="subscription-benefits">
          <h3>Your membership includes:</h3>

          <ul>
            <li>Access to eligible opportunities</li>
            <li>Earn rewards from verified activities</li>
            <li>Track your earnings and activity</li>
            <li>Access your Advest wallet</li>
          </ul>
        </div>

        {error && (
          <div className="subscription-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="subscribe-button"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Opening payment...' : 'Pay ₦1,000 & Continue'}
        </button>

        <p className="subscription-note">
          Your membership lasts for 30 days from the date of successful
          payment. You will need to pay ₦1,000 again when your membership expires.
        </p>

        <Link to="/register" className="subscription-back">
          <ArrowLeft size={20} />
           Back
        </Link>
      </div>
    </div>
  )
}

export default Subscribe
