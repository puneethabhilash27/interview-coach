const express = require('express');
const router = express.Router();

let qb = []; 
const add = (id, q, cat, diff, type, sample, dur) => qb.push({ id, question: q, category: cat, difficulty: diff, type, sampleAnswer: sample, duration: dur });

// --- BEHAVIORAL ---
add(1, "Tell me about yourself", "Behavioral", "Easy", "Non-Technical", "I am a passionate software developer with over five years of experience in building scalable web applications. In my previous role at TechFlow, I led a team that reduced API latency by 40%. I specialize in React and Node.js.", "2 mins");
add(2, "Why do you want to work here?", "Behavioral", "Easy", "Non-Technical", "I've been following your company's progress in the AI space for two years. Your culture of innovation and commitment to open-source perfectly aligns with my values. I want to contribute to a team that solves real-world accessibility problems.", "1.5 mins");
add(3, "What are you most proud of?", "Behavioral", "Normal", "Non-Technical", "I am most proud of a legacy systems migration I handled last year. We successfully launched the new platform on time with 99.9% uptime despite being six months behind schedule when I took over.", "2.5 mins");
add(4, "How do you handle a heavy workload?", "Behavioral", "Normal", "Non-Technical", "I rely on the Eisenhower Matrix to prioritize tasks. I focus on mission-critical items first and maintain proactive communication with stakeholders to manage expectations effectively.", "2 mins");
add(10, "Describe a difficult ethical decision", "Behavioral", "Hard", "Non-Technical", "I once discovered a security flaw hours before a launch. I insisted on delaying the launch to protect customer data. We fixed the exploit and maintained brand trust, which is invaluable.", "3 mins");
add(11, "Tell me about a time you mentored someone", "Behavioral", "Normal", "Non-Technical", "I mentored a junior dev by using 'Reverse Shadowing.' within months, they were leading their own features. Seeing their growth was the highlight of my tenure.", "2 mins");

// --- CONFLICT RESOLUTION ---
add(21, "How do you handle conflict in a team?", "Conflict Resolution", "Normal", "Non-Technical", "I address conflict privately and focus on shared goals rather than blame. By listening actively and proposing compromises, I turn debates into collaborative technical sessions.", "2 mins");
add(22, "How do you give feedback to someone defensive?", "Conflict Resolution", "Hard", "Non-Technical", "I use the SIT model: Situation, Impact, and Transition. This keeps feedback objective and focused on observable behaviors rather than personality traits.", "2 mins");
add(23, " coworker is late to a meeting?", "Conflict Resolution", "Easy", "Non-Technical", "I start meetings on time to respect others. Later, I follow up privately to see if there's a blocker I can help with, keeping the tone professional and supportive.", "1 min");
add(24, "Handling a micro-managing boss", "Conflict Resolution", "Hard", "Non-Technical", "I build trust by over-communicating progress daily. Once reliability is established, I suggest weekly check-ins to gain more autonomy while keeping them informed.", "2 mins");
add(25, "Resolving a technical disagreement", "Conflict Resolution", "Normal", "Non-Technical", "I propose a time-boxed POC. Data from the prototype settles the debate objectively and allows both parties to learn without feeling 'lost'.", "2.5 mins");

// --- STRATEGY ---
add(41, "Where do you see yourself in 5 years?", "Strategy", "Normal", "Non-Technical", "I aim to be a Staff Engineer recognized for mentoring and distributed systems architecture. I want to lead major product visions while growing the next generation of devs.", "2 mins");
add(42, "Aligning team goals with company strategy", "Strategy", "Hard", "Non-Technical", "I cascade company OKRs to team metrics and explain the 'Why' behind roadmaps. This ensures everyone knows their specific impact on the bottom line.", "2.5 mins");
add(43, "What is a 'goal' versus a 'task'?", "Strategy", "Easy", "Non-Technical", "A Goal is the outcome (retention +20%), while a Task is the action (fix bug). Leaders must ensure tasks always serve the ultimate goal.", "1 min");
add(44, "Prioritizing longevity over short-term hacks", "Strategy", "Hard", "Non-Technical", "I allocate 20% capacity to technical debt reduction. Sustainable architecture prevents future slowdowns, even if it delays a single feature today.", "2.5 mins");
add(45, "How to handle market competition?", "Strategy", "Normal", "Non-Technical", "Focus on 'Obsessive User Centricity.' Build what your specific users need better than anyone else, creating a moat via trust and superior experience.", "2 mins");

