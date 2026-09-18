import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Wait until the authenticated user's information has been restored.
  if (!user) {
    return null
  }

  const hasActiveMembership =
    user.membershipStatus === 'ACTIVE' &&
    user.membershipExpiresAt !== null &&
    new Date(user.membershipExpiresAt) > new Date()

  // Inactive or expired users can access the subscription page.
  if (!hasActiveMembership && location.pathname !== '/subscribe') {
    return <Navigate to="/subscribe" replace />
  }

  // Active members should not be sent back to the subscription page.
  if (hasActiveMembership && location.pathname === '/subscribe') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default ProtectedRoute