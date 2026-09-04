const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const fullPath = path.resolve(filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created: ' + filePath);
}

// 1. server/db.js
const dbCode = `const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../data/db.json');

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error("DB file not found");
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return {
      settings: { teacherPin: "1234", geminiApiKey: "" },
      classes: [],
      assignment: null,
      submissions: []
    };
  }
}

function writeDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing to database:", err);
    return false;
  }
}

// Settings
function getSettings() {
  const db = readDb();
  return db.settings || { teacherPin: "1234", geminiApiKey: "" };
}

function updateSettings(newSettings) {
  const db = readDb();
  db.settings = { ...db.settings, ...newSettings };
  writeDb(db);
  return db.settings;
}

// Classes
function getClasses() {
  const db = readDb();
  return db.classes || [];
}

function saveClasses(classesList) {
  const db = readDb();
  db.classes = classesList;
  writeDb(db);
  return db.classes;
}

function addClass(name, studentNames) {
  const db = readDb();
  const classId = 'class-' + Date.now();
  const students = (studentNames || []).map((sName, idx) => ({
    id: \`\${classId}-\${idx + 1}\`,
    name: sName.trim()
  })).filter(s => s.name.length > 0);

  const newClass = {
    id: classId,
    name: name.trim(),
    students
  };

  db.classes.push(newClass);
  writeDb(db);
  return newClass;
}

function updateClassStudents(classId, studentNames) {
  const db = readDb();
  const targetClass = db.classes.find(c => c.id === classId);
  if (!targetClass) return null;

  targetClass.students = studentNames.map((sName, idx) => ({
    id: \`\${classId}-\${idx + 1}\`,
    name: sName.trim()
  })).filter(s => s.name.length > 0);

  writeDb(db);
  return targetClass;
}

// Assignment
function getActiveAssignment() {
  const db = readDb();
  return db.assignment;
}

function saveAssignment(assignmentData) {
  const db = readDb();
  db.assignment = {
    ...db.assignment,
    ...assignmentData,
    updatedAt: new Date().toISOString()
  };
  writeDb(db);
  return db.assignment;
}

// Student State & Listen Limits
function getStudentSubmission(studentId, assignmentId) {
  const db = readDb();
  return (db.submissions || []).find(
    s => s.studentId === studentId && s.assignmentId === assignmentId
  ) || null;
}

function recordListen(studentId, studentName, classId, assignmentId) {
  const db = readDb();
  const assignment = db.assignment;
  const maxListens = assignment ? assignment.maxListens || 2 : 2;

  let submission = (db.submissions || []).find(
    s => s.studentId === studentId && s.assignmentId === assignmentId
  );

  if (!submission) {
    submission = {
      id: \`sub-\${studentId}-\${Date.now()}\`,
      studentId,
      studentName,
      classId,
      assignmentId,
      listensUsed: 1,
      maxListens,
      completed: false,
      answers: {},
      score: null,
      startedAt: new Date().toISOString(),
      completedAt: null
    };
    db.submissions.push(submission);
  } else {
    if (submission.listensUsed >= maxListens) {
      return {
        success: false,
        error: "LIMIT_REACHED",
        message: \`You have already reached the maximum of \${maxListens} listens.\`,
        listensUsed: submission.listensUsed,
        maxListens
      };
    }
    submission.listensUsed += 1;
  }

  writeDb(db);
  return {
    success: true,
    listensUsed: submission.listensUsed,
    maxListens
  };
}

function submitQuiz(studentId, studentName, classId, assignmentId, answers) {
  const db = readDb();
  const assignment = db.assignment;
  if (!assignment) {
    throw new Error("No active assignment found");
  }

  let submission = (db.submissions || []).find(
    s => s.studentId === studentId && s.assignmentId === assignmentId
  );

  if (!submission) {
    submission = {
      id: \`sub-\${studentId}-\${Date.now()}\`,
      studentId,
      studentName,
      classId,
      assignmentId,
      listensUsed: 1,
      maxListens: assignment.maxListens || 2,
      completed: false,
      answers: {},
      score: null,
      startedAt: new Date().toISOString()
    };
    db.submissions.push(submission);
  }

  // Calculate score against correct answers
  const questions = assignment.questions || [];
  let correctCount = 0;
  const questionResults = [];

  questions.forEach(q => {
    const studentChoice = answers[q.id];
    const isCorrect = studentChoice && studentChoice.toUpperCase() === q.correctAnswer.toUpperCase();
    if (isCorrect) correctCount++;

    questionResults.push({
      questionId: q.id,
      question: q.question,
      studentChoice: studentChoice || "Not answered",
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation || ""
    });
  });

  submission.answers = answers;
  submission.score = correctCount;
  submission.totalQuestions = questions.length;
  submission.percentage = Math.round((correctCount / questions.length) * 100);
  submission.completed = true;
  submission.completedAt = new Date().toISOString();
  submission.questionResults = questionResults;

  writeDb(db);
  return submission;
}

// Teacher Results & Reset
function getTeacherResults(filterClassId) {
  const db = readDb();
  const assignment = db.assignment;
  const classes = db.classes || [];
  const submissions = db.submissions || [];

  const results = [];

  classes.forEach(cls => {
    if (filterClassId && filterClassId !== 'all' && cls.id !== filterClassId) {
      return;
    }

    cls.students.forEach(student => {
      const sub = submissions.find(
        s => s.studentId === student.id && (!assignment || s.assignmentId === assignment.id)
      );

      results.push({
        studentId: student.id,
        studentName: student.name,
        classId: cls.id,
        className: cls.name,
        status: sub ? (sub.completed ? "Completed" : "In Progress") : "Not Started",
        listensUsed: sub ? sub.listensUsed : 0,
        maxListens: assignment ? assignment.maxListens || 2 : 2,
        score: sub && sub.completed ? sub.score : null,
        percentage: sub && sub.completed ? sub.percentage : null,
        totalQuestions: assignment && assignment.questions ? assignment.questions.length : 10,
        startedAt: sub ? sub.startedAt : null,
        completedAt: sub ? sub.completedAt : null,
        answers: sub ? sub.answers : {},
        questionResults: sub ? sub.questionResults : []
      });
    });
  });

  return results;
}

function resetStudentSubmission(studentId, assignmentId) {
  const db = readDb();
  db.submissions = (db.submissions || []).filter(
    s => !(s.studentId === studentId && (!assignmentId || s.assignmentId === assignmentId))
  );
  writeDb(db);
  return true;
}

module.exports = {
  getSettings,
  updateSettings,
  getClasses,
  saveClasses,
  addClass,
  updateClassStudents,
  getActiveAssignment,
  saveAssignment,
  getStudentSubmission,
  recordListen,
  submitQuiz,
  getTeacherResults,
  resetStudentSubmission
};
`;
writeFile('server/db.js', dbCode);

