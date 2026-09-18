import { Link, useSearchParams } from 'react-router-dom'

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')

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

        <Link
          to="/dashboard"
          className="subscribe-button"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default SubscriptionSuccess