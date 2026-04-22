'use client';
import { useState, useEffect, useRef } from 'react';
import { api, getBookmarks, toggleBookmark, isBookmarked, getRecentActivity } from '@/lib/api';

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
  const [isListening, setIsListening] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  useEffect(() => { setBookmarks(getBookmarks()); }, []);

  const handleToggleBookmark = (e, q) => {
    e.stopPropagation();
    const updated = toggleBookmark(q);
    setBookmarks(updated);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await api.getQuestions();
        setQuestions(data);
        
        let initialQ = null;
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const qId = params.get('q');
          if (qId) {
            initialQ = data.find(q => q.id === parseInt(qId, 10) || q.id === qId);
          }
        }
        
        if (!initialQ && data.length > 0) initialQ = data[0];
        
        if (initialQ) {
          setSelectedQuestion(initialQ);
          const recent = getRecentActivity();
          const pastActivity = recent.find(a => a.questionId === initialQ.id);
          if (pastActivity && pastActivity.answer) {
            setAnswer(pastActivity.answer);
          }
        }
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
      if (!isStillInList) { 
        const nextQ = filteredQuestions[0];
        setSelectedQuestion(nextQ); 
        setEvaluation(null); 
        const recent = getRecentActivity();
        const pastActivity = recent.find(a => a.questionId === nextQ.id);
        setAnswer(pastActivity ? pastActivity.answer || "" : "");
      }
    } else { setSelectedQuestion(null); setAnswer(""); setEvaluation(null); }
  }, [selectedCategory, selectedDifficulty, questions]);

  const handleEvaluate = async () => {
    if (!selectedQuestion) return;
    setIsEvaluating(true); setError(null);
    try {
      const result = await api.evaluateAnswer(selectedQuestion.question, answer, selectedQuestion);
      setEvaluation(result);
    } catch (err) { setError("Evaluation failed."); console.error(err); }
    finally { setIsEvaluating(false); }
  };

  // Stop dictation when switching questions
  useEffect(() => {
    stopListening();
  }, [selectedQuestion]);

  useEffect(() => {
    return () => { stopListening(); };
  }, []);

  const stopListening = () => {
    listeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListen = async () => {
    if (isListening) { stopListening(); return; }

    const SR = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    if (!SR) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert('Microphone access denied. Please allow mic permissions.');
      return;
    }

    const existingText = answer || '';
    let committedText = existingText;

    const startRecognition = () => {
      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += t + ' ';
          else interimText += t;
        }
        if (finalText) committedText = (committedText + ' ' + finalText).trim();
        const displayText = finalText ? committedText : (committedText + ' ' + interimText).trim();
        setAnswer(displayText);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') stopListening();
      };

      recognition.onend = () => {
        if (listeningRef.current) {
          try { startRecognition(); } catch (e) { stopListening(); }
        } else { setIsListening(false); }
      };

      recognitionRef.current = recognition;
      recognition.start();
    };

    listeningRef.current = true;
    setIsListening(true);
    startRecognition();
  };

  const filteredQuestions = questions.filter(q => {
    const cat = selectedCategory === "All" || q.category === selectedCategory || q.type === selectedCategory;
    const diff = selectedDifficulty === "All" || q.difficulty === selectedDifficulty;
    const bm = !showBookmarksOnly || bookmarks.some(b => b.id === q.id);
    return cat && diff && bm;
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
            <h3 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>🔍 Filters</h3>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.6rem', marginBottom: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem' }}>
              {uniqueCategories.map(c => <option key={c} value={c} style={{ background: '#0a0f1c' }}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {difficulties.map(d => (
                <button key={d} onClick={() => setSelectedDifficulty(d)}
                  style={{ flex: 1, padding: '0.35rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                    border: `1px solid ${selectedDifficulty === d ? 'var(--indigo)' : 'var(--border)'}`,
                    background: selectedDifficulty === d ? 'var(--indigo)' : 'transparent',
                    color: selectedDifficulty === d ? 'white' : 'var(--muted-foreground)',
                    transition: 'var(--transition-fast)' }}>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
                border: `1px solid ${showBookmarksOnly ? 'var(--amber)' : 'var(--border)'}`,
                background: showBookmarksOnly ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: showBookmarksOnly ? 'var(--amber)' : 'var(--muted-foreground)',
                transition: 'var(--transition-fast)' }}>
              🔖 {showBookmarksOnly ? 'Show All' : `Bookmarks (${bookmarks.length})`}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '4px' }}>
            {filteredQuestions.map((q) => (
              <button key={q.id} onClick={() => { 
                setSelectedQuestion(q); 
                setEvaluation(null); 
                const recent = getRecentActivity();
                const pastActivity = recent.find(a => a.questionId === q.id);
                setAnswer(pastActivity ? pastActivity.answer || "" : "");
              }}
                style={{
                  textAlign: 'left', padding: '0.7rem 0.85rem', cursor: 'pointer',
                  background: selectedQuestion?.id === q.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedQuestion?.id === q.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  borderLeft: selectedQuestion?.id === q.id ? '3px solid var(--indigo)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '0.5rem', transition: 'var(--transition-fast)',
                  display: 'flex', flexDirection: 'column', gap: '0.35rem'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: getDiffColor(q.difficulty), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{q.difficulty}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span onClick={(e) => handleToggleBookmark(e, q)}
                      style={{
                        cursor: 'pointer', padding: '0.15rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.65rem', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'all 0.2s',
                        background: bookmarks.some(b => b.id === q.id) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${bookmarks.some(b => b.id === q.id) ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: bookmarks.some(b => b.id === q.id) ? 'var(--amber)' : 'var(--muted-foreground)',
                      }}>
                      {bookmarks.some(b => b.id === q.id) ? '🔖 Saved' : '☆ Save'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: '600' }}>⏱ {q.duration || "N/A"}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', lineHeight: '1.35', color: selectedQuestion?.id === q.id ? '#fff' : 'rgba(255,255,255,0.8)' }}>
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.08)', color: 'var(--indigo)', fontSize: '0.85rem', fontWeight: '700' }}>{selectedQuestion.category}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>• {selectedQuestion.type}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--cyan)' }}>• ⏱ {selectedQuestion.duration}</span>
                  <button onClick={(e) => handleToggleBookmark(e, selectedQuestion)}
                    style={{
                      marginLeft: 'auto', cursor: 'pointer', padding: '0.3rem 0.75rem', borderRadius: '0.5rem',
                      fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem',
                      transition: 'all 0.2s',
                      background: bookmarks.some(b => b.id === selectedQuestion.id) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${bookmarks.some(b => b.id === selectedQuestion.id) ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                      color: bookmarks.some(b => b.id === selectedQuestion.id) ? 'var(--amber)' : 'var(--muted-foreground)',
                    }}>
                    {bookmarks.some(b => b.id === selectedQuestion.id) ? '🔖 Bookmarked' : '☆ Bookmark'}
                  </button>
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: '1.15', marginBottom: 0 }}>✍️ {selectedQuestion.question}</h1>
              </div>

              {/* Editor */}
              <div className="editor-surface">
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Construct your response using the STAR method..."
                  style={{ width: '100%', minHeight: '260px', padding: '1rem', background: 'transparent', border: 'none', fontSize: '1.05rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', resize: 'none', outline: 'none' }} />
                <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                    <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{answer.trim().split(/\s+/).filter(x => x).length}</span> words • <span>{answer.length}</span> chars
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button 
                      onClick={toggleListen}
                      style={{ 
                        background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.05)', 
                        border: `1px solid ${isListening ? 'rgba(244, 63, 94, 0.4)' : 'var(--border)'}`,
                        color: isListening ? 'var(--rose)' : 'var(--muted-foreground)',
                        padding: '0.55rem 0.85rem', 
                        borderRadius: '0.75rem', 
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        fontWeight: '600',
                      }}
                    >
                      <span className={isListening ? "badge-glow" : ""} style={{ fontSize: '1rem' }}>🎤</span>
                      {isListening ? 'Stop' : 'Dictate'}
                    </button>
                    <button onClick={() => setAnswer(selectedQuestion.sampleAnswer)} className="btn-coach-perfect" style={{ fontSize: '0.95rem' }}><span>✨ Ask Coach</span></button>
                    <button onClick={handleEvaluate} disabled={!answer || isEvaluating} className="btn-primary-eval" style={{ fontSize: '0.95rem' }}>
                      {isEvaluating ? <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> : "🚀 Evaluate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── Compact Helper Strip ─── */}
              <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* STAR inline */}
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 STAR</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
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
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Target Keywords</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {getKeywords(selectedQuestion.sampleAnswer).slice(0, 8).map((word, i) => {
                      const c = tagColors[i % tagColors.length];
                      return <span key={i} style={{ padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', background: c.bg, color: c.fg }}>{word}</span>;
                    })}
                  </div>
                </div>
              </div>

              {/* Hint + Tips in one row */}
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
                <div className="glass-panel" style={{ flex: 1, padding: '0.85rem 1rem' }}>
                  <span style={{ color: 'var(--amber)', fontWeight: '700' }}>💡 Hint:</span>{' '}
                  {selectedQuestion.sampleAnswer ? selectedQuestion.sampleAnswer.substring(0, 80) + '...' : 'N/A'}
                  <span style={{ color: 'var(--cyan)', marginLeft: '0.35rem' }}>Use "Ask Coach" for full answer</span>
                </div>
                <div className="glass-panel" style={{ flexShrink: 0, padding: '0.85rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ fontSize: '1.1rem' }}>⚡</span> <span><span style={{ color: 'var(--foreground)', fontWeight: '700' }}>45+</span> words</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ fontSize: '1.1rem', lineHeight: '1' }}>📊</span> <span><span style={{ color: 'var(--foreground)', fontWeight: '700' }}>80/20</span> scoring</span></span>
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
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--indigo)' }}>{evaluation.badge} Match</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>XP: +{evaluation.xpGained}</div>
                </div>
                <button onClick={() => { setEvaluation(null); setAnswer(""); }} className="btn-ghost" style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}>🔄 Try Again</button>
              </div>

              {/* Matched Keywords */}
              {evaluation.matchedKeywords && evaluation.matchedKeywords.length > 0 && (
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>✅ Matched Keywords</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {evaluation.matchedKeywords.map((w, i) => (
                      <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(16,185,129,0.08)', color: 'var(--emerald)', fontSize: '0.8rem', fontWeight: '600' }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>💪 Strengths</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {evaluation.feedback.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.4' }}>• {s}</div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>💡 Improve</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {evaluation.feedback.suggestions.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.4' }}>→ {s}</div>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              {evaluation.missingKeywords && evaluation.missingKeywords.length > 0 && (
                <div className="glass-panel" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--rose)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>❌ Missing Keywords</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {evaluation.missingKeywords.map((w, i) => (
                      <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(244,63,94,0.08)', color: 'var(--rose)', fontSize: '0.8rem', fontWeight: '600' }}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '3.5rem' }}>
              <div className="glass-panel" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
                <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                  AI insights appear here<br/>after you evaluate an answer.
                </p>
              </div>
              <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                  <span>📝 <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{questions.length}</span> Q&apos;s</span>
                  <span>📂 <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{new Set(questions.map(q => q.category)).size}</span> cats</span>
                  <span>🔥 <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{filteredQuestions.length}</span> shown</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <a href="/tips" className="glass-panel" style={{ flex: 1, padding: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'var(--transition-fast)' }}>
                  <span style={{ fontSize: '1.5rem' }}>📌</span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.15rem' }}>Tips</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>12 interview tips →</div>
                  </div>
                </a>
                <a href="/rapid-fire" className="glass-panel" style={{ flex: 1, padding: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'var(--transition-fast)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 100%)' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--foreground)', marginBottom: '0.15rem' }}>Rapid Fire</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>5 Q&apos;s, 5 min →</div>
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
