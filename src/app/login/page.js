export default function Login() {
  return (
    <div className="container section animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 16rem)' }}>
      <div className="saas-card" style={{ maxWidth: '450px', width: '100%', padding: '3rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Welcome <span className="gradient-text">Back</span></h1>
          <p style={{ fontSize: '0.875rem' }}>Securely access your interview dashboard.</p>
        </header>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Email Address</label>
            <input type="email" placeholder="name@company.com" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Password</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="glow-button" style={{ marginTop: '1rem', padding: '1rem' }}>
            Sign In to Account
          </button>
        </form>

        <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button className="btn-ghost" style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Google</button>
          <button className="btn-ghost" style={{ padding: '0.75rem', fontSize: '0.875rem' }}>GitHub</button>
        </div>

        <p style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.875rem', margin: '2.5rem 0 0' }}>
          Don't have an account? <Link href="#" style={{ color: 'var(--primary)', fontWeight: '700' }}>Create one for free</Link>
        </p>
      </div>
    </div>
  );
}
import Link from 'next/link';
