import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/referrals.css'

type ReferredUser = {
  id: number
  name: string
  email: string
  membershipStatus: string
  createdAt: string
}

type Referral = {
  id: number
  status: 'PENDING' | 'ACTIVE'
  rewardAmount: number
  rewardPaid: boolean
  rewardedAt: string | null
  createdAt: string
  referredUser: ReferredUser
}

type ReferralData = {
  referralCode: string
  referralLink: string
  stats: {
    totalReferrals: number
    activeReferrals: number
    referralEarnings: number
  }
  referrals: Referral[]
}

const INITIAL_REFERRALS_TO_SHOW = 5

function Referrals() {
  const { token } = useAuth()

  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllReferrals, setShowAllReferrals] = useState(false)

  const [copied, setCopied] = useState<
    'code' | 'link' | null
  >(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Authentication required')
      return
    }

    const fetchReferrals = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          'http://localhost:5000/api/referrals',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.message || 'Failed to fetch referrals',
          )
        }

        setData(result.data)
      } catch (error) {
        console.error(
          'Failed to fetch referrals:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch referrals',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [token])

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleCopy = async (
    value: string,
    type: 'code' | 'link',
  ) => {
    try {
      await navigator.clipboard.writeText(value)

      setCopied(type)

      setTimeout(() => {
        setCopied(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const visibleReferrals =
    data && showAllReferrals
      ? data.referrals
      : data?.referrals.slice(
          0,
          INITIAL_REFERRALS_TO_SHOW,
        ) || []

  const hasMoreReferrals =
    (data?.referrals.length || 0) >
    INITIAL_REFERRALS_TO_SHOW

  return (
    <main className="referrals-page">
      <div className="referrals-header">
        <div>
          <p className="dashboard-label">REFERRALS</p>

          <h1>Invite friends, earn rewards.</h1>

          <p>
            Share your referral link and track the people who
            join Advest through you.
          </p>
        </div>
      </div>

      {loading && <p>Loading referrals...</p>}

      {!loading && error && <p>{error}</p>}

      {!loading && !error && data && (
        <>
          <section className="referral-link-card">
            <div>
              <p className="dashboard-label">
                YOUR REFERRAL CODE
              </p>

              <h2>{data.referralCode}</h2>

              <p>
                Share this code with people you invite to
                Advest.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(data.referralCode, 'code')
              }
            >
              {copied === 'code'
                ? 'Copied!'
                : 'Copy Code'}
            </button>
          </section>

          <section className="referral-link-card">
            <div>
              <p className="dashboard-label">
                YOUR REFERRAL LINK
              </p>

              <h2>{data.referralLink}</h2>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(data.referralLink, 'link')
              }
            >
              {copied === 'link'
                ? 'Copied!'
                : 'Copy Link'}
            </button>
          </section>

          <section className="referral-stats">
            <div className="referral-stat-card">
              <span>Total Referrals</span>

              <strong>
                {data.stats.totalReferrals}
              </strong>
            </div>

            <div className="referral-stat-card">
              <span>Active Referrals</span>

              <strong>
                {data.stats.activeReferrals}
              </strong>
            </div>

            <div className="referral-stat-card">
              <span>Referral Earnings</span>

              <strong>
                {formatAmount(
                  data.stats.referralEarnings,
                )}
              </strong>
            </div>
          </section>

          <section className="referrals-list-section">
            <div className="section-heading">
              <div>
                <p className="dashboard-label">
                  YOUR REFERRALS
                </p>

                <h2>People you invited</h2>
              </div>
            </div>

            {data.referrals.length === 0 ? (
              <div className="referrals-empty">
                <div className="empty-icon">👥</div>

                <h3>No referrals yet</h3>

                <p>
                  Your invited users will appear here once
                  they join through your referral link.
                </p>
              </div>
            ) : (
              <>
                <div className="referrals-list">
                  {visibleReferrals.map((referral) => (
                    <div
                      className="referral-item"
                      key={referral.id}
                    >
                      <div>
                        <h3>
                          {referral.referredUser.name}
                        </h3>

                        <p>
                          {referral.referredUser.email}
                        </p>

                        <small>
                          Joined{' '}
                          {formatDate(
                            referral.createdAt,
                          )}
                        </small>
                      </div>

                      <div className="referral-item-meta">
                        <span
                          className={`referral-status referral-status-${referral.status.toLowerCase()}`}
                        >
                          {referral.status === 'ACTIVE'
                            ? 'Active'
                            : 'Pending'}
                        </span>

                        {referral.rewardPaid && (
                          <strong>
                            +
                            {formatAmount(
                              referral.rewardAmount,
                            )}
                          </strong>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {hasMoreReferrals && (
                  <button
                    type="button"
                    className="see-more-button"
                    onClick={() =>
                      setShowAllReferrals(
                        (current) => !current,
                      )
                    }
                  >
                    {showAllReferrals
                      ? 'Show Less'
                      : `Show More (${data.referrals.length - INITIAL_REFERRALS_TO_SHOW} more)`}
                  </button>
                )}
              </>
            )}
          </section>

          <section className="referral-rules">
            <p className="dashboard-label">
              HOW IT WORKS
            </p>

            <h2>Referral program</h2>

            <div className="referral-steps">
              <div>
                <span>01</span>

                <h3>Share your link</h3>

                <p>
                  Send your unique referral link to friends
                  and people you know.
                </p>
              </div>

              <div>
                <span>02</span>

                <h3>They join Advest</h3>

                <p>
                  Your referral is recorded when someone
                  signs up through your referral link.
                </p>
              </div>

              <div>
                <span>03</span>

                <h3>Earn rewards</h3>

                <p>
                  You earn ₦100 when your referred user
                  successfully subscribes to Advest.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default Referrals