// --- LEADERSHIP ---
add(61, "Describe your leadership style", "Leadership", "Hard", "Non-Technical", "I practice Servant Leadership. My role is to remove blockers and provide a clear vision, giving the team high autonomy to innovate while I manage stakeholders.", "2 mins");
add(62, "Tell me about hiring strategy", "Leadership", "Normal", "Non-Technical", "I prioritize trajectory and empathy over static skills. A hungry, collaborative dev often out-performs a brilliant but dismissive one within months.", "2 mins");
add(63, "The most important leader quality", "Leadership", "Easy", "Non-Technical", "Integrity. Without reliability, you can't build trust. Without trust, teams won't take the necessary risks to achieve breakthrough innovation.", "1.5 mins");
add(64, "Motivating a burnt-out team", "Leadership", "Hard", "Non-Technical", "Reduce pressure by cutting non-essential tasks immediately. Re-connect them with the 'Impact'—the real customers they are helping every day.", "3 mins");
add(65, "Effective delegation strategy", "Leadership", "Normal", "Non-Technical", "Define the 'What' and 'Why', but let the dev own the 'How.' Use check-ins to support growth rather than micromanaging the process.", "2 mins");

// --- ALGORITHMS ---
add(81, "Binary Search complexity", "Algorithms", "Easy", "Technical", "Binary Search O(log n) halves the search space repeatedly. It is the core of efficient database indexing and sorted list retrieval at scale.", "2 mins");
add(82, "Hash Map collisions", "Algorithms", "Normal", "Technical", "Maps offer O(1) access. Collisions are handled via Chaining (lists) or Open Addressing (probing). Efficient hashing is key to low load factors.", "2.5 mins");
add(83, "Explain Big O importance", "Algorithms", "Hard", "Technical", "Big O determines scalability. Moving from O(n^2) to O(n) can be the difference between a functional product and a system-wide crash under load.", "3 mins");
add(84, "Bubble Sort vs Quick Sort", "Algorithms", "Easy", "Technical", "Bubble Sort is O(n^2) and inefficient. Quick Sort is O(n log n) average, using partitioning to achieve speed suitable for modern libraries.", "2 mins");
add(85, "BFS vs DFS usage", "Algorithms", "Normal", "Technical", "BFS finds the shortest path in unweighted graphs using a queue. DFS goes deep using a stack, best for path existence or topological sorts.", "2 mins");

// --- SYSTEM DESIGN ---
add(101, "Client vs Server", "System Design", "Easy", "Technical", "Clients are user interfaces; Servers process requests and manage data. Separation of concerns allows for independent scaling and maintenance.", "1.5 mins");
add(102, "Latency vs Throughput", "System Design", "Normal", "Technical", "Latency is delay (ms); Throughput is volume (req/s). We optimize latency with CDNs and throughput with horizontal scaling and load balancers.", "2.5 mins");
add(103, "Design Bitly service", "System Design", "Hard", "Technical", "Use base-62 counters, NoSQL for high writes, and Redis for rapid redirects. Shard the database by URL hash to ensure infinite horizontal growth.", "4 mins");
add(104, "When to use a CDN?", "System Design", "Easy", "Technical", "Use a CDN to cache static assets closer to users. This reduces latency globally and offloads traffic from your primary origin servers.", "1.5 mins");
add(105, "Database Sharding concept", "System Design", "Normal", "Technical", "Shard by key (user_id) to split data across nodes. This breaks the central DB bottleneck but adds complexity for joins across shards.", "2.5 mins");

