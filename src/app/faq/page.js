export default function FAQ() {
  const faqs = [
    {
      question: "How does the AI evaluation work?",
      answer: "Our engine uses a multi-modal analysis pipeline to evaluate your answers against industry benchmarks, focusing on narrative structure, tonal alignment, and role-specific depth.",
      emoji: "🧠"
    },
    {
      question: "Is my training data encrypted?",
      answer: "Security is our priority. All session data is encrypted at rest and in transit. We follow strict SOC2 compliance standards to ensure your practice remains private.",
      emoji: "🔒"
    },
    {
      question: "Can I practice for specific companies?",
      answer: "Yes, our library includes specialized tracks for Fortune 500 tech companies, tailored to their proprietary leadership metrics and common technical prompts.",
      emoji: "🏢"
    },
    {
      question: "What's included in the Pro plan?",
      answer: "Pro users get unlimited AI evaluations, access to company-specific deep dives, and advanced behavioral analysis metrics.",
      emoji: "⭐"
    },
    {
      question: "How is my score calculated?",
      answer: "We use a weighted engine that balances keyword precision (80%) with narrative depth (20%). This prevents 'keyword stuffing' and rewards structured, detailed explanations.",
      emoji: "📊"
    },
    {
      question: "What do XP and Badges represent?",
      answer: "XP tracks your total volume of practice. Badges reflect your skill tier: Level 1 is Beginner, Level 2+ is Intermediate, and Level 5 is Pro Specialist.",
      emoji: "🏅"
    },
    {
      question: "Can I track my progress over time?",
      answer: "Yes! Your Dashboard features Historical Trends which map your last 7 attempts, helping you visualize improvement and identify areas for growth.",
      emoji: "📈"
    }
  ];

  const colors = ['var(--indigo)', 'var(--cyan)', 'var(--violet)', 'var(--emerald)', 'var(--amber)', 'var(--rose)', 'var(--sky)'];

  return (
    <div className="container section animate-fade-in" style={{ maxWidth: '750px', paddingTop: '6rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Got <span className="gradient-text">Questions?</span> 🤔</h1>
        <p style={{ fontSize: '0.9rem' }}>Everything you need to know about mastering your interviews.</p>
      </header>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {faqs.map((faq, i) => (
          <div key={i} className="saas-card" style={{ padding: '1rem 1.25rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: colors[i % colors.length], fontSize: '0.95rem' }}>{faq.emoji} {faq.question}</h3>
            <p style={{ margin: 0, lineHeight: '1.5', fontSize: '0.825rem' }}>{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="saas-card" style={{ marginTop: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Still need help? 💬</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>Our team of career experts is available 24/7.</p>
        <button className="glow-button">📧 Contact Support</button>
      </div>
    </div>
  );
}
