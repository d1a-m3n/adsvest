import '../styles/HowItWorks.css'

function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="section-heading">
        <p className="section-label">HOW IT WORKS</p>
        <h2>Simple steps. Real opportunities.</h2>
        <p>
          Discover opportunities, complete eligible activities,
          and earn rewards along the way.
        </p>
      </div>

      <div className="steps">
        <div className="step-card">
          <span className="step-number">01</span>
          <h3>Discover</h3>
          <p>Explore opportunities available to you.</p>
        </div>

        <div className="step-card">
          <span className="step-number">02</span>
          <h3>Complete</h3>
          <p>Complete eligible activities and opportunities.</p>
        </div>

        <div className="step-card">
          <span className="step-number">03</span>
          <h3>Earn</h3>
          <p>Receive rewards for verified activities.</p>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks