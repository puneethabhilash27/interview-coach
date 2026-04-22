'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAppPage = ['/dashboard', '/practice', '/tips', '/faq', '/rapid-fire'].includes(pathname);

  return (
    <nav className="nav-container animate-fade-in">
      <div className="nav-glass" style={{ gap: '2rem' }}>
        <Link href="/" className="logo gradient-text" style={{ fontSize: '1.05rem', textDecoration: 'none' }}>
          🎤 Interview Coach
        </Link>

        <div className="nav-links">
          <Link href="/dashboard" className={`nav-link`} style={{ color: pathname === '/dashboard' ? 'var(--foreground)' : undefined }}>📊 Dashboard</Link>
          <Link href="/practice" className={`nav-link`} style={{ color: pathname === '/practice' ? 'var(--foreground)' : undefined }}>💡 Practice</Link>
          <Link href="/tips" className={`nav-link`} style={{ color: pathname === '/tips' ? 'var(--foreground)' : undefined }}>📌 Tips</Link>
          <Link href="/rapid-fire" className={`nav-link`} style={{ color: pathname === '/rapid-fire' ? 'var(--foreground)' : undefined }}>⚡ Rapid Fire</Link>
          <Link href="/faq" className={`nav-link`} style={{ color: pathname === '/faq' ? 'var(--foreground)' : undefined }}>❓ FAQ</Link>

          {!isAppPage && (
            <>
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
              <Link href="/login" className="glow-button" style={{ padding: '0.45rem 1.1rem', fontSize: '0.8rem' }}>
                🚀 Get Started
              </Link>
            </>
          )}

          {isAppPage && (
            <div style={{ padding: '0.3rem 0.65rem', borderRadius: '0.5rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.6rem', fontWeight: '700', color: 'var(--indigo)', letterSpacing: '0.05em' }}>
              ⭐ PRO
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
