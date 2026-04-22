'use client';
import { useState, useEffect, useRef } from 'react';
import { api, getBookmarks, toggleBookmark, getRecentActivity } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const popVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 20 } }
};

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
    if (!selectedQuestion || !answer.trim()) return;
    setIsEvaluating(true); setError(null);
    try {
      const result = await api.evaluateAnswer(selectedQuestion.question, answer, selectedQuestion);
      setEvaluation(result);
    } catch (err) { setError("Evaluation failed."); console.error(err); }
    finally { setIsEvaluating(false); }
  };

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

    const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
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

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '1600px', paddingBottom: '2rem', paddingTop: '3rem' }}>
      {error && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: 'var(--rose)', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', zIndex: 100, fontSize: '0.8rem', fontWeight: '700', boxShadow: 'var(--shadow-md)' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: '1rem', alignItems: 'start' }}>

        {/* ─── LEFT: Question Library ─── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 8rem)', position: 'sticky', top: '7rem' }}>
          
          <div style={{ background: 'var(--card)', borderRadius: '0.75rem', border: '1px solid var(--card-border)', padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '0.5rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.9rem' }}>🔍</span> Filters
            </h3>
            
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', marginBottom: '0.75rem', borderRadius: '0.4rem', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.8rem', outline: 'none' }}>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
              {difficulties.map(d => (
                <button key={d} onClick={() => setSelectedDifficulty(d)}
                  style={{ flex: 1, padding: '0.3rem 0', borderRadius: '0.3rem', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer',
                    border: `1px solid ${selectedDifficulty === d ? 'var(--indigo)' : 'var(--border)'}`,
                    background: selectedDifficulty === d ? 'var(--indigo)' : 'transparent',
                    color: selectedDifficulty === d ? 'white' : 'var(--muted-foreground)' }}>
                  {d}
                </button>
              ))}
            </div>
            
            <button onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                border: `1px solid ${showBookmarksOnly ? 'var(--rose)' : 'var(--border)'}`,
                background: showBookmarksOnly ? 'rgba(244,63,94,0.1)' : 'transparent',
                color: showBookmarksOnly ? 'var(--rose)' : 'var(--muted-foreground)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              📌 {showBookmarksOnly ? 'Show All' : `Bookmarks (${bookmarks.length})`}
            </button>
          </div>

          <motion.div variants={listVariants} initial="hidden" animate="show" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingRight: '0.25rem' }}>
            <AnimatePresence>
              {filteredQuestions.map((q) => (
                <motion.div key={q.id} variants={itemVariants} layout onClick={() => { 
                  setSelectedQuestion(q); 
                  setEvaluation(null); 
                  const recent = getRecentActivity();
                  const pastActivity = recent.find(a => a.questionId === q.id);
                  setAnswer(pastActivity ? pastActivity.answer || "" : "");
                }}
                  style={{
                    textAlign: 'left', padding: '0.75rem', cursor: 'pointer',
                    background: selectedQuestion?.id === q.id ? 'var(--card-hover)' : 'var(--card)',
                    border: `1px solid ${selectedQuestion?.id === q.id ? 'var(--indigo)' : 'var(--card-border)'}`,
                    borderRadius: '0.5rem', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', gap: '0.25rem'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: getDiffColor(q.difficulty), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q.difficulty}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span onClick={(e) => handleToggleBookmark(e, q)}
                        style={{ cursor: 'pointer', fontSize: '0.75rem', color: bookmarks.some(b => b.id === q.id) ? 'var(--rose)' : 'var(--muted-foreground)' }}>
                        {bookmarks.some(b => b.id === q.id) ? '📌' : '☆'} Save
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: '600' }}>⏱ {q.duration || "N/A"}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', lineHeight: '1.2', color: selectedQuestion?.id === q.id ? 'var(--foreground)' : 'var(--foreground)' }}>
                    {q.question}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </aside>

        {/* ─── CENTER: Editor + Helpers ─── */}
        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence mode="wait">
            {selectedQuestion ? (
              <motion.div 
                key={selectedQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      <span style={{ padding: '0.1rem 0.4rem', borderRadius: '0.2rem', background: 'rgba(99,102,241,0.15)', color: 'var(--indigo)', fontWeight: '600' }}>{selectedQuestion.category}</span>
                      <span>• {selectedQuestion.type}</span>
                      <span style={{ color: 'var(--cyan)' }}>• ⏱ {selectedQuestion.duration}</span>
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.2', margin: 0, display: 'flex', gap: '0.4rem' }}>
                      <span>👋</span> {selectedQuestion.question}
                    </h1>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => handleToggleBookmark(e, selectedQuestion)}
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', color: 'var(--foreground)', fontSize: '0.75rem', cursor: 'pointer' }}>
                    {bookmarks.some(b => b.id === selectedQuestion.id) ? '📌 Saved' : '☆ Bookmark'}
                  </motion.button>
                </div>

                {/* Enhanced Editor */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Construct your response using the STAR method..."
                    style={{ width: '100%', minHeight: '250px', padding: '1rem', background: 'transparent', border: 'none', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--foreground)', resize: 'none', outline: 'none' }} />
                  
                  <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{answer.trim().split(/\s+/).filter(x => x).length}</span> words • <span style={{ color: 'var(--foreground)', fontWeight: '700' }}>{answer.length}</span> chars
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleListen}
                        style={{ background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isListening ? 'var(--rose)' : 'var(--border)'}`, color: isListening ? 'var(--rose)' : 'var(--foreground)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🎤 Dictate
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setAnswer(selectedQuestion.sampleAnswer)}
                        style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px dashed var(--cyan)', color: 'var(--cyan)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        ✨ Ask Coach
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleEvaluate} disabled={!answer.trim() || isEvaluating}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--foreground)', padding: '0.4rem 1rem', borderRadius: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: !answer.trim() || isEvaluating ? 0.5 : 1 }}>
                        🚀 Evaluate
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Compact Helper Strip */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      📋 STAR
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <span><span style={{ color: 'var(--cyan)', fontWeight: '700' }}>S</span> Situation</span>
                      <span><span style={{ color: 'var(--emerald)', fontWeight: '700' }}>T</span> Task</span>
                      <span><span style={{ color: 'var(--amber)', fontWeight: '700' }}>A</span> Action</span>
                      <span><span style={{ color: 'var(--rose)', fontWeight: '700' }}>R</span> Result</span>
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      🎯 TARGET KEYWORDS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {getKeywords(selectedQuestion.sampleAnswer).slice(0, 8).map((word, i) => (
                        <span key={i} style={{ padding: '0.15rem 0.4rem', borderRadius: '0.2rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{word}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Helpers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                    <strong style={{ color: 'var(--amber)' }}>💡 Hint:</strong> {selectedQuestion.sampleAnswer.substring(0, 80)}... <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => setAnswer(selectedQuestion.sampleAnswer)}>Use "Ask Coach" for full answer</span>
                  </div>
                  <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ color: 'var(--rose)' }}>⚡</span> <strong>45+</strong> words</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ color: 'var(--emerald)' }}>📊</span> <strong>80/20</strong> scoring</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card)', borderRadius: '0.75rem', border: '1px dashed var(--border)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <motion.div 
                  animate={{ x: [-10, 0, -10] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: '2.5rem', opacity: 0.5, marginBottom: '0.75rem' }}
                >👈</motion.div>
                <h2 style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Select a question from the library to begin</h2>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ─── RIGHT: Insights & Stats ─── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 8rem)', position: 'sticky', top: '7rem' }}>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px', textAlign: 'center' }}>
            {isEvaluating ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="spinner" style={{ marginBottom: '0.75rem' }}></div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Analyzing response...</p>
              </motion.div>
            ) : evaluation ? (
              <motion.div variants={popVariants} initial="hidden" animate="show" style={{ width: '100%' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--indigo)', marginBottom: '0.4rem' }}>{evaluation.score}%</div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--emerald)', marginBottom: '0.75rem' }}>{evaluation.badge} Match</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', fontSize: '0.75rem' }}>
                  {evaluation.feedback.strengths.slice(0, 2).map((s, i) => (
                    <div key={i} style={{ color: 'var(--emerald)' }}>✓ {s}</div>
                  ))}
                  {evaluation.feedback.suggestions.slice(0, 2).map((s, i) => (
                    <div key={i} style={{ color: 'var(--amber)' }}>→ {s}</div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.8 }}>📊</div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>AI insights appear here<br/>after you evaluate an answer.</p>
              </motion.div>
            )}
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>📄 <strong style={{ color: 'var(--foreground)' }}>{questions.length}</strong> Q's</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>📁 <strong style={{ color: 'var(--foreground)' }}>{uniqueCategories.length - 2}</strong> cats</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>🔥 <strong style={{ color: 'var(--foreground)' }}>{filteredQuestions.length}</strong> shown</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Link href="/tips" style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-smooth)' }} className="hover:border-indigo-500">
              <div style={{ fontSize: '1.25rem' }}>📌</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>Tips</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>12 interview tips →</div>
              </div>
            </Link>
            <Link href="/rapid-fire" style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-smooth)' }} className="hover:border-indigo-500">
              <div style={{ fontSize: '1.25rem' }}>⚡</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>Rapid Fire</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>5 Q's, 5 min →</div>
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