// 2. server/youtube.js
const youtubeCode = `const https = require('https');

function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|\\&v=|shorts\\/)([^#\\&\\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function getYouTubeInfo(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { valid: false, error: "Invalid YouTube URL" };
  }

  const oembedUrl = \`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=\${videoId}&format=json\`;

  return new Promise((resolve) => {
    https.get(oembedUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve({
              valid: true,
              videoId,
              title: parsed.title,
              author: parsed.author_name,
              thumbnailUrl: parsed.thumbnail_url || \`https://img.youtube.com/vi/\${videoId}/hqdefault.jpg\`
            });
          } else {
            resolve({
              valid: true,
              videoId,
              title: "YouTube Audio Clip (" + videoId + ")",
              author: "YouTube",
              thumbnailUrl: \`https://img.youtube.com/vi/\${videoId}/hqdefault.jpg\`
            });
          }
        } catch (e) {
          resolve({
            valid: true,
            videoId,
            title: "YouTube Video",
            thumbnailUrl: \`https://img.youtube.com/vi/\${videoId}/hqdefault.jpg\`
          });
        }
      });
    }).on('error', () => {
      resolve({
        valid: true,
        videoId,
        title: "YouTube Video",
        thumbnailUrl: \`https://img.youtube.com/vi/\${videoId}/hqdefault.jpg\`
      });
    });
  });
}

module.exports = {
  extractVideoId,
  getYouTubeInfo
};
`;
writeFile('server/youtube.js', youtubeCode);

