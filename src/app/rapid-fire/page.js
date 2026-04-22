'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const TOTAL_QUESTIONS = 5;
const TOTAL_TIME = 300; // 5 minutes

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

export default function RapidFire() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(TOTAL_QUESTIONS).fill(''));
  const [phase, setPhase] = useState('lobby'); // lobby | playing | evaluating | results
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState(''); // '', 'requesting', 'listening', 'error:...'
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  // Stop dictation when switching questions
  useEffect(() => {
    stopListening();
  }, [currentIdx]);

  // Cleanup on unmount
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
    setSpeechStatus('');
  };

  useEffect(() => {
    api.getQuestions().then(data => { setAllQuestions(data); setLoading(false); }).catch(() => setLoading(false));
    return () => clearInterval(timerRef.current);
  }, []);

  const pickRandom = useCallback(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS);
  }, [allQuestions]);

  const startGame = () => {
    const picked = pickRandom();
    setGameQuestions(picked);
    setAnswers(Array(TOTAL_QUESTIONS).fill(''));
    setCurrentIdx(0);
    setTimeLeft(TOTAL_TIME);
    setResults([]);
    setStreak(0);
    setPhase('playing');
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing') submitAll();
  }, [timeLeft, phase]);

  const handleAnswerChange = (val) => {
    const copy = [...answers];
    copy[currentIdx] = val;
    setAnswers(copy);
  };

  const nextQuestion = () => {
    if (currentIdx < TOTAL_QUESTIONS - 1) setCurrentIdx(currentIdx + 1);
  };
  const prevQuestion = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const toggleListen = async () => {
    if (isListening) {
      stopListening();
      return;
    }

    const SR = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    if (!SR) {
      setSpeechStatus('error: Browser not supported');
      setTimeout(() => setSpeechStatus(''), 3000);
      return;
    }

    setSpeechStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setSpeechStatus('error: Mic denied');
      setTimeout(() => setSpeechStatus(''), 3000);
      return;
    }

    const idx = currentIdx;
    const existingText = answers[idx] || '';
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
        setAnswers(prev => {
          const copy = [...prev];
          copy[idx] = displayText;
          return copy;
        });
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechStatus('error: Mic denied');
          stopListening();
        }
      };

      recognition.onend = () => {
        if (listeningRef.current) {
          try { startRecognition(); } catch (e) { stopListening(); }
        } else {
          setIsListening(false);
          setSpeechStatus('');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    };

    listeningRef.current = true;
    setIsListening(true);
    setSpeechStatus('listening');
    startRecognition();
  };

  const submitAll = async () => {
    clearInterval(timerRef.current);
    setPhase('evaluating');
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const evals = [];
    let currentStreak = 0;
    for (let i = 0; i < gameQuestions.length; i++) {
      const ans = answers[i]?.trim() || '(No answer provided)';
      try {
        const result = await api.evaluateAnswer(gameQuestions[i].question, ans, gameQuestions[i]);
        if (result.score >= 50) currentStreak++; else currentStreak = 0;
        evals.push({ ...result, question: gameQuestions[i].question, answer: ans, category: gameQuestions[i].category, difficulty: gameQuestions[i].difficulty });
      } catch {
        evals.push({ score: 0, question: gameQuestions[i].question, answer: ans, feedback: { strengths: [], weaknesses: ['Evaluation failed'], suggestions: [] }, xpGained: 0, matchedKeywords: [], category: gameQuestions[i].category, difficulty: gameQuestions[i].difficulty });
      }
    }
    setStreak(currentStreak);
    setResults(evals);
    setPhase('results');
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const totalScore = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
  const totalXP = results.reduce((a, r) => a + (r.xpGained || 0), 0);
  const answered = answers.filter(a => a.trim().length > 0).length;
  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft > 120 ? 'var(--emerald)' : timeLeft > 60 ? 'var(--amber)' : 'var(--rose)';

  const getGrade = (s) => s >= 80 ? { label: '🏆 Excellent', color: 'var(--emerald)' } : s >= 60 ? { label: '👍 Good', color: 'var(--cyan)' } : s >= 40 ? { label: '📈 Fair', color: 'var(--amber)' } : { label: '💪 Keep Going', color: 'var(--rose)' };
  const getDiffColor = (d) => ({ Easy: 'var(--emerald)', Normal: 'var(--amber)', Hard: 'var(--rose)' }[d] || 'var(--indigo)');

  if (loading) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

  // ─── LOBBY ───
  if (phase === 'lobby') return (
    <div className="container page-entrance" style={{ paddingTop: '4rem', maxWidth: '800px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }} className="animate-float badge-glow">⚡</div>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Rapid <span className="gradient-text">Fire</span></h1>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
        Answer {TOTAL_QUESTIONS} random questions in {TOTAL_TIME / 60} minutes. Think fast, type faster. Your performance is evaluated by AI after completion.
      </p>
      
      <div className="grid stagger-1" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem', textAlign: 'center' }}>
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--indigo)' }}>{TOTAL_QUESTIONS}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</div>
        </div>
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--amber)' }}>{TOTAL_TIME / 60}:00</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Limit</div>
        </div>
        <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--emerald)' }}>AI</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluated</div>
        </div>
      </div>

      <div className="saas-card stagger-2" style={{ marginBottom: '3rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '1.25rem' }}>🎮</span> How it Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--indigo)', fontWeight: '800' }}>1.</span> <span>You get <strong style={{ color: 'var(--foreground)' }}>{TOTAL_QUESTIONS} random questions</strong> from all categories</span></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--indigo)', fontWeight: '800' }}>2.</span> <span>A <strong style={{ color: 'var(--foreground)' }}>{TOTAL_TIME / 60}-minute countdown</strong> starts — auto-submits when time runs out</span></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--indigo)', fontWeight: '800' }}>3.</span> <span>Navigate freely between questions. Answer in any order</span></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--indigo)', fontWeight: '800' }}>4.</span> <span>AI evaluates all answers and gives you a <strong style={{ color: 'var(--foreground)' }}>detailed scorecard</strong></span></div>
        </div>
      </div>

      <button onClick={startGame} className="glow-button stagger-3" style={{ padding: '1rem 4rem', fontSize: '1.1rem' }} disabled={allQuestions.length < TOTAL_QUESTIONS}>
        ⚡ Start Rapid Fire
      </button>
      {allQuestions.length < TOTAL_QUESTIONS && <p style={{ fontSize: '0.8rem', color: 'var(--rose)', marginTop: '1rem' }}>Loading questions...</p>}
    </div>
  );

  // ─── EVALUATING ───
  if (phase === 'evaluating') return (
    <div className="container page-entrance" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '2rem' }}>
        <div className="spinner" style={{ width: '80px', height: '80px', borderWidth: '4px' }}></div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🤖</div>
      </div>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AI is evaluating your performance...</h2>
      <p style={{ color: 'var(--muted-foreground)' }}>Analyzing {TOTAL_QUESTIONS} responses against industry standards.</p>
    </div>
  );

  // ─── RESULTS ───
  if (phase === 'results') {
    const grade = getGrade(totalScore);
    const perfectCount = results.filter(r => r.score >= 80).length;
    return (
      <div className="container page-entrance" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="badge-glow">⚡</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Rapid Fire <span className="gradient-text">Complete</span></h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Here is your performance breakdown across all {TOTAL_QUESTIONS} questions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid stagger-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div className="radial-gauge" style={{ '--percentage': totalScore, width: '100px', height: '100px', marginBottom: '1rem', background: `conic-gradient(${grade.color} calc(var(--percentage) * 1%), rgba(255, 255, 255, 0.05) 0)` }}>
              <div className="radial-gauge-value" style={{ color: grade.color, fontSize: '1.5rem' }}><AnimatedNumber value={totalScore} />%</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Score</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: grade.color, marginTop: '0.25rem' }}>{grade.label}</div>
          </div>
          <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--indigo)', marginBottom: '0.5rem' }}>+<AnimatedNumber value={totalXP} /></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>XP Earned</div>
          </div>
          <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--amber)', marginBottom: '0.5rem' }}><AnimatedNumber value={streak} />🔥</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Streak</div>
          </div>
          <div className="saas-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--emerald)', marginBottom: '0.5rem' }}><AnimatedNumber value={perfectCount} />/<AnimatedNumber value={TOTAL_QUESTIONS} /></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aced (80%+)</div>
          </div>
        </div>

        {/* Per-Question Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
          <h2 className="stagger-2" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>Detailed Breakdown</h2>
          {results.map((r, i) => {
            const g = getGrade(r.score);
            return (
              <div key={i} className={`saas-card stagger-${(i % 5) + 2}`} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, paddingRight: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', background: `color-mix(in srgb, ${getDiffColor(r.difficulty)} 15%, transparent)`, fontWeight: '800', color: getDiffColor(r.difficulty), textTransform: 'uppercase' }}>{r.difficulty}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>{r.category}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', lineHeight: '1.4' }}>Q{i + 1}. {r.question}</h3>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0, background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: '900', color: g.color }}><AnimatedNumber value={r.score} />%</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: g.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.label}</div>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', background: 'var(--background)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', lineHeight: '1.6', fontStyle: 'italic', whiteSpace: 'pre-wrap', borderLeft: '2px solid var(--border)' }}>
                  "{r.answer}"
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                  {r.feedback?.strengths?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '800' }}>Strengths</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {r.feedback.strengths.map((s, j) => <li key={j} style={{ color: 'var(--foreground)' }}>✓ {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {r.feedback?.suggestions?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '800' }}>To Improve</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {r.feedback.suggestions.map((s, j) => <li key={j} style={{ color: 'var(--foreground)' }}>→ {s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {r.matchedKeywords?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--cyan)', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>KEYWORDS:</span>
                    {r.matchedKeywords.map((k, j) => <span key={j} style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', fontSize: '0.75rem', fontWeight: '700' }}>{k}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }} className="animate-fade-in">
          <button onClick={startGame} className="glow-button" style={{ padding: '1rem 3rem' }}>⚡ Play Again</button>
          <Link href="/dashboard" className="btn-ghost" style={{ padding: '1rem 3rem', textDecoration: 'none' }}>📊 Dashboard</Link>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───
  const q = gameQuestions[currentIdx];
  return (
    <div className="container page-entrance" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚡ <span className="gradient-text">Rapid Fire</span></h1>
        <button onClick={submitAll} className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} disabled={answered === 0}>Submit Early</button>
      </div>

      {/* Timer Bar */}
      <div className="saas-card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: '900', color: timerColor, fontVariantNumeric: 'tabular-nums', width: '90px', textAlign: 'center' }}>
          {formatTime(timeLeft)}
        </div>
        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '4px', transition: 'width 1s linear, background 0.5s ease', boxShadow: `0 0 10px ${timerColor}` }}></div>
        </div>
      </div>

      {/* Progress Dots */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', justifyContent: 'center' }}>
        {gameQuestions.map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)} style={{
            width: '44px', height: '44px', borderRadius: '50%', 
            border: `2px solid ${i === currentIdx ? 'var(--indigo)' : answers[i].trim() ? 'var(--emerald)' : 'var(--border)'}`,
            background: i === currentIdx ? 'var(--indigo)' : answers[i].trim() ? 'rgba(16,185,129,0.1)' : 'var(--card)',
            color: i === currentIdx ? 'white' : answers[i].trim() ? 'var(--emerald)' : 'var(--muted-foreground)',
            fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', transition: 'var(--transition-fast)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: i === currentIdx ? 'var(--shadow-glow-primary)' : 'none'
          }}>
            {answers[i].trim() ? '✓' : i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="saas-card animate-fade-in" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} key={currentIdx}>
        <div style={{ padding: '2rem 2rem 1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)', fontSize: '0.75rem', fontWeight: '800' }}>{q?.category}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: getDiffColor(q?.difficulty), textTransform: 'uppercase' }}>{q?.difficulty}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>Question {currentIdx + 1} of {TOTAL_QUESTIONS}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, lineHeight: '1.4' }}>{q?.question}</h2>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <textarea
            value={answers[currentIdx]}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer quickly..."
            style={{ width: '100%', minHeight: '250px', padding: '2rem', background: 'transparent', border: 'none', fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--foreground)', resize: 'none', outline: 'none' }}
          />
          {/* Typing Indicator Glow */}
          {isListening && (
            <div style={{ position: 'absolute', bottom: '1rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="badge-glow" style={{ fontSize: '0.8rem' }}>🎤</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--indigo)', fontWeight: '600' }}>Listening</span>
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.25rem' }}>
                <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ padding: '1rem 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            <span style={{ color: 'var(--foreground)', fontWeight: '800' }}>{answers[currentIdx].trim().split(/\s+/).filter(x => x).length}</span> words
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {speechStatus.startsWith('error') && (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose)', fontWeight: '700' }}>
                  ⚠️ {speechStatus.replace('error: ', '')}
                </span>
              )}
              {speechStatus === 'requesting' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: '700' }}>
                  🔄 Requesting mic...
                </span>
              )}
              <button 
                onClick={toggleListen}
                disabled={speechStatus === 'requesting'}
                className="btn-ghost"
                style={{ 
                  background: isListening ? 'rgba(244, 63, 94, 0.1)' : 'transparent', 
                  borderColor: isListening ? 'rgba(244, 63, 94, 0.4)' : 'var(--border)',
                  color: isListening ? 'var(--rose)' : 'var(--foreground)',
                  padding: '0.5rem 1rem', 
                  fontSize: '0.85rem',
                  cursor: speechStatus === 'requesting' ? 'wait' : 'pointer',
                  opacity: speechStatus === 'requesting' ? 0.5 : 1,
                }}
              >
                <span className={isListening ? "badge-glow" : ""} style={{ fontSize: '1rem' }}>🎤</span>
                {isListening ? 'Stop' : 'Dictate'}
              </button>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--indigo)', fontWeight: '700' }}>{answered}/{TOTAL_QUESTIONS} answered</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={prevQuestion} disabled={currentIdx === 0} className="btn-ghost" style={{ padding: '0.75rem 1.5rem', opacity: currentIdx === 0 ? 0.3 : 1 }}>← Previous</button>
        {currentIdx < TOTAL_QUESTIONS - 1 ? (
          <button onClick={nextQuestion} className="btn-ghost" style={{ padding: '0.75rem 1.5rem' }}>Next →</button>
        ) : (
          <button onClick={submitAll} className="glow-button" style={{ padding: '0.75rem 2rem' }} disabled={answered === 0}>🚀 Finish & Evaluate</button>
        )}
      </div>
    </div>
  );
}
