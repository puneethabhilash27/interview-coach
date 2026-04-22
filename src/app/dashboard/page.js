'use client';
import { useState, useEffect, useRef } from 'react';
import { api, getUserName, setUserName, getRecentActivity, getBookmarks, getPerformanceMetrics } from '@/lib/api';
import Link from 'next/link';

const SKILL_COLORS = [
  { bar: 'var(--indigo)', bg: 'rgba(99,102,241,0.10)' },
  { bar: 'var(--cyan)', bg: 'rgba(6,182,212,0.10)' },
  { bar: 'var(--emerald)', bg: 'rgba(16,185,129,0.10)' },
  { bar: 'var(--purple)', bg: 'rgba(168,85,247,0.10)' },
  { bar: 'var(--amber)', bg: 'rgba(245,158,11,0.10)' },
  { bar: 'var(--rose)', bg: 'rgba(244,63,94,0.10)' },
  { bar: 'var(--pink)', bg: 'rgba(236,72,153,0.10)' },
  { bar: 'var(--teal)', bg: 'rgba(20,184,166,0.10)' },
];

const getDiffColor = (d) => ({ Easy: 'var(--emerald)', Normal: 'var(--amber)', Hard: 'var(--rose)' }[d] || 'var(--indigo)');

const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const updateNumber = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setDisplayValue(Math.floor(ease * value));
      if (progress < 1) requestAnimationFrame(updateNumber);
      else setDisplayValue(value);
    };
    requestAnimationFrame(updateNumber);
  }, [value]);
  return <>{displayValue}</>;
};

export default function Dashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [name, setName] = useState('Guest');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [skillDist, setSkillDist] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [perfMetrics, setPerfMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [expandedActivity, setExpandedActivity] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, leaders, questions] = await Promise.all([
          api.getUserStats(),
          api.getLeaderboard(),
          api.getQuestions()
        ]);
        setStatsData(stats);
        setLeaderboard(leaders);
        setName(getUserName());
        setRecentActivity(getRecentActivity());
        setBookmarks(getBookmarks());
        setPerfMetrics(getPerformanceMetrics());

        const catMap = {};
        questions.forEach(q => {
          const cat = q.category || 'Other';
          if (!catMap[cat]) catMap[cat] = { count: 0, types: new Set() };
          catMap[cat].count += 1;
          if (q.type) catMap[cat].types.add(q.type);
        });
        const dist = Object.entries(catMap).map(([category, data]) => ({
          category,
          count: data.count,
          type: [...data.types].join(', ')
        })).sort((a, b) => b.count - a.count);
        setSkillDist(dist);
      } catch (err) {
        setError("Sync failed. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditingName && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSave = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed.length > 0) {
      setUserName(trimmed);
      setName(trimmed);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  const maxSkillCount = skillDist.length > 0 ? Math.max(...skillDist.map(s => s.count)) : 1;

  const stats = [
    {
      label: 'Daily Streak',
      value: statsData?.streak || 0,
      suffix: ' Days',
      color: 'var(--amber)',
      progress: statsData ? Math.min((statsData.streak / 7) * 100, 100) : 0,
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
      trend: '+1 today'
    },
    {
      label: 'Avg Accuracy',
      value: statsData?.totalAttempts > 0 ? Math.round(statsData.averageScore) : 0,
      suffix: '%',
      color: 'var(--emerald)',
      progress: statsData ? Math.round(statsData.averageScore) : 0,
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
      trend: '↑ 5% this week'
    },
    {
      label: 'Sessions',
      value: statsData?.totalAttempts || 0,
      suffix: '',
      color: 'var(--indigo)',
      progress: statsData ? Math.min((statsData.totalAttempts / 50) * 100, 100) : 0,
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
      trend: '3 this week'
    },
  ];

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="container page-entrance" style={{ maxWidth: '1400px', paddingBottom: '3rem', paddingTop: '6rem' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="badge-glow" style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'var(--gradient-primary)', color: 'white', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              {statsData?.badge || "Beginner"}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--emerald)' }}>⭐ Level {statsData?.level || 1}</div>
          </div>

          <h1 className="animate-slide-in-left" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Welcome back,{' '}
            {isEditingName ? (
              <input
                ref={nameRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                maxLength={50}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '2px solid var(--indigo)',
                  borderRadius: '0.5rem',
                  padding: '0.2rem 0.6rem',
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: 'var(--foreground)',
                  width: `${Math.max(nameInput.length, 3) * 1.2 + 2}ch`,
                  maxWidth: '100%',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.03em',
                  margin: 0
                }}
              />
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                    onClick={() => { setNameInput(name); setIsEditingName(true); }}
                    className="group">
                <span className="gradient-text">{name}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </span>
            )}
            {' '}👋
          </h1>

          <div className="animate-fade-in" style={{ maxWidth: '400px', background: 'rgba(15,23,42,0.4)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
              <span>XP PROGRESS</span>
              <span style={{ color: 'var(--foreground)' }}><AnimatedNumber value={statsData?.xp || 0} /> / {(statsData?.level || 1) * 1000} XP</span>
            </div>
            <div className="xp-bar-container">
              <div className="xp-bar-fill" style={{ width: `${Math.min(((statsData?.xp || 0) % 1000) / 10, 100)}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="animate-slide-in-right" style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/practice" className="glow-button">🎯 Start Training</Link>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '2.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className={`saas-card stagger-${i+1}`} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', overflow: 'hidden' }}>
            <div className="radial-gauge" style={{ '--percentage': Math.round(stat.progress) }}>
              <div className="radial-gauge-value" style={{ color: stat.color }}><AnimatedNumber value={Math.round(stat.progress)} />%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ color: stat.color, width: '2.5rem', height: '2.5rem', background: `color-mix(in srgb, ${stat.color} 15%, transparent)`, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: 'var(--muted-foreground)' }}>{stat.label}</p>
              </div>
              <h2 style={{ fontSize: '2.25rem', margin: 0, color: 'var(--foreground)', display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                <AnimatedNumber value={stat.value} />
                <span style={{ fontSize: '1rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>{stat.suffix}</span>
              </h2>
              <div style={{ fontSize: '0.75rem', color: stat.color, fontWeight: '600', marginTop: '0.25rem' }}>{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>


      {/* ─── Radar Charts ─── */}
      <div className="saas-card stagger-4" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '2rem' }}>

          {/* Left: Skill Distribution */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.5rem' }}>📊</span> Skill Distribution</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)', fontWeight: '700' }}>
                {skillDist.reduce((a, s) => a + s.count, 0)} questions
              </span>
            </div>
            {skillDist.length > 0 ? (() => {
              const cx = 150, cy = 140, R = 100;
              const n = skillDist.length;
              const stp = (2 * Math.PI) / n;
              const rings = [0.25, 0.5, 0.75, 1];
              const pt = (i, r) => ({ x: cx + R * r * Math.cos(stp * i - Math.PI / 2), y: cy + R * r * Math.sin(stp * i - Math.PI / 2) });
              const dpts = skillDist.map((s, i) => pt(i, s.count / maxSkillCount));
              const poly = dpts.map(p => `${p.x},${p.y}`).join(' ');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <svg width="300" height="280" viewBox="0 0 300 280" style={{ overflow: 'visible' }}>
                    <defs>
                      <radialGradient id="rf1" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.05)" />
                      </radialGradient>
                    </defs>
                    {rings.map((r, i) => {
                      const rp = Array.from({ length: n }, (_, j) => pt(j, r));
                      return <polygon key={i} points={rp.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
                    })}
                    {skillDist.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
                    <polygon points={poly} fill="url(#rf1)" stroke="var(--indigo)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.3))' }} className="animate-scale-up" />
                    {dpts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={SKILL_COLORS[i % SKILL_COLORS.length].bar} stroke="var(--background)" strokeWidth="2" className="animate-scale-up" style={{ animationDelay: `${i * 0.05}s` }} />)}
                    {skillDist.map((s, i) => {
                      const lp = pt(i, 1.25);
                      return <text key={i} x={lp.x} y={lp.y} textAnchor={lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle'} dominantBaseline="middle" fill={SKILL_COLORS[i % SKILL_COLORS.length].bar} fontSize="10" fontWeight="700" fontFamily="'Inter', sans-serif">{s.category}</text>;
                    })}
                  </svg>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center' }}>
                    {skillDist.map((s, i) => (
                      <div key={s.category} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: SKILL_COLORS[i % SKILL_COLORS.length].bar }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>{s.category}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: SKILL_COLORS[i % SKILL_COLORS.length].bar }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}><p style={{ margin: 0, fontSize: '0.9rem' }}>Loading data...</p></div>
            )}
          </div>

          {/* Vertical Divider */}
          <div style={{ background: 'linear-gradient(to bottom, transparent, var(--border), transparent)' }} />

          {/* Right: Answer Quality */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.5rem' }}>🎯</span> Answer Quality</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', fontWeight: '700' }}>
                {recentActivity.length} evaluated
              </span>
            </div>
            {perfMetrics ? (() => {
              const cx = 150, cy = 140, R = 100;
              const n = perfMetrics.length;
              const stp = (2 * Math.PI) / n;
              const rings = [0.25, 0.5, 0.75, 1];
              const pt = (i, r) => ({ x: cx + R * r * Math.cos(stp * i - Math.PI / 2), y: cy + R * r * Math.sin(stp * i - Math.PI / 2) });
              const dpts = perfMetrics.map((m, i) => pt(i, m.value / 100));
              const poly = dpts.map(p => `${p.x},${p.y}`).join(' ');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <svg width="300" height="280" viewBox="0 0 300 280" style={{ overflow: 'visible' }}>
                    <defs>
                      <radialGradient id="rf2" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(16,185,129,0.4)" />
                        <stop offset="100%" stopColor="rgba(16,185,129,0.05)" />
                      </radialGradient>
                    </defs>
                    {rings.map((r, i) => {
                      const rp = Array.from({ length: n }, (_, j) => pt(j, r));
                      return <polygon key={i} points={rp.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
                    })}
                    {perfMetrics.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
                    <polygon points={poly} fill="url(#rf2)" stroke="var(--emerald)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }} className="animate-scale-up" />
                    {dpts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={perfMetrics[i].color} stroke="var(--background)" strokeWidth="2" className="animate-scale-up" style={{ animationDelay: `${i * 0.05}s` }} />)}
                    {perfMetrics.map((m, i) => {
                      const lp = pt(i, 1.25);
                      return <text key={i} x={lp.x} y={lp.y} textAnchor={lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle'} dominantBaseline="middle" fill={m.color} fontSize="10" fontWeight="700" fontFamily="'Inter', sans-serif">{m.label}</text>;
                    })}
                  </svg>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center' }}>
                    {perfMetrics.map((m) => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>{m.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: m.color }}>{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2rem' }}>{'📝'}</div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>Evaluate answers to unlock</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Accuracy · Keywords · STAR · Depth</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent/Bookmarks + Graph + Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }} className="stagger-5">

        {/* Left: Tabbed Recent Activity / Bookmarks */}
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            {[
              { key: 'recent', label: '🕐 Recent Activity', count: recentActivity.length },
              { key: 'bookmarks', label: '🔖 Bookmarks', count: bookmarks.length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '1rem', background: 'transparent', border: 'none', cursor: 'pointer',
                  color: activeTab === tab.key ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: activeTab === tab.key ? '700' : '600', fontSize: '0.9rem',
                  borderBottom: activeTab === tab.key ? '2px solid var(--indigo)' : '2px solid transparent',
                  transition: 'var(--transition-fast)', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                {tab.label} <span style={{ opacity: 0.5, fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeTab === 'recent' ? (
              recentActivity.length > 0 ? (
                recentActivity.slice(0, 10).map((a, i) => (
                  <div key={i} onClick={() => setExpandedActivity(expandedActivity === i ? null : i)} style={{
                    display: 'flex', flexDirection: 'column', flexShrink: 0,
                    padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: expandedActivity === i ? 'var(--shadow-sm)' : 'none',
                    borderColor: expandedActivity === i ? 'rgba(99,102,241,0.3)' : 'var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.25rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                          {a.question}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: getDiffColor(a.difficulty), textTransform: 'uppercase' }}>{a.difficulty}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{a.category}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', opacity: 0.7 }}>• {timeAgo(a.timestamp)}</span>
                        </div>
                      </div>
                      <div style={{
                        padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0, marginLeft: '1rem',
                        background: a.score >= 70 ? 'rgba(16,185,129,0.15)' : a.score >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
                        color: a.score >= 70 ? 'var(--emerald)' : a.score >= 40 ? 'var(--amber)' : 'var(--rose)',
                        boxShadow: 'inset 0 0 0 1px currentColor'
                      }}>
                        {a.score}%
                      </div>
                    </div>
                    {expandedActivity === i && (
                      <div className="animate-fade-in" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--indigo)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</div>
                          {a.questionId && (
                            <Link href={`/practice?q=${a.questionId}`} style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              Practice Again <span>→</span>
                            </Link>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                          {a.answer ? `"${a.answer}"` : 'No answer recorded.'}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>No recent activity yet</p>
                </div>
              )
            ) : (
              bookmarks.length > 0 ? (
                bookmarks.map((b, i) => (
                  <Link href={`/practice?q=${b.id}`} key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    padding: '1rem', background: 'rgba(245,158,11,0.05)', borderRadius: '0.75rem',
                    border: '1px solid rgba(245,158,11,0.15)', textDecoration: 'none', color: 'inherit',
                    transition: 'var(--transition-smooth)',
                  }} className="hover:translate-y-[-2px] hover:shadow-sm">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.25rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        🔖 {b.question}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: getDiffColor(b.difficulty), textTransform: 'uppercase' }}>{b.difficulty}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{b.category}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--indigo)', fontWeight: '700', flexShrink: 0, padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '0.5rem' }}>Practice →</span>
                  </Link>
                ))
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>No bookmarks yet — bookmark questions in Practice</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Graph */}
          <div className="saas-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.25rem' }}>📈</span> Trends</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--indigo)', fontWeight: '700' }}>Last 7</span>
            </div>
            <div style={{ height: '180px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
              {statsData && statsData.history && statsData.history.length > 0 ? (
                statsData.history.slice(-7).map((score, i) => (
                  <div key={i} className="animate-slide-in-up" style={{ flex: 1, background: 'var(--gradient-primary)', borderRadius: '0.5rem 0.5rem 0 0', height: `${score}%`, position: 'relative', minWidth: '30px', animationDelay: `${i * 0.1}s`, opacity: 0, animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s forwards` }}>
                    <div style={{ position: 'absolute', top: '-1.5rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', fontWeight: '800', color: 'var(--indigo)' }}>{score}%</div>
                  </div>
                ))
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: '1rem', opacity: 0.5 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>Practice to see trends</p>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="saas-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.25rem' }}>🏆</span> Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leaderboard.map((user, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: user.isYou ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '0.75rem',
                  border: `1px solid ${user.isYou ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                  fontSize: '0.9rem',
                  boxShadow: user.isYou ? 'var(--shadow-glow-primary)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: '900', width: '20px', opacity: 0.5, fontSize: '0.9rem', flexShrink: 0, color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--slate-300)' : i === 2 ? 'var(--orange)' : 'inherit' }}>#{i + 1}</span>
                    <div style={{ fontWeight: '700', wordBreak: 'break-word', lineHeight: '1.2', color: user.isYou ? 'var(--indigo)' : 'var(--foreground)' }}>{user.name} {user.isYou && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'var(--indigo)', color: 'white', borderRadius: '0.25rem', marginLeft: '0.25rem' }}>YOU</span>}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', fontWeight: '700', color: 'var(--muted-foreground)' }}>{user.badge}</span>
                    <span style={{ fontWeight: '800', color: 'var(--foreground)', fontSize: '0.85rem' }}><AnimatedNumber value={user.xp} /> XP</span>
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
