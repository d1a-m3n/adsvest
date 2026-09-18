import { useEffect, useState } from 'react'
import '../styles/dashboard-opportunities.css'

type Opportunity = {
  id: number
  title: string
  description: string
  type: string
  payout: string
  currency: string
  externalUrl: string | null
}

function Opportunities() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [startingId, setStartingId] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)

  const [startedOpportunityId, setStartedOpportunityId] = useState<number | null>(null)
  const [completionReady, setCompletionReady] = useState(false)

  const [completionMessage, setCompletionMessage] = useState('')

  const filters = ['All', 'Apps', 'Socials', 'Tasks']

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await fetch(
          'http://localhost:5000/api/opportunities',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch tasks')
        }

        setOpportunities(data.data)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch tasks',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  const handleStartOpportunity = async (opportunity: Opportunity) => {
    try {
      setStartingId(opportunity.id)
      setCompletionMessage('')
      setCompletionReady(false)

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `http://localhost:5000/api/opportunities/${opportunity.id}/start`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to start task',
        )
      }

      setStartedOpportunityId(opportunity.id)

      // Hidden 50-second readiness timer.
      // The backend still performs the real security check.
      window.setTimeout(() => {
        setCompletionReady(true)
      }, 50_000)

      if (data.data.externalUrl) {
        window.open(
          data.data.externalUrl,
          '_blank',
          'noopener,noreferrer',
        )
      } else {
        setCompletionMessage(
          'Task started. Complete the task and return here when you are done.',
        )
      }
    } catch (error) {
      console.error('Failed to start task:', error)

      setCompletionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to start task',
      )
    } finally {
      setStartingId(null)
    }
  }

  const handleCompleteOpportunity = async (
    opportunityId: number,
  ) => {
    try {
      setCompletingId(opportunityId)
      setCompletionMessage('Checking your task...')

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `http://localhost:5000/api/opportunities/${opportunityId}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to complete task',
        )
      }

      const earningAmount = Number(
        data.data.earning.amount,
      )

      setCompletionMessage(
        `Success! You earned ₦${earningAmount.toLocaleString(
          'en-NG',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}.`,
      )

      setOpportunities((current) =>
        current.filter(
          (opportunity) =>
            opportunity.id !== opportunityId,
        ),
      )

      setStartedOpportunityId(null)
      setCompletionReady(false)
    } catch (error) {
      console.error(
        'Failed to complete task:',
        error,
      )

      setCompletionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to complete task',
      )

      setStartedOpportunityId(null)
      setCompletionReady(false)
    } finally {
      setCompletingId(null)
    }
  }

  const filteredOpportunities =
    activeFilter === 'All'
      ? opportunities
      : opportunities.filter((opportunity) => {
          if (activeFilter === 'Apps') {
            return opportunity.type === 'APP'
          }

          if (activeFilter === 'Socials') {
            return opportunity.type === 'SOCIAL'
          }

          if (activeFilter === 'Tasks') {
            return opportunity.type === 'TASK'
          }

          return true
        })

  const getDisplayType = (type: string) => {
    if (type === 'APP') return 'App'
    if (type === 'SOCIAL') return 'Social'
    if (type === 'TASK') return 'Task'

    return type
  }

  return (
    <div className="dashboard-opportunities">
      <header className="opportunities-header">
        <div>
          <p className="dashboard-label">TASKS</p>

          <h1>Find something worth doing.</h1>

          <p>
            Explore available tasks and discover new ways to
            earn rewards.
          </p>
        </div>
      </header>

      {completionMessage && (
        <p>{completionMessage}</p>
      )}

      <div className="opportunity-filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={
              activeFilter === filter ? 'active' : ''
            }
            onClick={() =>
              setActiveFilter(filter)
            }
          >
            {filter}
          </button>
        ))}
      </div>

      {loading && <p>Loading tasks...</p>}

      {!loading && error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        filteredOpportunities.length === 0 && (
          <p>No tasks available right now.</p>
        )}

      {!loading &&
        !error &&
        filteredOpportunities.length > 0 && (
          <section className="opportunity-grid">
            {filteredOpportunities.map(
              (opportunity) => {
                const isStarted =
                  startedOpportunityId ===
                  opportunity.id

                const isStarting =
                  startingId === opportunity.id

                const isCompleting =
                  completingId === opportunity.id

                return (
                  <article
                    className="opportunity-card"
                    key={opportunity.id}
                  >
                    <div className="opportunity-card-top">
                      <span className="opportunity-type">
                        {getDisplayType(
                          opportunity.type,
                        )}
                      </span>

                      <span className="opportunity-reward">
                        {opportunity.currency === 'NGN'
                          ? '₦'
                          : opportunity.currency}{' '}
                        {Number(
                          opportunity.payout,
                        ).toLocaleString(
                          'en-NG',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>

                    <h2>{opportunity.title}</h2>

                    <p>
                      {opportunity.description}
                    </p>

                    {!isStarted && (
                      <button
                        type="button"
                        className="opportunity-button"
                        disabled={
                          startingId !== null ||
                          completingId !== null
                        }
                        onClick={() =>
                          handleStartOpportunity(
                            opportunity,
                          )
                        }
                      >
                        {isStarting
                          ? 'Opening...'
                          : 'View Task'}
                      </button>
                    )}

                    {isStarted && (
                      <div>
                        {!completionReady && (
                          <p>
                            Complete the task and
                            return here when you are
                            done.
                          </p>
                        )}

                        {completionReady && (
                          <button
                            type="button"
                            className="opportunity-button"
                            disabled={
                              completingId !== null
                            }
                            onClick={() =>
                              handleCompleteOpportunity(
                                opportunity.id,
                              )
                            }
                          >
                            {isCompleting
                              ? 'Checking...'
                              : 'Complete Task'}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                )
              },
            )}
          </section>
        )}
    </div>
  )
}

export default Opportunities