const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://interview-coach-1-c6j6.onrender.com';

const getLocalStats = () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('userStats');
  if (stored) return JSON.parse(stored);
  return { streak: 0, totalAttempts: 0, scores: [], xp: 0, badge: "Beginner", level: 1, lastActiveDate: null, name: "Guest" };
};

const saveLocalStats = (stats) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userStats', JSON.stringify(stats));
  }
};

const updateDailyStreak = (stats) => {
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastActiveDate !== today) {
    if (stats.lastActiveDate) {
      const lastDate = new Date(stats.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        stats.streak += 1;
      } else if (diffDays > 1) {
        stats.streak = 1;
      }
    } else {
      stats.streak = 1;
    }
    stats.lastActiveDate = today;
  }
  return stats;
};

export const getUserName = () => {
  if (typeof window === 'undefined') return 'Guest';
  const stats = getLocalStats();
  return stats?.name || 'Guest';
};

export const setUserName = (name) => {
  if (typeof window === 'undefined') return;
  const stats = getLocalStats();
  if (stats) {
    stats.name = name;
    saveLocalStats(stats);
  }
};

// ─── Bookmark Management ───

export const getBookmarks = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('bookmarkedQuestions');
  return stored ? JSON.parse(stored) : [];
};

export const toggleBookmark = (question) => {
  if (typeof window === 'undefined') return [];
  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex(b => b.id === question.id);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push({
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      type: question.type,
      bookmarkedAt: new Date().toISOString()
    });
  }
  localStorage.setItem('bookmarkedQuestions', JSON.stringify(bookmarks));
  return bookmarks;
};

export const isBookmarked = (questionId) => {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.id === questionId);
};

// ─── Recent Activity Tracking ───

export const getRecentActivity = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('recentActivity');
  return stored ? JSON.parse(stored) : [];
};

const addRecentActivity = (question, score, extras = {}) => {
  if (typeof window === 'undefined') return;
  const activity = getRecentActivity();
  const filtered = activity.filter(a => a.questionId !== (typeof question === 'object' ? question.id : null));
  filtered.unshift({
    questionId: typeof question === 'object' ? question.id : null,
    question: typeof question === 'object' ? question.question : question,
    category: typeof question === 'object' ? question.category : 'Unknown',
    difficulty: typeof question === 'object' ? question.difficulty : 'Normal',
    score,
    answer: extras.answer || '',
    wordCount: extras.wordCount || 0,
    keywordCoverage: extras.keywordCoverage || 0,
    usedStar: extras.usedStar || false,
    timestamp: new Date().toISOString()
  });
  const trimmed = filtered.slice(0, 30);
  localStorage.setItem('recentActivity', JSON.stringify(trimmed));
};

// ─── Performance Metrics (for radar chart) ───

export const getPerformanceMetrics = () => {
  const activity = getRecentActivity();
  if (activity.length === 0) return null;

  const scores = activity.map(a => a.score).filter(s => s != null);
  const wordCounts = activity.map(a => a.wordCount || 0);
  const kwCovs = activity.map(a => a.keywordCoverage || 0);
  const starCount = activity.filter(a => a.usedStar).length;

  const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avgScore = avg(scores);
  const avgKwCov = avg(kwCovs);
  const avgWordCount = avg(wordCounts);
  const starRate = (starCount / activity.length) * 100;
  const depthRate = Math.min((avgWordCount / 60) * 100, 100);

  // Consistency: inverse of coefficient of variation
  let consistency = 100;
  if (scores.length > 1) {
    const mean = avgScore;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    consistency = mean > 0 ? Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100)) : 0;
  }

  const volume = Math.min((activity.length / 15) * 100, 100);

  return [
    { label: 'Accuracy', value: Math.round(avgScore), color: 'var(--indigo)' },
    { label: 'Keyword Match', value: Math.round(avgKwCov), color: 'var(--cyan)' },
    { label: 'Answer Depth', value: Math.round(depthRate), color: 'var(--emerald)' },
    { label: 'STAR Method', value: Math.round(starRate), color: 'var(--amber)' },
    { label: 'Consistency', value: Math.round(consistency), color: 'var(--violet)' },
    { label: 'Volume', value: Math.round(volume), color: 'var(--rose)' },
  ];
};