// --- FRONTEND ---
add(121, "Explain Hoisting", "Frontend", "Easy", "Technical", "JavaScript declaration lifting. Knowing the 'Temporal Dead Zone' for let/const is critical to avoiding reference errors in modern apps.", "1.5 mins");
add(122, "What are Closures?", "Frontend", "Normal", "Technical", "Functions that remember their lexical environment. Crucial for privacy, functional programming, and React hook state management patterns.", "2.5 mins");
add(123, "Infinite Scroll optimization", "Frontend", "Hard", "Technical", "Use Intersection Observer and Virtualization to keep DOM weight low. Pre-fetch data before the user hits the bottom to ensure zero lag.", "3.5 mins");
add(124, "CSS Box Model", "Frontend", "Easy", "Technical", "Content, Padding, Border, Margin. Using 'border-box' ensures predictable layouts where sizes include padding and borders as expected.", "1.5 mins");
add(125, "React State vs Props", "Frontend", "Normal", "Technical", "State is internal/private to a component; Props are passed from parents. This separation creates predictable, reusable data flow in large apps.", "2 mins");

// --- BACKEND ---
add(141, "Horizontal vs Vertical Scaling", "Backend", "Easy", "Technical", "Vertical is bigger servers; Horizontal is more servers. Horizontal is the standard for cloud-native apps wanting high availability.", "2 mins");
add(142, "WebSocket Full Duplex", "Backend", "Normal", "Technical", "Persistent connections that let servers 'Push' data to clients instantly. Vital for chat, stock tickers, and real-time collaboration tools.", "2 mins");
add(143, "Microservices vs Monolith", "Backend", "Hard", "Technical", "Microservices scale independently but add dev-ops complexity. Ideal for large teams wanting to deploy features faster across different domains.", "3.5 mins");
add(144, "SQL Indexing strategy", "Backend", "Easy", "Technical", "B-Tree indices speed up reads but slow down writes. Only index columns used in WHERE clauses to balance performance and storage costs.", "1.5 mins");
add(145, "REST vs GraphQL", "Backend", "Normal", "Technical", "REST uses fixed endpoints; GraphQL lets clients define the response shape. GraphQL reduces over-fetching but adds query complexity and caching hurdles.", "2.5 mins");

let questions = qb;
const mockPeers = [ { name: "Sarah AI", xp: 3200, badge: "Pro" }, { name: "David Bot", xp: 1800, badge: "Intermediate" }, { name: "InterviewWizard", xp: 1550, badge: "Intermediate" } ];

router.get('/questions', (req, res) => res.json(questions));
router.get('/leaderboard', (req, res) => res.json(mockPeers.sort((a, b) => b.xp - a.xp)));

router.post('/evaluate', (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ message: 'Question/Answer required' });
  
  const questionData = questions.find(q => q.question === question);
  const sampleText = questionData?.sampleAnswer || "";
  const normalize = t => t.toLowerCase().replace(/[^\w\s]/g, '');
  
  const sampleWords = new Set(normalize(sampleText).split(/\s+/).filter(w => w.length > 3));
  const userWords = new Set(normalize(answer).split(/\s+/).filter(w => w.length > 2));
  
  let matched = [];
  sampleWords.forEach(w => { if (userWords.has(w)) matched.push(w); });
  
  const keywordCoverage = sampleWords.size > 0 ? (matched.length / sampleWords.size) : 0;
  const wordCount = normalize(answer).split(/\s+/).length;
  const narrativeDepth = Math.min(wordCount / 45, 1);
  const score = Math.round((keywordCoverage * 80) + (narrativeDepth * 20));
  
  // Calculate raw xp gained for this specific attempt
  const xpGained = Math.round((score * 1.5) + (wordCount / 4));

  res.json({ 
    score, 
    feedback: { 
      strengths: ["Professional terminology used.", "Clear structure."], 
      weaknesses: wordCount < 30 ? ["Answer is a bit brief."] : ["No major structural weaknesses."], 
      suggestions: ["Apply the STAR method for even better results."] 
    }, 
    xpGained, 
    matchedKeywords: matched 
  });
});

module.exports = router;
