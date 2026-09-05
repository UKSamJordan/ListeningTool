const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

app.delete('/api/classes/:classId', (req, res) => {
  const { classId } = req.params;
  const deleted = db.deleteClass(classId);
  if (!deleted) {
    return res.status(404).json({ error: "Class not found" });
  }
  res.json({ success: true, message: "Class deleted successfully" });
});

// Assignment
app.get('/api/assignment/active', (req, res) => {
  const assignment = db.getActiveAssignment();
  res.json(assignment);
});

app.post('/api/assignment', (req, res) => {
  const { title, youtubeUrl, showVideo, maxListens, instructions, questions, createNewId } = req.body;
  if (youtubeUrl === undefined && title === undefined && questions === undefined && instructions === undefined) {
    return res.status(400).json({ error: "Assignment data is required" });
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (youtubeUrl !== undefined) {
    if (!youtubeUrl.trim()) {
      return res.status(400).json({ error: "YouTube URL cannot be empty" });
    }
    updateData.youtubeUrl = youtubeUrl.trim();
  }
  if (showVideo !== undefined) updateData.showVideo = Boolean(showVideo);
  if (maxListens !== undefined) updateData.maxListens = Number(maxListens) || 2;
  if (instructions !== undefined) updateData.instructions = instructions;
  if (questions !== undefined && Array.isArray(questions)) updateData.questions = questions;
  if (createNewId) updateData.createNewId = true;

  const updated = db.saveAssignment(updateData);
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
  const result = await generateQuestionsWithGemini(info, topicOrTranscript);
  res.json({
    videoInfo: info,
    success: result.success,
    hasTranscript: result.hasTranscript,
    message: result.message,
    error: result.error,
    questions: result.questions
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
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Cambridge Listening Server running on http://localhost:${PORT}`);
});
