import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import '../styles/notifications.css'

type Notification = {
  id: number
  title: string
  message: string
  type: string
  createdAt: string
  isRead: boolean
}

function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(
        'http://localhost:5000/api/notifications',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token')

      if (!token) return

      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (data.success) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification,
          ),
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) return

      const response = await fetch(
        'http://localhost:5000/api/notifications/read-all',
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (data.success) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        )
      }
    } catch (error) {
      console.error(
        'Failed to mark all notifications as read:',
        error,
      )
    }
  }

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()

    const difference = now.getTime() - date.getTime()
    const minutes = Math.floor(difference / (1000 * 60))
    const hours = Math.floor(difference / (1000 * 60 * 60))
    const days = Math.floor(difference / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="notifications">
      <button
        type="button"
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="notification-icon" />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <div>
              <p className="dashboard-label">NOTIFICATIONS</p>
              <h2>Updates</h2>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <span>🔔</span>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span>🔔</span>
                <h3>No notifications</h3>
                <p>You're all caught up.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead ? 'read' : 'unread'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {notification.type === 'EARNING' && '₦'}
                    {notification.type === 'WITHDRAWAL' && '₦'}
                    {notification.type === 'OPPORTUNITY' && '🎯'}
                    {notification.type === 'REFERRAL' && '👥'}
                    {notification.type === 'SECURITY' && '🔐'}
                    {notification.type === 'SYSTEM' && '✓'}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.isRead && (
                        <span className="unread-dot" />
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications