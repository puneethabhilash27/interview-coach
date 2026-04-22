'use client';
import { useState, useEffect, useRef } from 'react';
import { api, getUserName, setUserName, getRecentActivity, getBookmarks, getPerformanceMetrics } from '@/lib/api';
import Link from 'next/link';

const SKILL_COLORS = [
  { bar: 'var(--indigo)', bg: 'rgba(99,102,241,0.10)' },
  { bar: 'var(--cyan)', bg: 'rgba(6,182,212,0.10)' },
  { bar: 'var(--emerald)', bg: 'rgba(16,185,129,0.10)' },
  { bar: 'var(--violet)', bg: 'rgba(139,92,246,0.10)' },
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

        // Compute skill distribution from question bank categories
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

          <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            Welcome back,{' '}
            {isEditingName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    color: 'var(--foreground)',
                    width: `${Math.max(nameInput.length, 3) * 1.2 + 2}ch`,
                    maxWidth: '100%',
                    outline: 'none',
                    fontFamily: 'inherit',
                    letterSpacing: '-0.03em',
                  }}
                />
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    onClick={() => { setNameInput(name); setIsEditingName(true); }}
                    title="Click to change your name">
                <span className="gradient-text">{name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </span>
            )}
            {' '}👋
          </h1>

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


      {/* ─── Radar Charts ─── */}
      <div className="saas-card stagger-2" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '1.5rem' }}>

          {/* Left: Skill Distribution */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>{'📊'} Skill Distribution</h3>
              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.08)', color: 'var(--indigo)', fontWeight: '600' }}>
                {skillDist.reduce((a, s) => a + s.count, 0)} questions
              </span>
            </div>
            {skillDist.length > 0 ? (() => {
              const cx = 140, cy = 130, R = 85;
              const n = skillDist.length;
              const stp = (2 * Math.PI) / n;
              const rings = [0.25, 0.5, 0.75, 1];
              const pt = (i, r) => ({ x: cx + R * r * Math.cos(stp * i - Math.PI / 2), y: cy + R * r * Math.sin(stp * i - Math.PI / 2) });
              const dpts = skillDist.map((s, i) => pt(i, s.count / maxSkillCount));
              const poly = dpts.map(p => `${p.x},${p.y}`).join(' ');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="280" height="260" viewBox="0 0 280 260" style={{ overflow: 'visible' }}>
                    <defs>
                      <radialGradient id="rf1" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                        <stop offset="100%" stopColor="rgba(99,102,241,0.06)" />
                      </radialGradient>
                    </defs>
                    {rings.map((r, i) => {
                      const rp = Array.from({ length: n }, (_, j) => pt(j, r));
                      return <polygon key={i} points={rp.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
                    })}
                    {skillDist.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />; })}
                    <polygon points={poly} fill="url(#rf1)" stroke="var(--indigo)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.25))' }} />
                    {dpts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={SKILL_COLORS[i % SKILL_COLORS.length].bar} stroke="rgba(10,15,28,0.8)" strokeWidth="1.5" />)}
                    {skillDist.map((s, i) => {
                      const lp = pt(i, 1.25);
                      return <text key={i} x={lp.x} y={lp.y} textAnchor={lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle'} dominantBaseline="middle" fill={SKILL_COLORS[i % SKILL_COLORS.length].bar} fontSize="9" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">{s.category}</text>;
                    })}
                  </svg>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.6rem', justifyContent: 'center' }}>
                    {skillDist.map((s, i) => (
                      <div key={s.category} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: SKILL_COLORS[i % SKILL_COLORS.length].bar }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>{s.category}</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: '700', color: SKILL_COLORS[i % SKILL_COLORS.length].bar }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.4 }}><p style={{ margin: 0, fontSize: '0.8rem' }}>Loading...</p></div>
            )}
          </div>

          {/* Vertical Divider */}
          <div style={{ background: 'var(--border)' }} />

          {/* Right: Answer Quality */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>{'🎯'} Answer Quality</h3>
              <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(16,185,129,0.08)', color: 'var(--emerald)', fontWeight: '600' }}>
                {recentActivity.length} evaluated
              </span>
            </div>
            {perfMetrics ? (() => {
              const cx = 140, cy = 130, R = 85;
              const n = perfMetrics.length;
              const stp = (2 * Math.PI) / n;
              const rings = [0.25, 0.5, 0.75, 1];
              const pt = (i, r) => ({ x: cx + R * r * Math.cos(stp * i - Math.PI / 2), y: cy + R * r * Math.sin(stp * i - Math.PI / 2) });
              const dpts = perfMetrics.map((m, i) => pt(i, m.value / 100));
              const poly = dpts.map(p => `${p.x},${p.y}`).join(' ');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="280" height="260" viewBox="0 0 280 260" style={{ overflow: 'visible' }}>
                    <defs>
                      <radialGradient id="rf2" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
                        <stop offset="100%" stopColor="rgba(16,185,129,0.06)" />
                      </radialGradient>
                    </defs>
                    {rings.map((r, i) => {
                      const rp = Array.from({ length: n }, (_, j) => pt(j, r));
                      return <polygon key={i} points={rp.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
                    })}
                    {perfMetrics.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />; })}
                    <polygon points={poly} fill="url(#rf2)" stroke="var(--emerald)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.25))' }} />
                    {dpts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={perfMetrics[i].color} stroke="rgba(10,15,28,0.8)" strokeWidth="1.5" />)}
                    {perfMetrics.map((m, i) => {
                      const lp = pt(i, 1.25);
                      return <text key={i} x={lp.x} y={lp.y} textAnchor={lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle'} dominantBaseline="middle" fill={m.color} fontSize="9" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">{m.label}</text>;
                    })}
                  </svg>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.6rem', justifyContent: 'center' }}>
                    {perfMetrics.map((m) => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: m.color }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>{m.label}</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: '700', color: m.color }}>{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem' }}>{'📝'}</div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.8rem' }}>Evaluate answers to unlock</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Accuracy · Keywords · STAR · Depth</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent/Bookmarks + Graph + Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="stagger-3">

        {/* Left: Tabbed Recent Activity / Bookmarks */}
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {[
              { key: 'recent', label: '🕐 Recent', count: recentActivity.length },
              { key: 'bookmarks', label: '🔖 Bookmarks', count: bookmarks.length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '0.6rem 0.75rem', background: 'transparent', border: 'none', cursor: 'pointer',
                  color: activeTab === tab.key ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: activeTab === tab.key ? '700' : '500', fontSize: '0.8rem',
                  borderBottom: activeTab === tab.key ? '2px solid var(--indigo)' : '2px solid transparent',
                  transition: 'var(--transition-fast)', fontFamily: 'inherit'
                }}>
                {tab.label} <span style={{ opacity: 0.5, marginLeft: '0.25rem' }}>({tab.count})</span>
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {activeTab === 'recent' ? (
              recentActivity.length > 0 ? (
                recentActivity.slice(0, 10).map((a, i) => (
                  <div key={i} onClick={() => setExpandedActivity(expandedActivity === i ? null : i)} style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem',
                    border: '1px solid var(--border)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.15rem', lineHeight: '1.3' }}>
                          {a.question}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: getDiffColor(a.difficulty), textTransform: 'uppercase' }}>{a.difficulty}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{a.category}</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', opacity: 0.6 }}>{timeAgo(a.timestamp)}</span>
                        </div>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.6rem', borderRadius: '0.375rem', fontWeight: '800', fontSize: '0.75rem', flexShrink: 0, marginLeft: '0.75rem',
                        background: a.score >= 70 ? 'rgba(16,185,129,0.1)' : a.score >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
                        color: a.score >= 70 ? 'var(--emerald)' : a.score >= 40 ? 'var(--amber)' : 'var(--rose)'
                      }}>
                        {a.score}%
                      </div>
                    </div>
                    {expandedActivity === i && (
                      <div className="animate-fade-in" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--indigo)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</div>
                          {a.questionId && (
                            <Link href={`/practice?q=${a.questionId}`} style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: '600', textDecoration: 'none' }}>
                              Practice Again →
                            </Link>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {a.answer ? `"${a.answer}"` : 'No answer recorded.'}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>No recent activity yet</p>
                </div>
              )
            ) : (
              bookmarks.length > 0 ? (
                bookmarks.map((b, i) => (
                  <Link href={`/practice?q=${b.id}`} key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem', background: 'rgba(245,158,11,0.03)', borderRadius: '0.5rem',
                    border: '1px solid rgba(245,158,11,0.12)', fontSize: '0.8rem', textDecoration: 'none', color: 'inherit',
                    transition: 'var(--transition-fast)'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.15rem', lineHeight: '1.3' }}>
                        🔖 {b.question}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: getDiffColor(b.difficulty), textTransform: 'uppercase' }}>{b.difficulty}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{b.category}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--indigo)', fontWeight: '600', flexShrink: 0 }}>Practice →</span>
                  </Link>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>No bookmarks yet — bookmark questions in Practice</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Graph */}
          <div className="saas-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>📉 Historical Trends</h3>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.08)', color: 'var(--indigo)', fontWeight: '600' }}>Last 7</span>
            </div>
            <div style={{ height: '160px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
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

          {/* Leaderboard */}
          <div className="saas-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>🏆 Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {leaderboard.map((user, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  background: user.isYou ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '0.5rem',
                  border: `1px solid ${user.isYou ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: '800', width: '18px', opacity: 0.4, fontSize: '0.8rem', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ fontWeight: '600', wordBreak: 'break-word', lineHeight: '1.2' }}>{user.name}</div>
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
