import React, { useState } from 'react';
import { ClassRoom, Student } from '../types';
import { Users, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

interface StudentSelectProps {
  classes: ClassRoom[];
  onSelect: (selectedClass: ClassRoom, selectedStudent: Student) => void;
}

export const StudentSelect: React.FC<StudentSelectProps> = ({ classes, onSelect }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  const handleStart = () => {
    if (!currentClass || !selectedStudentId) return;
    const student = currentClass.students.find(s => s.id === selectedStudentId);
    if (student) {
      onSelect(currentClass, student);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 sm:my-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-3 ring-1 ring-white/20">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Cambridge Listening Lab</h2>
          <p className="text-blue-200 text-sm mt-1.5 max-w-sm mx-auto">
            Welcome, Stage 6 learners! Select your class and name below to start your listening challenge.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Step 1: Choose Your Class
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.map(cls => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedStudentId('');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-base">{cls.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{cls.students.length} students</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {currentClass && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Step 2: Select Your Name
              </label>

              {currentClass.students.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  No students in this class yet. Ask your teacher to add students.
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-slate-800 font-medium text-base bg-white transition cursor-pointer"
                  >
                    <option value="">-- Choose your name from the list --</option>
                    {currentClass.students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 pl-1">
                    No password required! Simply find your name and click below.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!selectedStudentId}
            onClick={handleStart}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all transform ${
              selectedStudentId
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Enter Listening Station</span>
            <ArrowRight className="w-5 h-5" />
          </button>

        </div>

      </div>
    </div>
  );
};
