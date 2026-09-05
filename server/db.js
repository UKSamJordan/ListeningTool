const fs = require('fs');
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
    id: `${classId}-${idx + 1}`,
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
    id: `${classId}-${idx + 1}`,
    name: sName.trim()
  })).filter(s => s.name.length > 0);

  writeDb(db);
  return targetClass;
}

function deleteClass(classId) {
  const db = readDb();
  const initialLen = (db.classes || []).length;
  db.classes = (db.classes || []).filter(c => c.id !== classId);
  // Also clean up submissions associated with this class
  db.submissions = (db.submissions || []).filter(s => s.classId !== classId);
  writeDb(db);
  return db.classes.length < initialLen;
}

// Assignment
function getActiveAssignment() {
  const db = readDb();
  return db.assignment;
}

function saveAssignment(assignmentData) {
  const db = readDb();
  const current = db.assignment || {};

  // If the YouTube URL changed, or if explicitly requested, or if no ID exists, create a new assignment ID
  const urlChanged = Boolean(
    assignmentData.youtubeUrl &&
    current.youtubeUrl &&
    assignmentData.youtubeUrl.trim() !== current.youtubeUrl.trim()
  );
  const shouldNewId = !current.id || urlChanged || Boolean(assignmentData.createNewId);
  const assignmentId = shouldNewId ? `assign-${Date.now()}` : current.id;

  const merged = {
    ...current,
    ...assignmentData,
    id: assignmentId,
    updatedAt: new Date().toISOString()
  };
  delete merged.createNewId;

  db.assignment = merged;
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
      id: `sub-${studentId}-${Date.now()}`,
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
        message: `You have already reached the maximum of ${maxListens} listens.`,
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
      id: `sub-${studentId}-${Date.now()}`,
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
  deleteClass,
  updateClassStudents,
  getActiveAssignment,
  saveAssignment,
  getStudentSubmission,
  recordListen,
  submitQuiz,
  getTeacherResults,
  resetStudentSubmission
};
