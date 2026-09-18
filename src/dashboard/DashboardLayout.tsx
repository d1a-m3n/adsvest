import {
  Home,
  LayoutGrid,
  WalletCards,
  Users,
  UserCircle,
  LogOut
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import '../styles/dashboard-layout.css'
import { useAuth } from '../context/AuthContext'

function DashboardLayout() {
  const { logout } = useAuth()

  return (
    <div className="dashboard-layout">

      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          Advest
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">
            <Home className="sidebar-nav-icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/dashboard/opportunities">
            <LayoutGrid className="sidebar-nav-icon" />
            <span>Opportunities</span>
          </NavLink>

          <NavLink to="/dashboard/wallet">
            <WalletCards className="sidebar-nav-icon" />
            <span>Wallet</span>
          </NavLink>

          <NavLink to="/dashboard/referrals">
            <Users className="sidebar-nav-icon" />
            <span>Referrals</span>
          </NavLink>

          <NavLink to="/dashboard/profile">
            <UserCircle className="sidebar-nav-icon" />
            <span>Profile</span>
          </NavLink>
        </nav>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          <LogOut className="sidebar-nav-icon" />
          <span>Log out</span>
        </button>

      </aside>

      <div className="dashboard-main">
        <Outlet />
      </div>

      <nav className="mobile-nav">
        <NavLink to="/dashboard" aria-label="Home">
          <Home className="mobile-nav-icon" />
        </NavLink>

        <NavLink to="/dashboard/opportunities" aria-label="Opportunities">
          <LayoutGrid className="mobile-nav-icon" />
        </NavLink>

        <NavLink to="/dashboard/wallet" aria-label="Wallet">
          <WalletCards className="mobile-nav-icon" />
        </NavLink>

        <NavLink to="/dashboard/referrals" aria-label="Referrals">
          <Users className="mobile-nav-icon" />
        </NavLink>

        <NavLink to="/dashboard/profile" aria-label="Profile">
          <UserCircle className="mobile-nav-icon" />
        </NavLink>
      </nav>

     </div>
  )
}

export default DashboardLayout