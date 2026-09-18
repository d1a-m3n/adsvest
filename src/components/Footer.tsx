import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <h2 className="footer-logo">Advest</h2>
          <p className="footer-description">
            Discover opportunities. Complete activities. Earn rewards.
          </p>
        </div>

        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">How It Works</a>
          <a href="#">Contact</a>
          <a href="#">Terms</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Advest. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