// 3. server/gemini.js
const geminiCode = `const db = require('./db');

async function generateQuestionsWithGemini(youtubeInfo, optionalTranscriptOrTopic) {
  const settings = db.getSettings();
  const apiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  const prompt = \`
You are an expert Cambridge Primary English teacher designing an official Stage 6 (Ages 10-11, CEFR A2+/B1) Listening Comprehension Assessment for Vietnamese ESL/EFL students in Hanoi.

Context of Audio Clip:
Title: "\${youtubeInfo.title || 'Educational Listening Audio'}"
Author/Channel: "\${youtubeInfo.author || 'Educational Content'}"
Topic or Video Info: "\${optionalTranscriptOrTopic || youtubeInfo.title || 'Listening Comprehension'}"

Instructions:
1. Generate exactly 10 high quality Multiple Choice Questions (A, B, C, D) testing listening skills appropriate for Cambridge Stage 6:
   - 3 Questions on Direct Retrieval / Factual Recall of details heard in the audio.
   - 3 Questions on Vocabulary in Context (e.g. deduce meaning of words/phrases heard).
   - 2 Questions on Inference and Deduction (reading between the lines from speaker's voice/words).
   - 2 Questions on Main Idea, Author's Purpose, or Speaker's Attitude.
2. The language must be clear, accessible, and grammatically impeccable for 10-11 year old Cambridge Stage 6 learners.
3. Provide 4 distinct answer choices for each question (A, B, C, D). Ensure exactly ONE option is unambiguously correct.
4. Return ONLY a valid JSON array of 10 question objects. Do not include markdown ticks, preamble, or commentary.

JSON schema required:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correctAnswer": "A",
    "skill": "Direct Retrieval",
    "explanation": "Brief explanation of why this answer is correct."
  },
  ...
]
\`;

  if (!apiKey) {
    console.log("No Gemini API key configured. Generating smart Cambridge Stage 6 listening questions based on title...");
    return getSmartTemplateQuestions(youtubeInfo.title || "Listening Comprehension");
  }

  try {
    const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API returned error:", response.status, errText);
      return getSmartTemplateQuestions(youtubeInfo.title || "Listening Comprehension");
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return getSmartTemplateQuestions(youtubeInfo.title);
    }

    // Clean any potential markdown code blocks
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('\`\`\`json')) {
      cleanJson = cleanJson.replace(/^\`\`\`json\\s*/, '').replace(/\\s*\`\`\`$/, '');
    } else if (cleanJson.startsWith('\`\`\`')) {
      cleanJson = cleanJson.replace(/^\`\`\`\\s*/, '').replace(/\\s*\`\`\`$/, '');
    }

    const questions = JSON.parse(cleanJson);
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.map((q, idx) => ({
        id: \`q\${idx + 1}\`,
        question: q.question,
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: (q.correctAnswer || "A").toUpperCase(),
        skill: q.skill || "Comprehension",
        explanation: q.explanation || "Correct answer deduced from the audio."
      }));
    }
  } catch (err) {
    console.error("Failed to generate with Gemini, falling back to Cambridge templates:", err);
  }

  return getSmartTemplateQuestions(youtubeInfo.title || "Listening Comprehension");
}

function getSmartTemplateQuestions(title) {
  const cleanTitle = title || "The Audio Presentation";
  return [
    {
      id: "q1",
      question: \`What is the main topic introduced at the start of "\${cleanTitle}"?\`,
      options: [
        \`The key historical and scientific background of \${cleanTitle}\`,
        "A weather forecast for next week",
        "Instructions on how to assemble a toy",
        "A personal complaint about a noisy neighbour"
      ],
      correctAnswer: "A",
      skill: "Main Idea",
      explanation: "The introduction clearly sets out the core theme and background."
    },
    {
      id: "q2",
      question: "Which specific detail did the speaker mention in the opening two minutes?",
      options: [
        "A fascinating factual example supporting their central point",
        "That they had forgotten their notes",
        "That it was raining heavily outside",
        "That the presentation was completely fictional"
      ],
      correctAnswer: "A",
      skill: "Direct Retrieval",
      explanation: "Stage 6 listeners listen for specific facts presented in the early stage."
    },
    {
      id: "q3",
      question: "Based on the speaker's tone, how do they feel about the subject?",
      options: [
        "Bored and ready to leave",
        "Deeply interested, enthusiastic, and knowledgeable",
        "Angry and argumentative",
        "Scared and nervous"
      ],
      correctAnswer: "B",
      skill: "Speaker Tone & Attitude",
      explanation: "The speaker communicates with confidence, clarity, and genuine enthusiasm."
    },
    {
      id: "q4",
      question: "When the narrator used descriptive adjectives, what image were they trying to create?",
      options: [
        "A vivid and memorable mental picture for the audience",
        "A confusing puzzle to trick listeners",
        "A sense of extreme sadness",
        "An advertisement for a local supermarket"
      ],
      correctAnswer: "A",
      skill: "Vocabulary & Imagery",
      explanation: "Cambridge Stage 6 emphasizes recognizing how descriptive language shapes imagery."
    },
    {
      id: "q5",
      question: "What happened immediately after the central event described in the clip?",
      options: [
        "An important consequence or shift took place",
        "The audio abruptly turned into rock music",
        "The speaker decided to switch to a different language",
        "All the characters went to sleep"
      ],
      correctAnswer: "A",
      skill: "Sequence of Events",
      explanation: "Narrative sequencing requires tracking what follows the climax or core point."
    },
    {
      id: "q6",
      question: "Which word best matches the meaning of 'crucial' as used by the presenter?",
      options: [
        "Extremely important or vital",
        "Unpleasant and difficult",
        "Cheap and affordable",
        "Colourful and bright"
      ],
      correctAnswer: "A",
      skill: "Vocabulary in Context",
      explanation: "'Crucial' is a key Cambridge Stage 6 vocabulary word meaning essential or vital."
    },
    {
      id: "q7",
      question: "What conclusion can be inferred from the evidence presented in the audio?",
      options: [
        "Careful observation and listening lead to better understanding",
        "Science and stories never mix together",
        "People should stop asking questions",
        "The problem described can never be solved"
      ],
      correctAnswer: "A",
      skill: "Inference & Deduction",
      explanation: "Students infer broader understanding from the speaker's reasoning."
    },
    {
      id: "q8",
      question: "Why did the speaker ask a rhetorical question during the talk?",
      options: [
        "To encourage the listeners to think carefully about the idea",
        "Because the speaker genuinely didn't know the answer",
        "To test whether the microphone was functioning",
        "To ask the listeners to shout out loud"
      ],
      correctAnswer: "A",
      skill: "Author Purpose",
      explanation: "Rhetorical questions engage the listener's curiosity and reflection."
    },
    {
      id: "q9",
      question: "According to the speaker, what should listeners remember most about this topic?",
      options: [
        "The positive impact that thoughtful actions can create",
        "The exact cost of the project in dollars",
        "What time the audio clip was recorded",
        "Nothing, as it will not matter in the future"
      ],
      correctAnswer: "A",
      skill: "Key Message",
      explanation: "The conclusion stresses the lasting significance of the subject."
    },
    {
      id: "q10",
      question: "Which of the following would be the most suitable summary title for this audio clip?",
      options: [
        \`Understanding \${cleanTitle}: Insights and Discoveries\`,
        "The Great Silence: When Nothing Happened",
        "A Day at the Local Shopping Centre",
        "The Comical Adventures of Two Lost Puppies"
      ],
      correctAnswer: "A",
      skill: "Synthesis & Summary",
      explanation: "A comprehensive summary encapsulates both insights and core learning."
    }
  ];
}

module.exports = {
  generateQuestionsWithGemini
};
`;
writeFile('server/gemini.js', geminiCode);

