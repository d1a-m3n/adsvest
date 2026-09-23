import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import '../styles/wallet.css'
import { API_URL } from "../config";

type WalletTransaction = {
  id: number
  type:
    | 'WELCOME_BONUS'
    | 'EARNING'
    | 'REFERRAL'
    | 'WITHDRAWAL'
    | 'ADJUSTMENT'
  amount: string
  currency: string
  description: string
  createdAt: string
}

type WithdrawalAccount = {
  bankName: string
  accountNumber: string
  accountName: string
}

type Withdrawal = {
  id: number
  amount: string
  currency: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  bankName: string
  accountNumber: string
  accountName: string
  rejectionReason?: string | null
  createdAt: string
}

function Wallet() {
  const [showWithdraw, setShowWithdraw] = useState(false)

  const [showAllTransactions, setShowAllTransactions] =
    useState(false)

  const [showAllWithdrawals, setShowAllWithdrawals] =
    useState(false)

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')

  const [balance, setBalance] = useState(0)

  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([])

  const [withdrawals, setWithdrawals] = useState<
    Withdrawal[]
  >([])

  const [activeReferrals, setActiveReferrals] = useState(0)

  const [loading, setLoading] = useState(true)
  const [submittingWithdrawal, setSubmittingWithdrawal] =
    useState(false)

  const [error, setError] = useState('')

  const [withdrawalAccount, setWithdrawalAccount] =
    useState<WithdrawalAccount | null>(null)

  const requiredReferrals = 7

  const hasCompletedFirstWithdrawal =
    withdrawals.length > 0

  const referralRequirementMet =
    activeReferrals >= requiredReferrals

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Authentication required')
        }

        const [
          walletResponse,
          profileResponse,
          withdrawalsResponse,
          referralsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/wallet`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/withdrawals`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/referrals`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        const walletData = await walletResponse.json()
        const profileData = await profileResponse.json()
        const withdrawalsData =
          await withdrawalsResponse.json()
        const referralsData =
          await referralsResponse.json()

        if (!walletResponse.ok) {
          throw new Error(
            walletData.message || 'Failed to fetch wallet',
          )
        }

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || 'Failed to fetch profile',
          )
        }

        if (!withdrawalsResponse.ok) {
          throw new Error(
            withdrawalsData.message ||
              'Failed to fetch withdrawals',
          )
        }

        if (!referralsResponse.ok) {
          throw new Error(
            referralsData.message ||
              'Failed to fetch referrals',
          )
        }

        setBalance(Number(walletData.data.balance))

        setTransactions(walletData.data.transactions)

        setWithdrawalAccount(
          profileData.data.withdrawalAccount || null,
        )

        setWithdrawals(withdrawalsData.data || [])

        setActiveReferrals(
          Number(
            referralsData.data?.stats?.activeReferrals || 0,
          ),
        )
      } catch (error) {
        console.error(
          'Failed to fetch wallet:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch wallet',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [])

  const totalEarned = transactions
    .filter(
      (transaction) =>
        transaction.type === 'EARNING' ||
        transaction.type === 'REFERRAL',
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0,
    )

  const totalWithdrawn = transactions
    .filter(
      (transaction) =>
        transaction.type === 'WITHDRAWAL',
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0,
    )

  const pendingWithdrawals = withdrawals
    .filter(
      (withdrawal) =>
        withdrawal.status === 'PENDING',
    )
    .reduce(
      (total, withdrawal) =>
        total + Number(withdrawal.amount),
      0,
    )

  const visibleTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 4)

  const visibleWithdrawals = showAllWithdrawals
    ? withdrawals
    : withdrawals.slice(0, 4)

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

  const getTransactionLabel = (
    transaction: WalletTransaction,
  ) => {
    if (transaction.type === 'WELCOME_BONUS') {
      return 'Welcome bonus'
    }

    if (transaction.type === 'EARNING') {
      return 'Opportunity earning'
    }

    if (transaction.type === 'REFERRAL') {
      return 'Referral reward'
    }

    if (transaction.type === 'WITHDRAWAL') {
      return 'Withdrawal'
    }

    return 'Wallet adjustment'
  }

  const getWithdrawalStatusLabel = (
    status: Withdrawal['status'],
  ) => {
    if (status === 'PENDING') {
      return 'Pending'
    }

    if (status === 'APPROVED') {
      return 'Approved'
    }

    if (status === 'PAID') {
      return 'Paid'
    }

    return 'Rejected'
  }

  const handleWithdraw = async () => {
    setWithdrawError('')
    setWithdrawSuccess('')

    if (!withdrawalAccount) {
      setWithdrawError(
        'Please add a withdrawal account in your profile first.',
      )
      return
    }

    const amount = Number(withdrawAmount)

    if (!withdrawAmount || !Number.isFinite(amount)) {
      setWithdrawError(
        'Please enter a valid withdrawal amount.',
      )
      return
    }

    if (!Number.isInteger(amount)) {
      setWithdrawError(
        'Withdrawal amount must be a whole number.',
      )
      return
    }

    if (amount < 2000) {
      setWithdrawError(
        'The minimum withdrawal amount is ₦2,000.',
      )
      return
    }

    if (amount > 10000) {
      setWithdrawError(
        'The maximum withdrawal amount is ₦10,000.',
      )
      return
    }

    if (amount > balance) {
      setWithdrawError(
        'Insufficient balance for this withdrawal.',
      )
      return
    }

    try {
      setSubmittingWithdrawal(true)

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `${API_URL}/withdrawals`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to submit withdrawal request',
        )
      }

      setBalance(Number(data.data.balance))

      setWithdrawals((currentWithdrawals) => [
        data.data.withdrawal,
        ...currentWithdrawals,
      ])

      setWithdrawSuccess(
        'Withdrawal request submitted successfully. Your request is now pending review.',
      )

      setWithdrawAmount('')
    } catch (error) {
      console.error(
        'Failed to submit withdrawal:',
        error,
      )

      setWithdrawError(
        error instanceof Error
          ? error.message
          : 'Failed to submit withdrawal request',
      )
    } finally {
      setSubmittingWithdrawal(false)
    }
  }

  return (
    <div className="wallet-page">
      <header className="wallet-header">
        <p className="dashboard-label">WALLET</p>

        <h1>Your Advest wallet</h1>

        <p>
          Track your earnings, available balance, and
          withdrawal activity.
        </p>
      </header>

      <main className="wallet-content">
        {loading && <p>Loading wallet...</p>}

        {!loading && error && <p>{error}</p>}

        {!loading && !error && (
          <>
            <section className="wallet-balance-card">
              <span>Available Balance</span>

              <strong>{formatAmount(balance)}</strong>

              <button
                type="button"
                onClick={() => {
                  setWithdrawError('')
                  setWithdrawSuccess('')
                  setWithdrawAmount('')
                  setShowWithdraw(true)
                }}
              >
                Withdraw
              </button>
            </section>

            {!hasCompletedFirstWithdrawal && (
              <section className="withdrawal-requirement">
                <div>
                  <p className="dashboard-label">
                    FIRST WITHDRAWAL
                  </p>

                  <h2>
                    {referralRequirementMet
                      ? 'First withdrawal requirement completed'
                      : 'Complete 10 active referrals'}
                  </h2>

                  <p>
                    {referralRequirementMet
                      ? 'You can now make your first withdrawal.'
                      : 'You need 10 active referrals before you can make your first withdrawal.'}
                  </p>
                </div>

                <div className="referral-progress">
                  <strong>
                    {Math.min(
                      activeReferrals,
                      requiredReferrals,
                    )}{' '}
                    / {requiredReferrals}
                  </strong>

                  <span>Active referrals</span>
                </div>
              </section>
            )}

            <section className="wallet-stats">
              <div className="wallet-stat">
                <span>Total Earned</span>

                <strong>
                  {formatAmount(totalEarned)}
                </strong>
              </div>

              <div className="wallet-stat">
                <span>Total Withdrawn</span>

                <strong>
                  {formatAmount(totalWithdrawn)}
                </strong>
              </div>

              <div className="wallet-stat">
                <span>Pending</span>

                <strong>
                  {formatAmount(pendingWithdrawals)}
                </strong>
              </div>
            </section>

            <section className="transactions-section">
              <div className="transactions-heading">
                <div>
                  <p className="dashboard-label">
                    TRANSACTIONS
                  </p>

                  <h2>Recent activity</h2>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-transactions">
                  <h3>No transactions yet</h3>

                  <p>
                    Your earnings and withdrawals will
                    appear here once you start using
                    Advest.
                  </p>
                </div>
              ) : (
                <>
                  <div className="transactions-list">
                    {visibleTransactions.map(
                      (transaction) => (
                        <div
                          className="transaction-item"
                          key={transaction.id}
                        >
                          <div>
                            <h3>
                              {getTransactionLabel(
                                transaction,
                              )}
                            </h3>

                            <p>
                              {transaction.description}
                            </p>

                            <small>
                              {formatDate(
                                transaction.createdAt,
                              )}
                            </small>
                          </div>

                          <div className="transaction-amount">
                            <strong>
                              {transaction.type ===
                              'WITHDRAWAL'
                                ? '-'
                                : '+'}

                              {formatAmount(
                                Number(
                                  transaction.amount,
                                ),
                              )}
                            </strong>

                            <span>
                              {transaction.type ===
                              'WITHDRAWAL'
                                ? 'Withdrawal'
                                : 'Completed'}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {transactions.length > 4 && (
                    <button
                      type="button"
                      className="see-more-button"
                      onClick={() =>
                        setShowAllTransactions(
                          (current) => !current,
                        )
                      }
                    >
                      {showAllTransactions
                        ? 'See Less'
                        : 'See More'}
                    </button>
                  )}
                </>
              )}
            </section>

            <section className="transactions-section withdrawal-history-section">
              <div className="transactions-heading">
                <div>
                  <p className="dashboard-label">
                    WITHDRAWALS
                  </p>

                  <h2>Withdrawal history</h2>
                </div>
              </div>

              {withdrawals.length === 0 ? (
                <div className="empty-transactions">
                  <h3>No withdrawals yet</h3>

                  <p>
                    Your withdrawal requests will appear
                    here once you request a withdrawal.
                  </p>
                </div>
              ) : (
                <>
                  <div className="withdrawal-history-list">
                    {visibleWithdrawals.map(
                      (withdrawal) => (
                        <div
                          className="withdrawal-history-item"
                          key={withdrawal.id}
                        >
                          <div className="withdrawal-history-main">
                            <h3>
                              {formatAmount(
                                Number(withdrawal.amount),
                              )}
                            </h3>

                            <p>
                              {withdrawal.bankName} ·{' '}
                              {withdrawal.accountNumber}
                            </p>

                            <small>
                              {formatDate(
                                withdrawal.createdAt,
                              )}
                            </small>

                            {withdrawal.status ===
                              'REJECTED' &&
                              withdrawal.rejectionReason && (
                                <p className="withdrawal-rejection">
                                  Reason:{' '}
                                  {withdrawal.rejectionReason}
                                </p>
                              )}
                          </div>

                          <span
                            className={`withdrawal-status withdrawal-status-${withdrawal.status.toLowerCase()}`}
                          >
                            {getWithdrawalStatusLabel(
                              withdrawal.status,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  {withdrawals.length > 4 && (
                    <button
                      type="button"
                      className="see-more-button"
                      onClick={() =>
                        setShowAllWithdrawals(
                          (current) => !current,
                        )
                      }
                    >
                      {showAllWithdrawals
                        ? 'See Less'
                        : 'See More'}
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}

        <Dialog
          open={showWithdraw}
          onOpenChange={(open) => {
            setShowWithdraw(open)

            if (!open) {
              setWithdrawError('')
              setWithdrawSuccess('')
              setWithdrawAmount('')
            }
          }}
        >
          <DialogContent className="withdraw-modal">
            <DialogHeader>
              <p className="dashboard-label">
                WITHDRAW FUNDS
              </p>

              <DialogTitle>
                Withdraw your earnings
              </DialogTitle>

              <DialogDescription>
                Enter the amount you want to withdraw
                to your saved payment account.
              </DialogDescription>
            </DialogHeader>
            <div className="withdraw-account">
              <p className="dashboard-label">
                PAYMENT ACCOUNT
              </p>

              {withdrawalAccount ? (
                <>
                  <h3>
                    {withdrawalAccount.bankName}
                  </h3>

                  <p>
                    {withdrawalAccount.accountNumber}
                  </p>

                  <span>
                    {withdrawalAccount.accountName}
                  </span>
                </>
              ) : (
                <>
                  <h3>No withdrawal account</h3>

                  <p>
                    Add your bank account in your
                    profile before withdrawing.
                  </p>
                </>
              )}
            </div>

            <div className="withdraw-field">
              <label htmlFor="withdraw-amount">
                Withdrawal amount
              </label>

              <input
                id="withdraw-amount"
                type="number"
                min="2000"
                max="10000"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(event) => {
                  setWithdrawAmount(
                    event.target.value,
                  )
                  setWithdrawError('')
                  setWithdrawSuccess('')
                }}
                disabled={submittingWithdrawal}
              />

              <p className="withdraw-hint">
                Minimum: ₦2,000 · Maximum: ₦10,000
              </p>

              {withdrawError && (
                <p className="withdraw-error">
                  {withdrawError}
                </p>
              )}

              {withdrawSuccess && (
                <p className="account-saved-message">
                  {withdrawSuccess}
                </p>
              )}
            </div>

            <div className="withdraw-actions">
              <button
                type="button"
                className="withdraw-cancel"
                onClick={() =>
                  setShowWithdraw(false)
                }
                disabled={submittingWithdrawal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="withdraw-confirm"
                onClick={handleWithdraw}
                disabled={submittingWithdrawal}
              >
                {submittingWithdrawal
                  ? 'Submitting...'
                  : 'Confirm Withdrawal'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default Wallet

