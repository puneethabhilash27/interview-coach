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

  async evaluateAnswer(question, answer) {
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
      }
      return data;
    } catch (err) {
      console.error('API Error (evaluateAnswer):', err);
      throw err;
    }
  }
};
