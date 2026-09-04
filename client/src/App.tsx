import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentSelect } from './components/StudentSelect';
import { AudioPlayerShield } from './components/AudioPlayerShield';
import { QuizStation } from './components/QuizStation';
import { CelebrationModal } from './components/CelebrationModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { Assignment, ClassRoom, Student, StudentState } from './types';

export function App() {
  const [view, setView] = useState<'student' | 'teacher'>('student');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentState, setStudentState] = useState<StudentState | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lastSubmissionScore, setLastSubmissionScore] = useState<number>(0);

  const fetchInitialData = async () => {
    try {
      const [classesRes, assignRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/assignment/active')
      ]);
      const classesData = await classesRes.json();
      const assignData = await assignRes.json();
      setClasses(classesData);
      setActiveAssignment(assignData);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedStudent) {
      fetchStudentState(selectedClass.id, selectedStudent.id);
    }
  }, [selectedClass, selectedStudent]);

  const fetchStudentState = async (classId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/student-state/${classId}/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentState(data);
        if (data.completed && data.score !== null) {
          setLastSubmissionScore(data.score);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStudentSelect = (cls: ClassRoom, stu: Student) => {
    setSelectedClass(cls);
    setSelectedStudent(stu);
  };

  const handleResetActiveStudent = () => {
    setSelectedClass(null);
    setSelectedStudent(null);
    setStudentState(null);
    setShowCelebration(false);
  };

  const handleListenStart = async (): Promise<boolean> => {
    if (!selectedStudent || !selectedClass) return false;
    try {
      const res = await fetch('/api/record-listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          classId: selectedClass.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStudentState(prev => prev ? { ...prev, listensUsed: data.listensUsed } : null);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  const handleSubmitQuiz = async (answers: Record<string, string>) => {
    if (!selectedStudent || !selectedClass) return;
    setIsSubmittingQuiz(true);
    try {
      const res = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          classId: selectedClass.id,
          answers
        })
      });
      const data = await res.json();
      setLastSubmissionScore(data.score);
      setShowCelebration(true);
      fetchStudentState(selectedClass.id, selectedStudent.id);
    } catch (e) {
      alert("Failed to submit assessment. Please check your internet connection.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleUpdateAssignment = async (updated: Partial<Assignment>) => {
    const res = await fetch('/api/assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await res.json();
    setActiveAssignment(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      <Navbar
        currentView={view}
        onSwitchView={setView}
        activeStudentName={selectedStudent?.name}
        activeClassName={selectedClass?.name}
        onResetStudent={handleResetActiveStudent}
      />

      <main className="flex-1">
        {view === 'teacher' ? (
          <TeacherDashboard
            classes={classes}
            activeAssignment={activeAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onRefreshData={fetchInitialData}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {!selectedStudent ? (
              <StudentSelect
                classes={classes}
                onSelect={handleStudentSelect}
              />
            ) : studentState?.completed ? (
              <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-black text-2xl">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-slate-900">Assessment Already Completed!</h2>
                <p className="text-slate-600 text-sm mt-2">
                  Welcome back, <strong>{selectedStudent.name}</strong>! You have already finished this listening challenge.
                </p>
                <div className="my-6 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="text-xs text-blue-600 font-bold uppercase">Your Final Score</div>
                  <div className="text-3xl font-black text-blue-900 mt-1">
                    {studentState.score} / {studentState.totalQuestions}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetActiveStudent}
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow hover:bg-slate-800 transition cursor-pointer"
                >
                  Return to Student Selection
                </button>
              </div>
            ) : (
              activeAssignment && (
                <div>
                  <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                        {activeAssignment.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {activeAssignment.instructions}
                      </p>
                    </div>
                  </div>

                  <AudioPlayerShield
                    youtubeUrl={activeAssignment.youtubeUrl}
                    showVideo={activeAssignment.showVideo}
                    maxListens={activeAssignment.maxListens || 2}
                    listensUsed={studentState?.listensUsed || 0}
                    onListenStart={handleListenStart}
                  />

                  <QuizStation
                    questions={activeAssignment.questions || []}
                    onSubmit={handleSubmitQuiz}
                    isSubmitting={isSubmittingQuiz}
                  />
                </div>
              )
            )}
          </div>
        )}
      </main>

      {showCelebration && selectedStudent && (
        <CelebrationModal
          studentName={selectedStudent.name}
          score={lastSubmissionScore}
          totalQuestions={activeAssignment?.questions?.length || 10}
          onDone={() => {
            setShowCelebration(false);
            handleResetActiveStudent();
          }}
        />
      )}

      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400">
        Cambridge Primary English (Stage 6) • Hanoi Listening Lab
      </footer>

    </div>
  );
}

export default App;
