async function auditQuestions() {
  try {
    const res = await fetch('http://localhost:5000/api/questions');
    const questions = await res.json();
    console.log(`Total Questions: ${questions.length}`);
    
    const categories = [...new Set(questions.map(q => q.category))];
    const difficulties = ['Easy', 'Normal', 'Hard'];

    categories.forEach(cat => {
      let line = `Category: ${cat.padEnd(20)} | `;
      difficulties.forEach(diff => {
        const count = questions.filter(q => q.category === cat && q.difficulty === diff).length;
        line += `${diff}: ${count}  `;
      });
      console.log(line);
    });
  } catch (err) {
    console.error('Audit failed:', err.message);
  }
}

auditQuestions();
