import { Link } from 'react-router-dom'
import '../styles/hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">
        ● New opportunities available
      </div>

      <p className="hero-label">WELCOME TO ADVEST</p>

      <h1 className="hero-title">
        Earn from opportunities
        <span> that fit you.</span>
      </h1>

      <p className="hero-description">
        Discover verified opportunities, complete eligible activities,
        and earn rewards — all in one simple platform.
      </p>

      <div className="hero-actions">
        <Link to="/register" className="hero-cta">
          Get Started
        </Link>

        <a href="#how-it-works" className="hero-secondary">
          Learn How It Works
        </a>
      </div>
    </section>
  )
}

export default Hero