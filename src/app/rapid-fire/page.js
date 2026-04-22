'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const TOTAL_QUESTIONS = 5;
const TOTAL_TIME = 300; // 5 minutes

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
    // STOP
    if (isListening) {
      stopListening();
      return;
    }

    // Check browser support
    const SR = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    if (!SR) {
      setSpeechStatus('error: Browser not supported');
      setTimeout(() => setSpeechStatus(''), 3000);
      return;
    }

    // Step 1: Explicitly request microphone permission first
    setSpeechStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Got permission — stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setSpeechStatus('error: Mic denied');
      setTimeout(() => setSpeechStatus(''), 3000);
      return;
    }

    // Step 2: Start speech recognition
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
          if (event.results[i].isFinal) {
            finalText += t + ' ';
          } else {
            interimText += t;
          }
        }

        if (finalText) {
          committedText = (committedText + ' ' + finalText).trim();
        }

        const displayText = finalText
          ? committedText
          : (committedText + ' ' + interimText).trim();

        setAnswers(prev => {
          const copy = [...prev];
          copy[idx] = displayText;
          return copy;
        });
      };

      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechStatus('error: Mic denied');
          stopListening();
        }
        // 'no-speech' and 'aborted' are normal during restarts
      };

      recognition.onend = () => {
        // Auto-restart if user hasn't stopped
        if (listeningRef.current) {
          try {
            startRecognition();
          } catch (e) {
            stopListening();
          }
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

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

  // ─── LOBBY ───
  if (phase === 'lobby') return (
    <div className="container page-entrance" style={{ paddingTop: '7rem', maxWidth: '700px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡</div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Rapid <span className="gradient-text">Fire</span></h1>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        Answer {TOTAL_QUESTIONS} random questions in {TOTAL_TIME / 60} minutes. Think fast, type faster. Your performance is evaluated by AI after completion.
      </p>
      <div className="saas-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
        <div><div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--indigo)' }}>{TOTAL_QUESTIONS}</div><div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>QUESTIONS</div></div>
        <div><div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--amber)' }}>{TOTAL_TIME / 60}:00</div><div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>TIME LIMIT</div></div>
        <div><div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--emerald)' }}>AI</div><div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: '600' }}>EVALUATED</div></div>
      </div>
      <div className="saas-card" style={{ marginBottom: '2rem', textAlign: 'left', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>🎮 How it Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
          <div>1️⃣ You get <strong style={{ color: 'var(--foreground)' }}>{TOTAL_QUESTIONS} random questions</strong> from all categories</div>
          <div>2️⃣ A <strong style={{ color: 'var(--foreground)' }}>{TOTAL_TIME / 60}-minute countdown</strong> starts — auto-submits when time runs out</div>
          <div>3️⃣ Navigate freely between questions. Answer in any order</div>
          <div>4️⃣ AI evaluates all answers and gives you a <strong style={{ color: 'var(--foreground)' }}>detailed scorecard</strong></div>
          <div>5️⃣ Build <strong style={{ color: 'var(--foreground)' }}>answer streaks</strong> by scoring 50%+ on consecutive questions</div>
        </div>
      </div>
      <button onClick={startGame} className="glow-button" style={{ padding: '0.9rem 3rem', fontSize: '1rem' }} disabled={allQuestions.length < TOTAL_QUESTIONS}>
        ⚡ Start Rapid Fire
      </button>
      {allQuestions.length < TOTAL_QUESTIONS && <p style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '0.75rem' }}>Not enough questions loaded.</p>}
    </div>
  );

  // ─── EVALUATING ───
  if (phase === 'evaluating') return (
    <div className="container page-entrance" style={{ paddingTop: '10rem', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
      <h2>AI is evaluating your answers...</h2>
      <p style={{ color: 'var(--muted-foreground)' }}>Analyzing {TOTAL_QUESTIONS} responses</p>
    </div>
  );

  // ─── RESULTS ───
  if (phase === 'results') {
    const grade = getGrade(totalScore);
    const perfectCount = results.filter(r => r.score >= 80).length;
    return (
      <div className="container page-entrance" style={{ paddingTop: '6rem', paddingBottom: '3rem', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Rapid Fire <span className="gradient-text">Complete</span></h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Here's how you performed across all {TOTAL_QUESTIONS} questions</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="saas-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: grade.color }}>{totalScore}%</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>Avg Score</div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: grade.color, marginTop: '0.25rem' }}>{grade.label}</div>
          </div>
          <div className="saas-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--indigo)' }}>+{totalXP}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>XP Earned</div>
          </div>
          <div className="saas-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--amber)' }}>{streak}🔥</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>Best Streak</div>
          </div>
          <div className="saas-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--emerald)' }}>{perfectCount}/{TOTAL_QUESTIONS}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: '700', textTransform: 'uppercase' }}>Aced (80%+)</div>
          </div>
        </div>

        {/* Per-Question Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {results.map((r, i) => {
            const g = getGrade(r.score);
            return (
              <div key={i} className="saas-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: '800', color: getDiffColor(r.difficulty), textTransform: 'uppercase' }}>{r.difficulty}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>•</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--indigo)', fontWeight: '600' }}>{r.category}</span>
                    </div>
                    <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: '700' }}>Q{i + 1}. {r.question}</h3>
                  </div>
                  <div style={{ textAlign: 'center', marginLeft: '1rem', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: g.color }}>{r.score}%</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: g.color }}>{g.label}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', marginBottom: '0.6rem', lineHeight: '1.5', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                  "{r.answer}"
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.7rem' }}>
                  {r.feedback?.strengths?.map((s, j) => <span key={j} style={{ color: 'var(--emerald)' }}>✅ {s}</span>)}
                  {r.feedback?.weaknesses?.map((w, j) => <span key={j} style={{ color: 'var(--rose)' }}>⚠️ {w}</span>)}
                  {r.feedback?.suggestions?.map((s, j) => <span key={j} style={{ color: 'var(--cyan)' }}>💡 {s}</span>)}
                </div>
                {r.matchedKeywords?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {r.matchedKeywords.map((k, j) => <span key={j} style={{ padding: '0.1rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(16,185,129,0.08)', color: 'var(--emerald)', fontSize: '0.6rem', fontWeight: '600' }}>{k}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={startGame} className="glow-button" style={{ padding: '0.75rem 2rem' }}>⚡ Play Again</button>
          <Link href="/dashboard" className="btn-ghost" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>📊 Dashboard</Link>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───
  const q = gameQuestions[currentIdx];
  return (
    <div className="container page-entrance" style={{ paddingTop: '6rem', paddingBottom: '2rem', maxWidth: '900px' }}>
      {/* Timer Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Rapid Fire</span>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '3px', transition: 'width 1s linear, background 0.5s ease' }}></div>
        </div>
      </div>

      {/* Progress Dots */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        {gameQuestions.map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)} style={{
            width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${i === currentIdx ? 'var(--indigo)' : answers[i].trim() ? 'var(--emerald)' : 'var(--border)'}`,
            background: i === currentIdx ? 'var(--indigo)' : answers[i].trim() ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: i === currentIdx ? 'white' : answers[i].trim() ? 'var(--emerald)' : 'var(--muted-foreground)',
            fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', transition: 'var(--transition-fast)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {answers[i].trim() ? '✓' : i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="saas-card animate-fade-in" style={{ marginBottom: '1rem' }} key={currentIdx}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.08)', color: 'var(--indigo)', fontSize: '0.65rem', fontWeight: '700' }}>{q?.category}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: getDiffColor(q?.difficulty), textTransform: 'uppercase' }}>{q?.difficulty}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Q{currentIdx + 1} of {TOTAL_QUESTIONS}</span>
        </div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', lineHeight: '1.3' }}>{q?.question}</h2>

        <div className="editor-surface">
          <textarea
            value={answers[currentIdx]}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer quickly..."
            style={{ width: '100%', minHeight: '200px', padding: '1rem', background: 'transparent', border: 'none', fontSize: '0.9rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', resize: 'none', outline: 'none' }}
          />
          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
              <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{answers[currentIdx].trim().split(/\s+/).filter(x => x).length}</span> words
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {speechStatus.startsWith('error') && (
                <span style={{ fontSize: '0.65rem', color: 'var(--rose)', fontWeight: '600' }}>
                  ⚠️ {speechStatus.replace('error: ', '')}
                </span>
              )}
              {speechStatus === 'requesting' && (
                <span style={{ fontSize: '0.65rem', color: 'var(--amber)', fontWeight: '600' }}>
                  🔄 Requesting mic...
                </span>
              )}
              <button 
                onClick={toggleListen}
                disabled={speechStatus === 'requesting'}
                style={{ 
                  background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.05)', 
                  border: `1px solid ${isListening ? 'rgba(244, 63, 94, 0.4)' : 'transparent'}`,
                  color: isListening ? 'var(--rose)' : 'var(--muted-foreground)',
                  padding: '0.3rem 0.6rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: speechStatus === 'requesting' ? 'wait' : 'pointer',
                  transition: 'var(--transition-fast)',
                  opacity: speechStatus === 'requesting' ? 0.5 : 1,
                }}
              >
                <span className={isListening ? "badge-glow" : ""} style={{ fontSize: '0.9rem' }}>🎤</span>
                {isListening ? 'Stop' : 'Dictate'}
              </button>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{answered}/{TOTAL_QUESTIONS} answered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={prevQuestion} disabled={currentIdx === 0} className="btn-ghost" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', opacity: currentIdx === 0 ? 0.3 : 1 }}>← Prev</button>
        {currentIdx < TOTAL_QUESTIONS - 1 ? (
          <button onClick={nextQuestion} className="btn-ghost" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>Next →</button>
        ) : (
          <button onClick={submitAll} className="glow-button" style={{ padding: '0.6rem 1.75rem', fontSize: '0.85rem' }} disabled={answered === 0}>🚀 Submit All</button>
        )}
      </div>
    </div>
  );
}
