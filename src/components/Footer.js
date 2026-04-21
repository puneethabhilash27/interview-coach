export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: '3rem' }}>
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="logo gradient-text" style={{ fontSize: '1rem' }}>🎤 Interview Coach</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" className="nav-link" style={{ fontSize: '0.75rem' }}>Features</a>
            <a href="#" className="nav-link" style={{ fontSize: '0.75rem' }}>Pricing</a>
            <a href="#" className="nav-link" style={{ fontSize: '0.75rem' }}>Support</a>
            <a href="#" className="nav-link" style={{ fontSize: '0.75rem' }}>Privacy</a>
          </div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>© 2026 Interview Coach. Built with ❤️ for the future of work.</p>
        </div>
      </div>
    </footer>
  );
}
