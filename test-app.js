const http = require('http');

async function testAll() {
  const serverProcess = require('./server/index.js');
  
  // Wait 1 second for server to bind
  await new Promise(r => setTimeout(r, 1000));

  function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const opt = {
        hostname: 'localhost',
        port: 3001,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      const req = http.request(opt, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  console.log("=== RUNNING AUTOMATED CHECKS ===");

  // 1. Health check
  const health = await request('/api/health');
  console.log("1. Health Check:", health.status === 200 ? "PASS" : "FAIL", health.body);

  // 2. Classes check
  const classes = await request('/api/classes');
  console.log("2. Classes List:", classes.status === 200 ? "PASS" : "FAIL", `Found ${classes.body.length} classes`);

  // 3. Active Assignment check
  const assign = await request('/api/assignment/active');
  console.log("3. Active Assignment:", assign.status === 200 ? "PASS" : "FAIL", `"${assign.body.title}" with ${assign.body.questions.length} questions`);

  // 4. Test Student Listen Event (Max 2 enforcement)
  const student = classes.body[0].students[0];
  console.log(`4. Testing 2-listen limit enforcement for student: ${student.name}`);
  
  // Listen #1
  const l1 = await request('/api/record-listen', 'POST', {
    studentId: student.id,
    studentName: student.name,
    classId: classes.body[0].id
  });
  console.log("   Listen 1 response:", l1.status === 200 ? "PASS" : "FAIL", `listensUsed: ${l1.body.listensUsed}/2`);

  // Listen #2
  const l2 = await request('/api/record-listen', 'POST', {
    studentId: student.id,
    studentName: student.name,
    classId: classes.body[0].id
  });
  console.log("   Listen 2 response:", l2.status === 200 ? "PASS" : "FAIL", `listensUsed: ${l2.body.listensUsed}/2`);

  // Listen #3 (MUST BE BLOCKED by server with 403)
  const l3 = await request('/api/record-listen', 'POST', {
    studentId: student.id,
    studentName: student.name,
    classId: classes.body[0].id
  });
  console.log("   Listen 3 (should be blocked):", l3.status === 403 ? "PASS (Successfully Blocked)" : "FAIL", l3.body);

  // 5. Test Quiz Submission & Auto-Grading
  const sampleAnswers = {
    "q1": "B", // Correct
    "q2": "B", // Correct
    "q3": "B", // Correct
    "q4": "B", // Correct
    "q5": "B", // Correct
    "q6": "A", // Correct
    "q7": "C", // Correct
    "q8": "A", // Correct
    "q9": "B", // Correct
    "q10": "A" // Incorrect (Correct is C)
  };
  const sub = await request('/api/submit-quiz', 'POST', {
    studentId: student.id,
    studentName: student.name,
    classId: classes.body[0].id,
    answers: sampleAnswers
  });
  console.log("5. Quiz Submission & Auto-Grading:", sub.status === 200 ? "PASS" : "FAIL", `Score: ${sub.body.score}/${sub.body.totalQuestions} (${sub.body.percentage}%)`);

  // 6. Teacher Results Check
  const results = await request('/api/teacher/results?classId=all');
  console.log("6. Teacher Results:", results.status === 200 ? "PASS" : "FAIL", `Total records: ${results.body.length}`);

  // 7. Teacher Reset Student Check
  const reset = await request('/api/teacher/reset-student', 'POST', { studentId: student.id });
  console.log("7. Teacher Reset Student:", reset.status === 200 ? "PASS" : "FAIL", reset.body.message);

  console.log("=== ALL AUTOMATED CHECKS COMPLETED ===");
  process.exit(0);
}

testAll().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
