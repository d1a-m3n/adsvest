import { useEffect, useState } from 'react'
import { LogOut, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from "../config";
import '../styles/profile.css'

type WithdrawalAccount = {
  bankName: string
  accountNumber: string
  accountName: string
}

type ProfileData = {
  name: string | null
  email: string
  phone: string | null
  membershipStatus: string
  membershipExpiresAt: string | null
  withdrawalAccount: WithdrawalAccount | null
}

function Profile() {
  const { logout } = useAuth()

  const [profile, setProfile] = useState<ProfileData | null>(null)

  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  const [accountSaved, setAccountSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [error, setError] = useState('')
  const [accountError, setAccountError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await fetch(
          `${API_URL}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to fetch profile',
          )
        }

        const profileData: ProfileData = data.data

        setProfile(profileData)

        if (profileData.withdrawalAccount) {
          setBankName(
            profileData.withdrawalAccount.bankName,
          )

          setAccountNumber(
            profileData.withdrawalAccount.accountNumber,
          )

          setAccountName(
            profileData.withdrawalAccount.accountName,
          )
        }
      } catch (error) {
        console.error(
          'Failed to fetch profile:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch profile',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSaveAccount = async () => {
    setAccountSaved(false)
    setAccountError('')

    const cleanedBankName = bankName.trim()
    const cleanedAccountNumber =
      accountNumber.trim()
    const cleanedAccountName =
      accountName.trim()

    if (
      !cleanedBankName ||
      !cleanedAccountNumber ||
      !cleanedAccountName
    ) {
      setAccountError(
        'Please complete all bank account fields.',
      )
      return
    }

    if (!/^\d{10}$/.test(cleanedAccountNumber)) {
      setAccountError(
        'Account number must contain exactly 10 digits.',
      )
      return
    }

    try {
      setSavingAccount(true)

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `${API_URL}/profile/withdrawal-account`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bankName: cleanedBankName,
            accountNumber: cleanedAccountNumber,
            accountName: cleanedAccountName,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to save withdrawal account',
        )
      }

      const savedAccount: WithdrawalAccount =
        data.data

      setBankName(savedAccount.bankName)
      setAccountNumber(savedAccount.accountNumber)
      setAccountName(savedAccount.accountName)

      setProfile((current) =>
        current
          ? {
              ...current,
              withdrawalAccount: savedAccount,
            }
          : current,
      )

      setAccountSaved(true)
    } catch (error) {
      console.error(
        'Failed to save withdrawal account:',
        error,
      )

      setAccountError(
        error instanceof Error
          ? error.message
          : 'Failed to save withdrawal account',
      )
    } finally {
      setSavingAccount(false)
    }
  }

  const formatMembershipDate = (
    date: string | null,
  ) => {
    if (!date) {
      return 'Not active'
    }

    return new Date(date).toLocaleDateString(
      'en-NG',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    )
  }

  const membershipLabel =
    profile?.membershipStatus === 'ACTIVE'
      ? 'Active'
      : profile?.membershipStatus || 'Inactive'

  if (loading) {
    return (
      <main className="profile-page">
        <p>Loading profile...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="profile-page">
        <p>{error}</p>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <div className="profile-header">
        <div>
          <p className="dashboard-label">PROFILE</p>

          <h1>Account settings</h1>

          <p>
            Manage your personal information and
            account preferences.
          </p>
        </div>

        <button
          type="button"
          className="mobile-profile-logout"
          onClick={logout}
          aria-label="Log out"
        >
          <LogOut />

          <span>Log out</span>
        </button>
      </div>

      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <p className="dashboard-label">
              PERSONAL INFORMATION
            </p>

            <h2>Your details</h2>
          </div>
        </div>

        <div className="profile-form">
          <div className="profile-field">
            <label htmlFor="profile-name">
              Full name
            </label>

            <input
              id="profile-name"
              type="text"
              value={profile?.name || 'Not provided'}
              readOnly
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-email">
              Email address
            </label>

            <input
              id="profile-email"
              type="email"
              value={profile?.email || ''}
              readOnly
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-phone">
              Phone number
            </label>

            <input
              id="profile-phone"
              type="tel"
              value={
                profile?.phone || 'Not provided'
              }
              readOnly
            />
          </div>
        </div>
      </section>

            <section className="profile-card community-card">
        <div className="profile-card-header">
          <div>
            <p className="dashboard-label">
              ADVEST COMMUNITY
            </p>

            <h2>Join our Telegram community</h2>

            <p>
              Connect with other Advest members, stay updated,
              and get important community announcements.
            </p>
          </div>
        </div>

        <div className="community-content">
          <div className="community-icon">
            <Send size={24} />
          </div>

          <div className="community-info">
            <h3>Advest on Telegram</h3>

            <p>
              Our official Telegram community is coming soon.
              Join us when the community launches.
            </p>

            <a
              href="https://t.me/adsvestopportunity"
              target="_blank"
              rel="noopener noreferrer"
              className="community-button"
            >
              <Send size={18} />
              Join Telegram Community
            </a>  
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <p className="dashboard-label">
              WITHDRAWAL ACCOUNT
            </p>

            <h2>Bank account details</h2>

            <p>
              Add the bank account where you want to
              receive your withdrawal payments.
            </p>
          </div>
        </div>

        <div className="profile-form">
          <div className="profile-field">
            <label htmlFor="bank-name">
              Bank name
            </label>

            <input
              id="bank-name"
              type="text"
              placeholder="Enter your bank name"
              value={bankName}
              onChange={(event) => {
                setBankName(event.target.value)
                setAccountSaved(false)
                setAccountError('')
              }}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="account-number">
              Account number
            </label>

            <input
              id="account-number"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter your account number"
              value={accountNumber}
              onChange={(event) => {
                const value =
                  event.target.value.replace(/\D/g, '')

                setAccountNumber(value)
                setAccountSaved(false)
                setAccountError('')
              }}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="account-name">
              Account name
            </label>

            <input
              id="account-name"
              type="text"
              placeholder="Enter the account name"
              value={accountName}
              onChange={(event) => {
                setAccountName(event.target.value)
                setAccountSaved(false)
                setAccountError('')
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSaveAccount}
            disabled={savingAccount}
          >
            {savingAccount
              ? 'Saving...'
              : 'Save Account Details'}
          </button>

          {accountSaved && (
            <p className="account-saved-message">
              Your withdrawal account details have
              been saved.
            </p>
          )}

          {accountError && (
            <p className="withdraw-error">
              {accountError}
            </p>
          )}
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <p className="dashboard-label">
              MEMBERSHIP
            </p>

            <h2>Membership status</h2>
          </div>
        </div>

        <div className="membership-profile">
          <div>
            <span>Status</span>

            <strong>{membershipLabel}</strong>
          </div>

          <div>
            <span>Membership expires</span>

            <strong>
              {formatMembershipDate(
                profile?.membershipExpiresAt || null,
              )}
            </strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Profile