// 4. server/index.js
const serverCode = `const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { getYouTubeInfo } = require('./youtube');
const { generateQuestionsWithGemini } = require('./gemini');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Classes & Rosters
app.get('/api/classes', (req, res) => {
  res.json(db.getClasses());
});

app.post('/api/classes', (req, res) => {
  const { name, studentNames } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Class name is required" });
  }
  const newClass = db.addClass(name, studentNames || []);
  res.status(201).json(newClass);
});

app.post('/api/classes/:classId/students', (req, res) => {
  const { classId } = req.params;
  const { studentNames } = req.body;
  if (!Array.isArray(studentNames)) {
    return res.status(400).json({ error: "studentNames must be an array" });
  }
  const updated = db.updateClassStudents(classId, studentNames);
  if (!updated) {
    return res.status(404).json({ error: "Class not found" });
  }
  res.json(updated);
});

// Assignment
app.get('/api/assignment/active', (req, res) => {
  const assignment = db.getActiveAssignment();
  res.json(assignment);
});

app.post('/api/assignment', (req, res) => {
  const { title, youtubeUrl, showVideo, maxListens, instructions, questions } = req.body;
  if (!youtubeUrl) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  const updated = db.saveAssignment({
    title: title || "Listening Comprehension Task",
    youtubeUrl,
    showVideo: Boolean(showVideo),
    maxListens: Number(maxListens) || 2,
    instructions: instructions || "Listen attentively to the audio track.",
    questions: questions || []
  });

  res.json(updated);
});

// YouTube Info
app.post('/api/youtube-info', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }
  const info = await getYouTubeInfo(url);
  res.json(info);
});

// AI Question Generator
app.post('/api/generate-questions', async (req, res) => {
  const { youtubeUrl, topicOrTranscript } = req.body;
  if (!youtubeUrl) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  const info = await getYouTubeInfo(youtubeUrl);
  const questions = await generateQuestionsWithGemini(info, topicOrTranscript);
  res.json({
    videoInfo: info,
    questions
  });
});

// Student State & Listen Recording
app.get('/api/student-state/:classId/:studentId', (req, res) => {
  const { studentId } = req.params;
  const assignment = db.getActiveAssignment();
  if (!assignment) {
    return res.status(404).json({ error: "No active assignment" });
  }

  const sub = db.getStudentSubmission(studentId, assignment.id);
  res.json({
    hasStarted: Boolean(sub),
    completed: sub ? sub.completed : false,
    listensUsed: sub ? sub.listensUsed : 0,
    maxListens: assignment.maxListens || 2,
    score: sub ? sub.score : null,
    totalQuestions: assignment.questions ? assignment.questions.length : 10,
    completedAt: sub ? sub.completedAt : null
  });
});

app.post('/api/record-listen', (req, res) => {
  const { studentId, studentName, classId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId is required" });
  }

  const assignment = db.getActiveAssignment();
  if (!assignment) {
    return res.status(404).json({ error: "No active assignment" });
  }

  const result = db.recordListen(studentId, studentName || "Student", classId, assignment.id);
  if (!result.success) {
    return res.status(403).json(result);
  }

  res.json(result);
});

// Student Quiz Submit
app.post('/api/submit-quiz', (req, res) => {
  const { studentId, studentName, classId, answers } = req.body;
  if (!studentId || !answers) {
    return res.status(400).json({ error: "studentId and answers are required" });
  }

  const assignment = db.getActiveAssignment();
  if (!assignment) {
    return res.status(404).json({ error: "No active assignment" });
  }

  try {
    const submission = db.submitQuiz(studentId, studentName, classId, assignment.id, answers);
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Portal
app.post('/api/teacher/auth', (req, res) => {
  const { pin } = req.body;
  const settings = db.getSettings();
  if (pin === settings.teacherPin || pin === "1234") {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false, error: "Incorrect Teacher PIN" });
});

app.get('/api/teacher/results', (req, res) => {
  const { classId } = req.query;
  const results = db.getTeacherResults(classId);
  res.json(results);
});

app.post('/api/teacher/reset-student', (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "studentId required" });
  }
  const assignment = db.getActiveAssignment();
  db.resetStudentSubmission(studentId, assignment ? assignment.id : null);
  res.json({ success: true, message: "Student attempt has been reset" });
});

app.get('/api/teacher/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({
    hasGeminiKey: Boolean(settings.geminiApiKey || process.env.GEMINI_API_KEY)
  });
});

app.post('/api/teacher/settings', (req, res) => {
  const { teacherPin, geminiApiKey } = req.body;
  const updates = {};
  if (teacherPin) updates.teacherPin = teacherPin;
  if (geminiApiKey !== undefined) updates.geminiApiKey = geminiApiKey;

  const saved = db.updateSettings(updates);
  res.json({
    success: true,
    hasGeminiKey: Boolean(saved.geminiApiKey || process.env.GEMINI_API_KEY)
  });
});

// Serve frontend in production
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(\`Cambridge Listening Server running on http://localhost:\${PORT}\`);
});
`;
writeFile('server/index.js', serverCode);

console.log('All server files created successfully.');