// ─── Skill Distribution ───

export const getSkillDistribution = () => {
  const activity = getRecentActivity();
  const dist = {};
  activity.forEach(a => {
    const cat = a.category || 'Unknown';
    if (!dist[cat]) dist[cat] = { count: 0, totalScore: 0 };
    dist[cat].count += 1;
    dist[cat].totalScore += a.score || 0;
  });
  return Object.entries(dist).map(([category, data]) => ({
    category,
    count: data.count,
    avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
  })).sort((a, b) => b.count - a.count);
};

export const api = {
  async getQuestions() {
    try {
      const res = await fetch(`${BASE_URL}/api/questions`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error (getQuestions):', err);
      throw err;
    }
  },

  async getUserStats() {
    try {
      // Make sure we have local stats initialized
      let stats = getLocalStats();
      if (!stats) return null;
      
      const sum = stats.scores.reduce((a, b) => a + b, 0);
      const averageScore = stats.scores.length > 0 ? Math.round(sum / stats.scores.length) : 0;
      return { ...stats, averageScore, history: stats.scores };
    } catch (err) {
      console.error('Local API Error (getUserStats):', err);
      throw err;
    }
  },

  async getLeaderboard() {
    try {
      const res = await fetch(`${BASE_URL}/api/leaderboard`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      let leaders = await res.json();
      
      // Filter out any mocked "You (...)" entries that might come from the backend
      leaders = leaders.filter(l => !l.name.startsWith('You ('));
      
      // Inject local user into leaderboard
      const localStats = getLocalStats();
      const userName = localStats?.name || 'Guest';
      if (localStats && localStats.totalAttempts > 0) {
        leaders.push({ name: `You (${userName})`, xp: localStats.xp, badge: localStats.badge, isYou: true });
        leaders.sort((a, b) => b.xp - a.xp);
      } else {
        leaders.push({ name: `You (${userName})`, xp: 0, badge: "Beginner", isYou: true });
        leaders.sort((a, b) => b.xp - a.xp);
      }
      return leaders;
    } catch (err) {
      console.error('API Error (getLeaderboard):', err);
      throw err;
    }
  },

  async evaluateAnswer(question, answer, questionObj = null) {
    try {
      const res = await fetch(`${BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      // Update local stats based on pure score from backend
      if (typeof window !== 'undefined') {
        let stats = getLocalStats();
        if (stats) {
          stats = updateDailyStreak(stats);
          stats.totalAttempts += 1;
          stats.scores.push(data.score);
          stats.xp += data.xpGained;
          stats.level = Math.floor(stats.xp / 1000) + 1;
          stats.badge = stats.level >= 5 ? "Pro" : (stats.level >= 2 ? "Intermediate" : "Beginner");
          
          saveLocalStats(stats);
          
          // Inject updated local level/badge into response
          data.level = stats.level;
          data.badge = stats.badge;
        }

        // Track recent activity with richer data
        const answerText = answer || '';
        const wordCount = answerText.trim().split(/\s+/).filter(x => x).length;
        const totalKw = (data.matchedKeywords?.length || 0) + (data.missingKeywords?.length || 0);
        const keywordCoverage = totalKw > 0 ? Math.round((data.matchedKeywords?.length || 0) / totalKw * 100) : 0;
        const starWords = ['situation', 'task', 'action', 'result'];
        const lowerAnswer = answerText.toLowerCase();
        const usedStar = starWords.filter(w => lowerAnswer.includes(w)).length >= 2;
        addRecentActivity(questionObj || question, data.score, { answer, wordCount, keywordCoverage, usedStar });
      }
      return data;
    } catch (err) {
      console.error('API Error (evaluateAnswer):', err);
      throw err;
    }
  }
};
