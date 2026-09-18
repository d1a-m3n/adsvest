import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'
import Notifications from '../components/Notifications'

type Wallet = {
  balance: string
  currency: string
}

function Dashboard() {
  const { user, token } = useAuth()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [totalEarned, setTotalEarned] = useState(0)
  const [completedActivities, setCompletedActivities] = useState(0)
  const [walletLoading, setWalletLoading] = useState(true)

  const daysRemaining = user?.membershipExpiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.membershipExpiresAt).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null

  const membershipExpiringSoon =
    user?.membershipStatus === 'ACTIVE' &&
    daysRemaining !== null &&
    daysRemaining <= 7

  useEffect(() => {
    if (!token) {
      setWalletLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      try {
        const walletResponse = await fetch(
          'http://localhost:5000/api/wallet',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!walletResponse.ok) {
          throw new Error('Failed to fetch wallet')
        }

        const walletData = await walletResponse.json()

        setWallet(walletData.data)

        const earningsResponse = await fetch(
          'http://localhost:5000/api/earnings',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!earningsResponse.ok) {
          throw new Error('Failed to fetch earnings')
        }

        const earningsData = await earningsResponse.json()

        setTotalEarned(Number(earningsData.data.totalEarned))
        setCompletedActivities(
          Number(earningsData.data.completedActivities)
        )
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setWalletLoading(false)
      }
    }

    fetchDashboardData()
  }, [token])

  const availableBalance = wallet
    ? Number(wallet.balance).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00'

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">YOUR DASHBOARD</p>

          <h1>Welcome to Advest</h1>

          <p>
            Discover opportunities and keep track of your rewards.
          </p>
        </div>

        <Notifications />
      </header>

      <main className="dashboard-content">

        {/* Membership */}
        <section
          className={`membership-card ${
            membershipExpiringSoon
              ? 'membership-card--warning'
              : user?.membershipStatus === 'ACTIVE'
                ? ''
                : 'membership-card--inactive'
          }`}
        >
          <div>
            <p className="dashboard-label">MEMBERSHIP</p>

            <h2>
              {membershipExpiringSoon
                ? 'Membership expires soon'
                : user?.membershipStatus === 'ACTIVE'
                  ? 'Active membership'
                  : 'Membership inactive'}
            </h2>

            <p>
              {membershipExpiringSoon
                ? `Your membership expires in ${daysRemaining} ${
                    daysRemaining === 1 ? 'day' : 'days'
                  }.`
                : user?.membershipStatus === 'ACTIVE'
                  ? 'Your Advest membership is currently active.'
                  : 'Your Advest membership is not currently active.'}
            </p>
          </div>

          <div className="membership-details">
            <span>Expires</span>

            <strong>
              {user?.membershipExpiresAt
                ? new Date(
                    user.membershipExpiresAt
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </strong>

            {daysRemaining !== null &&
              user?.membershipStatus === 'ACTIVE' && (
                <small
                  className={
                    membershipExpiringSoon
                      ? 'membership-warning'
                      : ''
                  }
                >
                  {daysRemaining === 1
                    ? '1 day remaining'
                    : `${daysRemaining} days remaining`}
                </small>
              )}
          </div>
        </section>

        {/* Dashboard stats */}
        <section className="dashboard-stats">

          <div className="stat-card">
            <span>Available Balance</span>

            <strong>
              {walletLoading
                ? 'Loading...'
                : `₦${availableBalance}`}
            </strong>
          </div>

          <div className="stat-card">
            <span>Total Earned</span>

            <strong>
              ₦
              {totalEarned.toLocaleString('en-NG', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>

          <div className="stat-card">
            <span>Completed Activities</span>

            <strong>{completedActivities}</strong>
          </div>

        </section>

      </main>

    </div>
  )
}

export default Dashboard