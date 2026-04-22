'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Practice() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await api.getQuestions();
        setQuestions(data);
        if (data.length > 0) setSelectedQuestion(data[0]);
      } catch (err) {
        setError("Failed to load questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const isStillInList = filteredQuestions.some(q => q.id === selectedQuestion?.id);
      if (!isStillInList) { setSelectedQuestion(filteredQuestions[0]); setEvaluation(null); setAnswer(""); }
    } else { setSelectedQuestion(null); }
  }, [selectedCategory, selectedDifficulty, questions]);

  const handleEvaluate = async () => {
    if (!selectedQuestion) return;
    setIsEvaluating(true); setError(null);
    try {
      const result = await api.evaluateAnswer(selectedQuestion.question, answer);
      setEvaluation(result);
    } catch (err) { setError("Evaluation failed."); console.error(err); }
    finally { setIsEvaluating(false); }
  };

  const filteredQuestions = questions.filter(q => {
    const cat = selectedCategory === "All" || q.category === selectedCategory || q.type === selectedCategory;
    const diff = selectedDifficulty === "All" || q.difficulty === selectedDifficulty;
    return cat && diff;
  });

  const uniqueCategories = ["All", "Technical", "Non-Technical", ...new Set(questions.map(q => q.category))];
  const difficulties = ["All", "Easy", "Normal", "Hard"];
  const getDiffColor = (d) => ({ Easy: 'var(--emerald)', Normal: 'var(--amber)', Hard: 'var(--rose)' }[d] || 'var(--indigo)');

  const getKeywords = (text) => {
    if (!text) return [];
    return [...new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4))].slice(0, 12);
  };

  const tagColors = [
    { bg: 'rgba(99,102,241,0.08)', fg: 'rgba(99,102,241,0.8)', bd: 'rgba(99,102,241,0.15)' },
    { bg: 'rgba(6,182,212,0.08)', fg: 'rgba(6,182,212,0.8)', bd: 'rgba(6,182,212,0.15)' },
    { bg: 'rgba(139,92,246,0.08)', fg: 'rgba(139,92,246,0.8)', bd: 'rgba(139,92,246,0.15)' },
    { bg: 'rgba(16,185,129,0.08)', fg: 'rgba(16,185,129,0.8)', bd: 'rgba(16,185,129,0.15)' },
    { bg: 'rgba(245,158,11,0.08)', fg: 'rgba(245,158,11,0.8)', bd: 'rgba(245,158,11,0.15)' },
    { bg: 'rgba(236,72,153,0.08)', fg: 'rgba(236,72,153,0.8)', bd: 'rgba(236,72,153,0.15)' },
  ];

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="container page-entrance" style={{ paddingTop: '5.5rem', paddingBottom: '2rem', maxWidth: '1500px' }}>
      {error && (
        <div style={{ position: 'fixed', top: '5.5rem', right: '1.5rem', background: 'var(--rose)', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', zIndex: 100, fontSize: '0.8rem', fontWeight: '600' }}>
          {error}
        </div>
      )}

      <div className="layout-3-col">

        {/* ─── LEFT: Question Library ─── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'sticky', top: '5.5rem', height: 'calc(100vh - 6.5rem)' }}>
          <div className="glass-panel" style={{ padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>🔍 Filters</h3>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.6rem', marginBottom: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'white', fontSize: '0.75rem' }}>
              {uniqueCategories.map(c => <option key={c} value={c} style={{ background: '#0a0f1c' }}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {difficulties.map(d => (
                <button key={d} onClick={() => setSelectedDifficulty(d)}
                  style={{ flex: 1, padding: '0.35rem', borderRadius: '0.375rem', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer',
                    border: `1px solid ${selectedDifficulty === d ? 'var(--indigo)' : 'var(--border)'}`,
                    background: selectedDifficulty === d ? 'var(--indigo)' : 'transparent',
                    color: selectedDifficulty === d ? 'white' : 'var(--muted-foreground)',
                    transition: 'var(--transition-fast)' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '4px' }}>
            {filteredQuestions.map((q) => (
              <button key={q.id} onClick={() => { setSelectedQuestion(q); setEvaluation(null); setAnswer(""); }}
                style={{
                  textAlign: 'left', padding: '0.7rem 0.85rem', cursor: 'pointer',
                  background: selectedQuestion?.id === q.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedQuestion?.id === q.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  borderLeft: selectedQuestion?.id === q.id ? '3px solid var(--indigo)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '0.5rem', transition: 'var(--transition-fast)',
                  display: 'flex', flexDirection: 'column', gap: '0.35rem'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', color: getDiffColor(q.difficulty), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{q.difficulty}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--cyan)', fontWeight: '600' }}>⏱ {q.duration || "N/A"}</span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', lineHeight: '1.35', color: selectedQuestion?.id === q.id ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                  {q.question}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ─── CENTER: Editor + Helpers ─── */}
        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedQuestion ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Question Header */}
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.08)', color: 'var(--indigo)', fontSize: '0.7rem', fontWeight: '700' }}>{selectedQuestion.category}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>• {selectedQuestion.type}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>• ⏱ {selectedQuestion.duration}</span>
                </div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: '1.15', marginBottom: 0 }}>✍️ {selectedQuestion.question}</h1>
              </div>

              {/* Editor */}
              <div className="editor-surface">
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Construct your response using the STAR method..."
                  style={{ width: '100%', minHeight: '260px', padding: '1rem', background: 'transparent', border: 'none', fontSize: '0.9rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', resize: 'none', outline: 'none' }} />
                <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                    <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{answer.trim().split(/\s+/).filter(x => x).length}</span> words • <span>{answer.length}</span> chars
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={() => setAnswer(selectedQuestion.sampleAnswer)} className="btn-coach-perfect"><span>✨ Ask Coach</span></button>
                    <button onClick={handleEvaluate} disabled={!answer || isEvaluating} className="btn-primary-eval">
                      {isEvaluating ? <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> : "🚀 Evaluate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── Compact Helper Strip ─── */}
              <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* STAR inline */}
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: '800', color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 STAR</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.65rem' }}>
                    <span><span style={{ color: 'var(--cyan)', fontWeight: '700' }}>S</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> Situation</span></span>
                    <span><span style={{ color: 'var(--emerald)', fontWeight: '700' }}>T</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> Task</span></span>
                    <span><span style={{ color: 'var(--amber)', fontWeight: '700' }}>A</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> Action</span></span>
                    <span><span style={{ color: 'var(--rose)', fontWeight: '700' }}>R</span><span style={{ color: 'rgba(255,255,255,0.4)' }}> Result</span></span>
                  </div>
                </div>
                {/* Divider */}
                <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--border)' }}></div>
                {/* Key Topics inline */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: '800', color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Target Keywords</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {getKeywords(selectedQuestion.sampleAnswer).slice(0, 8).map((word, i) => {
                      const c = tagColors[i % tagColors.length];
                      return <span key={i} style={{ padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.6rem', fontWeight: '600', background: c.bg, color: c.fg }}>{word}</span>;
                    })}
                  </div>
                </div>
              </div>

              {/* Hint + Tips in one row */}
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
                <div className="glass-panel" style={{ flex: 1, padding: '0.65rem 0.85rem' }}>
                  <span style={{ color: 'var(--amber)', fontWeight: '700' }}>💡 Hint:</span>{' '}
                  {selectedQuestion.sampleAnswer ? selectedQuestion.sampleAnswer.substring(0, 80) + '...' : 'N/A'}
                  <span style={{ color: 'var(--cyan)', marginLeft: '0.35rem' }}>Use "Ask Coach" for full answer</span>
                </div>
                <div className="glass-panel" style={{ flexShrink: 0, padding: '0.65rem 0.85rem', display: 'flex', gap: '0.75rem' }}>
                  <span>⚡ <span style={{ color: 'var(--foreground)' }}>45+ words</span></span>
                  <span>📊 <span style={{ color: 'var(--foreground)' }}>80/20</span> scoring</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <h2 style={{ opacity: 0.4, fontSize: '1.1rem' }}>👈 Select a question to begin</h2>
            </div>
          )}
        </main>

        {/* ─── RIGHT: AI Insights ─── */}
        <aside style={{ position: 'sticky', top: '5.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {evaluation ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Score */}
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                  <svg width="90" height="90">
                    <circle cx="45" cy="45" r="40" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="5"/>
                    <circle className="score-ring" cx="45" cy="45" r="40" fill="transparent" stroke="var(--indigo)" strokeWidth="5"
                      strokeDasharray="251.33" strokeDashoffset={251.33 - (evaluation.score / 100) * 251.33} strokeLinecap="round"/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '900' }}>
                    {evaluation.score}%
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--indigo)' }}>{evaluation.badge} Match</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>XP: +{evaluation.xpGained}</div>
                </div>
                <button onClick={() => { setEvaluation(null); setAnswer(""); }} className="btn-ghost" style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}>🔄 Try Again</button>
              </div>

              {/* Matched Keywords */}
              {evaluation.matchedKeywords && evaluation.matchedKeywords.length > 0 && (
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>✅ Matched Keywords</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {evaluation.matchedKeywords.map((w, i) => (
                      <span key={i} style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(16,185,129,0.08)', color: 'var(--emerald)', fontSize: '0.65rem', fontWeight: '600' }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <h4 style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>💪 Strengths</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {evaluation.feedback.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', lineHeight: '1.3' }}>• {s}</div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="glass-panel" style={{ padding: '0.85rem' }}>
                <h4 style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>💡 Improve</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {evaluation.feedback.suggestions.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', lineHeight: '1.3' }}>→ {s}</div>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              {evaluation.missingKeywords && evaluation.missingKeywords.length > 0 && (
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--rose)', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>❌ Missing Keywords</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {evaluation.missingKeywords.map((w, i) => (
                      <span key={i} style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(244,63,94,0.08)', color: 'var(--rose)', fontSize: '0.65rem', fontWeight: '600' }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '3.5rem' }}>
              <div className="glass-panel" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
                <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                  AI insights appear here<br/>after you evaluate an answer.
                </p>
              </div>
              <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>📝 <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{questions.length}</span> Q&apos;s</span>
                  <span>📂 <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{new Set(questions.map(q => q.category)).size}</span> cats</span>
                  <span>🔥 <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{filteredQuestions.length}</span> shown</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <a href="/tips" className="glass-panel" style={{ flex: 1, padding: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'var(--transition-fast)' }}>
                  <span style={{ fontSize: '1.25rem' }}>📌</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.15rem' }}>Tips</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>12 interview tips →</div>
                  </div>
                </a>
                <a href="/rapid-fire" className="glass-panel" style={{ flex: 1, padding: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'var(--transition-fast)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 100%)' }}>
                  <span style={{ fontSize: '1.25rem' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.15rem' }}>Rapid Fire</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>5 Q&apos;s, 5 min →</div>
                  </div>
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
