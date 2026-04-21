'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, leaders] = await Promise.all([
          api.getUserStats(),
          api.getLeaderboard()
        ]);
        setStatsData(stats);
        setLeaderboard(leaders);
      } catch (err) {
        setError("Sync failed. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'Daily Streak',
      value: statsData ? `${statsData.streak} Days` : '0 Days',
      color: 'var(--rose)',
      progress: statsData ? Math.min((statsData.streak / 7) * 100, 100) : 0,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    },
    {
      label: 'Accuracy',
      value: statsData && statsData.totalAttempts > 0 ? `${Math.round(statsData.averageScore)}%` : '0%',
      color: 'var(--indigo)',
      progress: statsData ? Math.round(statsData.averageScore) : 0,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m22 2-7.5 7.5"/><path d="m14 7 1.5 1.5"/></svg>
    },
    {
      label: 'Sessions',
      value: statsData ? statsData.totalAttempts.toString() : '0',
      color: 'var(--cyan)',
      progress: statsData ? Math.min((statsData.totalAttempts / 50) * 100, 100) : 0,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
    },
  ];

  return (
    <div className="container section page-entrance" style={{ paddingTop: '6rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="badge-glow" style={{ padding: '0.3rem 0.85rem', borderRadius: '2rem', background: 'var(--gradient-primary)', color: 'white', fontWeight: '700', fontSize: '0.7rem' }}>
              {statsData?.badge || "Beginner"}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--emerald)' }}>⭐ Level {statsData?.level || 1}</div>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Welcome back, <span className="gradient-text">Alex</span> 👋</h1>

          <div style={{ maxWidth: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--muted-foreground)' }}>
              <span>XP PROGRESS</span>
              <span>{statsData?.xp || 0} / {(statsData?.level || 1) * 1000} XP</span>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-fill" style={{ width: `${Math.min(((statsData?.xp || 0) % 1000) / 10, 100)}%` }}></div>
            </div>
          </div>
        </div>
        <Link href="/practice" className="glow-button" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>🎯 Start Training</Link>
      </div>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className={`saas-card stagger-${i+1}`} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="radial-gauge" style={{ '--percentage': Math.round(stat.progress) }}>
              <div className="radial-gauge-value" style={{ color: stat.color }}>{Math.round(stat.progress)}%</div>
            </div>
            <div>
              <div style={{ color: stat.color, marginBottom: '0.5rem', width: '2rem', height: '2rem', background: `color-mix(in srgb, ${stat.color} 10%, transparent)`, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem', color: 'var(--muted-foreground)' }}>{stat.label}</p>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="stagger-3">
        {/* Graph */}
        <div className="saas-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>📉 Historical Trends</h3>
            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--indigo)', fontWeight: '600' }}>Last 7</span>
          </div>
          <div style={{ height: '250px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
            {statsData && statsData.history && statsData.history.length > 0 ? (
              statsData.history.slice(-7).map((score, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--gradient-primary)', borderRadius: '0.375rem 0.375rem 0 0', height: `${score}%`, transition: 'height 0.8s ease', position: 'relative', minWidth: '30px' }}>
                  <div style={{ position: 'absolute', top: '-1.25rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', fontWeight: '800', color: 'var(--indigo)' }}>{score}%</div>
                </div>
              ))
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '0.75rem', opacity: 0.4 }}>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>Practice to see trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Coach */}
          <div className="saas-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, transparent 100%)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>🤖 AI Career Coach</h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--foreground)' }}>
              {statsData && statsData.totalAttempts > 0 ? (
                statsData.averageScore < 50 ? "Focus on basics. Try reviewing core concepts and using the STAR method." :
                statsData.averageScore <= 75 ? "You're improving! Incorporate more specific technical metrics." :
                "You're interview ready! Excellent depth and keyword coverage."
              ) : (
                "Start your first session to receive personalized coaching."
              )}
            </p>
            <Link href="/practice" className="btn-ghost" style={{ marginTop: '1rem', width: '100%', display: 'inline-block', textAlign: 'center', textDecoration: 'none', fontSize: '0.85rem' }}>
              {statsData && statsData.totalAttempts > 0 ? "Continue Training" : "Get Started"}
            </Link>
          </div>

          {/* Leaderboard */}
          <div className="saas-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>🏆 Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {leaderboard.map((user, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  background: user.name.includes('Alex') ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '0.5rem',
                  border: `1px solid ${user.name.includes('Alex') ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: '800', width: '18px', opacity: 0.4, fontSize: '0.8rem' }}>{i + 1}</span>
                    <div style={{ fontWeight: '600' }}>{user.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.04)', fontWeight: '600', color: 'var(--muted-foreground)' }}>{user.badge}</span>
                    <span style={{ fontWeight: '700', color: 'var(--indigo)', fontSize: '0.8rem' }}>{user.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
