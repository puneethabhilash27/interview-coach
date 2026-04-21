export const api = {
  async getQuestions() {
    try {
      const res = await fetch('http://localhost:5000/api/questions');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error (getQuestions):', err);
      throw err;
    }
  },

  async getUserStats() {
    try {
      const res = await fetch('http://localhost:5000/api/user/stats');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error (getUserStats):', err);
      throw err;
    }
  },

  async getLeaderboard() {
    try {
      const res = await fetch('http://localhost:5000/api/leaderboard');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error (getLeaderboard):', err);
      throw err;
    }
  },

  async evaluateAnswer(question, answer) {
    try {
      const res = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error (evaluateAnswer):', err);
      throw err;
    }
  }
};
