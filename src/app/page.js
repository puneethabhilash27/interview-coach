import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-page page-entrance">
      {/* Hero */}
      <section style={{ paddingTop: '6rem', paddingBottom: '3rem', textAlign: 'center' }}>
        <div className="container">
          <div className="animate-float stagger-1" style={{ display: 'inline-block', padding: '0.35rem 0.9rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '2rem', color: 'var(--indigo)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1.25rem' }}>
            ✨ The #1 AI Interview Prep Platform
          </div>
          <h1 className="stagger-2" style={{ fontSize: '3.5rem', lineHeight: '1.05', marginBottom: '1rem', maxWidth: '750px', margin: '0 auto 1rem', letterSpacing: '-0.04em' }}>
            Land your dream job with <br />
            <span className="gradient-text">AI-Powered Confidence</span>
          </h1>
          <p className="stagger-3" style={{ fontSize: '1rem', maxWidth: '540px', margin: '0 auto 2rem', color: 'var(--muted-foreground)' }}>
            Realistic simulations, instant feedback, and data-driven insights to help you ace any interview. 🚀
          </p>
          <div className="stagger-4" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
            <Link href="/practice" className="glow-button" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem' }}>
              🎯 Start Practicing Free
            </Link>
            <Link href="/dashboard" className="btn-ghost" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem' }}>
              📊 Explore Analytics →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '2.5rem 0 3rem', background: 'rgba(0,0,0,0.15)' }}>
        <div className="container">
          <h2 className="stagger-1" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem', letterSpacing: '-0.03em' }}>
            Engineered for <span className="gradient-text">Success</span> 💪
          </h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="saas-card stagger-2">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Smart Scenarios</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Context-aware questions tailored to specific roles and top-tier tech company standards.</p>
            </div>
            <div className="saas-card stagger-3">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚡</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Instant Evaluation</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Receive real-time feedback powered by AI with semantic similarity analysis.</p>
            </div>
            <div className="saas-card stagger-4">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📈</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Adaptive Training</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Our algorithms learn your weaknesses and adjust difficulty for continuous growth.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
