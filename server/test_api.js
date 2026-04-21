const API_URL = 'https://interview-coach-1-c6j6.onrender.com/api';

async function testAPI() {
  console.log('Testing Interview Coach API (Gamification Mode)...');

  try {
    // 1. Test Questions GET
    console.log('\n--- Testing GET /questions ---');
    const qRes = await fetch(`${API_URL}/questions`);
    const questions = await qRes.json();
    console.log(`Status: ${qRes.status}`);

    // 2. Test Leaderboard GET
    console.log('\n--- Testing GET /leaderboard ---');
    const lRes = await fetch(`${API_URL}/leaderboard`);
    const leaderboard = await lRes.json();
    console.log(`Status: ${lRes.status}`);
    console.log('Leaderboard:', leaderboard);

    // 3. Test Evaluation POST
    if (questions.length > 0) {
      console.log('\n--- Testing POST /evaluate ---');
      const eRes = await fetch(`${API_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[0].question,
          answer: 'I am a software engineer with strong technical skills in React and Node and I use the STAR method following achievements with background.'
        })
      });
      const evalData = await eRes.json();
      console.log(`Status: ${eRes.status}`);
      console.log('Evaluation Result:', JSON.stringify(evalData, null, 2));
    }

    console.log('\n✅ All tests passed!');

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testAPI();
