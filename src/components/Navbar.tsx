import { Link } from 'react-router-dom'
import { useState } from 'react'
import '../styles/Navbar.css'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <h2 className="navbar-logo">Advest</h2>

        <div className="navbar-links">
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </div>

        <div className="navbar-actions">
          

          <Link to="/login" className="navbar-login">
            Login
          </Link>

          <Link to="/register" className="navbar-cta">
            Get Started
          </Link>
        </div>

        <button
          className="navbar-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </nav>

      {menuOpen && (
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>

          <Link to="/login">Login</Link>

          <Link to="/register" className="navbar-cta">
            Get Started
          </Link>
        </div>
      )}
    </div>
  )
}

export default Navbar
