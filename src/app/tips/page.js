export default function Tips() {
  const interviewTips = [
    { emoji: '🎯', title: 'Use the STAR Method', desc: 'Structure every answer with Situation, Task, Action, Result. This gives interviewers a clear narrative to follow and shows structured thinking.', color: 'var(--indigo)' },
    { emoji: '⏱️', title: 'Respect the Clock', desc: 'Keep behavioral answers under 2-3 minutes. Technical questions may need longer — use the ⏱ time beside each question in Practice as your guide for how long to speak.', color: 'var(--cyan)' },
    { emoji: '📊', title: 'Quantify Everything', desc: '"Improved performance by 40%" beats "made things faster." Numbers show real impact and make your answers memorable to interviewers.', color: 'var(--violet)' },
    { emoji: '🧠', title: 'Show Your Thinking', desc: 'Explain WHY you made decisions, not just WHAT you did. Interviewers care about your reasoning process more than the final outcome.', color: 'var(--emerald)' },
    { emoji: '💬', title: 'Practice Out Loud', desc: 'Writing answers is step one. Speaking them aloud builds real confidence. Record yourself and listen back for filler words like "um" and "like".', color: 'var(--amber)' },
    { emoji: '🔄', title: 'Iterate & Improve', desc: 'Answer the same question multiple times. Each attempt should incorporate feedback from the previous evaluation. Growth comes from repetition.', color: 'var(--rose)' },
    { emoji: '🚫', title: 'Avoid Generic Answers', desc: '"I\'m a team player" means nothing without context. Tie every answer to a specific experience with real details, people, and outcomes.', color: 'var(--sky)' },
    { emoji: '🤝', title: 'Prepare Questions to Ask', desc: 'Always have 2-3 thoughtful questions ready for the interviewer. It shows genuine interest, engagement, and that you\'ve done your homework.', color: 'var(--teal)' },
    { emoji: '📝', title: 'Research the Company', desc: 'Reference the company\'s recent projects, values, or tech stack in your answers. It demonstrates preparation, cultural fit, and real enthusiasm.', color: 'var(--pink)' },
    { emoji: '😤', title: 'Handle Pressure Gracefully', desc: 'It\'s okay to pause and think. Say "That\'s a great question, let me think for a moment" — silence is better than rambling or panicking.', color: 'var(--orange)' },
    { emoji: '🪞', title: 'Mirror the Language', desc: 'Listen carefully to how the interviewer phrases things. Using their terminology shows active listening and alignment with the company culture.', color: 'var(--lime)' },
    { emoji: '📐', title: 'Structure Technical Answers', desc: 'For system design or coding questions, always start by clarifying requirements, then outline your approach before diving into details.', color: 'var(--indigo)' },
  ];

  const websiteTips = [
    { emoji: '⏱', title: 'Duration Badge', desc: 'The time shown beside each question (e.g. "2 mins") indicates how long you should speak on that topic in a real interview. Use it to pace yourself while practicing.', color: 'var(--cyan)' },
    { emoji: '🎯', title: 'Target Keywords', desc: 'The colored keyword tags below the editor show what the AI evaluator looks for. Try to naturally incorporate these terms into your answer for a higher score.', color: 'var(--emerald)' },
    { emoji: '✨', title: 'Ask Coach Button', desc: 'Stuck on a question? Click "Ask Coach" to load a model answer into the editor. Study it carefully, then clear the editor and write your own improved version.', color: 'var(--amber)' },
    { emoji: '📊', title: 'Scoring System', desc: 'Your score is calculated as 80% keyword coverage + 20% narrative depth. Answers with 45+ words get full depth points. Short answers will cap your maximum score.', color: 'var(--indigo)' },
    { emoji: '💡', title: 'Hint Strip', desc: 'The hint below the editor reveals the first ~80 characters of the model answer — just enough to point you in the right direction without giving everything away.', color: 'var(--violet)' },
    { emoji: '🔍', title: 'Smart Filters', desc: 'Use category and difficulty filters in the left sidebar to focus your practice on specific areas — e.g. only "Hard" + "System Design" for advanced prep.', color: 'var(--rose)' },
    { emoji: '📈', title: 'Dashboard Tracking', desc: 'Every evaluation updates your XP, level, and historical trends on the Dashboard. Use the trend chart to visualize your improvement over your last 7 attempts.', color: 'var(--sky)' },
    { emoji: '🏆', title: 'Badges & Levels', desc: 'Level up by earning XP with each evaluation. XP is based on your score and word count. Reach Level 5 for Pro Specialist status and bragging rights!', color: 'var(--orange)' },
  ];

  const commonMistakes = [
    { emoji: '❌', mistake: 'Rambling for 5+ minutes', fix: 'Use ⏱ time badges to stay on track', color: 'var(--rose)' },
    { emoji: '❌', mistake: 'No specific examples', fix: 'Always include a real story from your experience', color: 'var(--amber)' },
    { emoji: '❌', mistake: 'Badmouthing previous employers', fix: 'Frame challenges as learning opportunities', color: 'var(--violet)' },
    { emoji: '❌', mistake: 'Saying "I don\'t know"', fix: 'Say "I\'d approach it by..." and reason through it', color: 'var(--cyan)' },
    { emoji: '❌', mistake: 'Not asking questions back', fix: 'Prepare 2-3 insightful questions about the role/team', color: 'var(--emerald)' },
    { emoji: '❌', mistake: 'Memorizing answers word-for-word', fix: 'Learn key points and speak naturally', color: 'var(--indigo)' },
  ];

  const starExamples = [
    { letter: 'S', label: 'Situation', example: '"In my previous role at TechCorp, our main API was experiencing 3-second response times during peak hours..."', color: 'var(--cyan)' },
    { letter: 'T', label: 'Task', example: '"I was tasked with reducing API latency to under 500ms without increasing infrastructure costs..."', color: 'var(--emerald)' },
    { letter: 'A', label: 'Action', example: '"I implemented Redis caching, optimized database queries, and introduced connection pooling..."', color: 'var(--amber)' },
    { letter: 'R', label: 'Result', example: '"Response times dropped to 200ms — a 93% improvement — and we saved $2K/month on server costs."', color: 'var(--rose)' },
  ];

  return (
    <div className="container section animate-fade-in" style={{ maxWidth: '950px', paddingTop: '6rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
          Interview <span className="gradient-text">Mastery</span> 🎓
        </h1>
        <p style={{ fontSize: '0.9rem', maxWidth: '550px', margin: '0 auto' }}>Essential tips to ace your interviews + how to get the most out of this platform.</p>
      </header>

      {/* ═══ STAR Deep Dive ═══ */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 STAR Method — In Depth
          <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(139,92,246,0.08)', color: 'var(--violet)', fontWeight: '700' }}>must-know</span>
        </h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {starExamples.map((item, i) => (
            <div key={i} className="saas-card" style={{ padding: '0.85rem 1.1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '900', color: item.color, background: `color-mix(in srgb, ${item.color} 8%, transparent)`, flexShrink: 0 }}>
                {item.letter}
              </div>
              <div>
                <h3 style={{ fontSize: '0.85rem', marginBottom: '0.2rem', color: item.color }}>{item.label}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.5', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>{item.example}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }}></div>

      {/* ═══ Interview Tips ═══ */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎤 Interview Tips
          <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(139,92,246,0.08)', color: 'var(--violet)', fontWeight: '700' }}>{interviewTips.length} tips</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
          {interviewTips.map((tip, i) => (
            <div key={i} className="saas-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.1rem', flexShrink: 0, width: '1.85rem', height: '1.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${tip.color} 8%, transparent)`, borderRadius: '0.4rem' }}>
                {tip.emoji}
              </div>
              <div>
                <h3 style={{ fontSize: '0.8rem', marginBottom: '0.15rem', color: tip.color }}>{tip.title}</h3>
                <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: '1.45' }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }}></div>

      {/* ═══ Common Mistakes ═══ */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🚨 Common Mistakes
          <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(244,63,94,0.08)', color: 'var(--rose)', fontWeight: '700' }}>avoid these</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
          {commonMistakes.map((item, i) => (
            <div key={i} className="saas-card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--rose)' }}>{item.emoji} {item.mistake}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--emerald)' }}>
                ✅ <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.fix}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }}></div>

      {/* ═══ Platform Guide ═══ */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🗺️ Platform Guide
          <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(6,182,212,0.08)', color: 'var(--cyan)', fontWeight: '700' }}>how-to</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
          {websiteTips.map((tip, i) => (
            <div key={i} className="saas-card" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1rem', flexShrink: 0, width: '1.85rem', height: '1.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${tip.color} 8%, transparent)`, borderRadius: '0.4rem' }}>
                {tip.emoji}
              </div>
              <div>
                <h3 style={{ fontSize: '0.8rem', marginBottom: '0.15rem', color: tip.color }}>{tip.title}</h3>
                <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: '1.45' }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="saas-card" style={{ textAlign: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.06))' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Ready to practice? 🚀</h3>
        <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Apply these tips in a real practice session.</p>
        <a href="/practice" className="glow-button">💡 Start Practicing</a>
      </div>
    </div>
  );
}
