import React from 'react';
import { Headphones, GraduationCap, ShieldCheck, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentView: 'student' | 'teacher';
  onSwitchView: (view: 'student' | 'teacher') => void;
  activeStudentName?: string;
  activeClassName?: string;
  onResetStudent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSwitchView,
  activeStudentName,
  activeClassName,
  onResetStudent
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSwitchView('student')}>
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black shadow-inner">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                ListenQuest <span className="text-amber-400 font-medium text-xs px-2 py-0.5 rounded-full bg-blue-800/80 border border-blue-700">Stage 6</span>
              </h1>
            </div>
            <p className="text-xs text-blue-200 font-medium hidden sm:block">Cambridge Primary Listening Comprehension • Hanoi</p>
          </div>
        </div>

        {activeStudentName && currentView === 'student' && (
          <div className="flex items-center bg-blue-800/70 border border-blue-700/80 rounded-full px-3.5 py-1.5 text-xs text-blue-100 shadow-sm">
            <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span className="font-semibold text-white mr-1.5">{activeStudentName}</span>
            <span className="text-blue-300">({activeClassName})</span>
            {onResetStudent && (
              <button
                onClick={onResetStudent}
                className="ml-3 text-xs bg-blue-950/60 hover:bg-blue-900 text-blue-200 hover:text-white px-2 py-0.5 rounded-full transition"
              >
                Change
              </button>
            )}
          </div>
        )}

        <div className="flex items-center bg-blue-950/60 p-1 rounded-xl border border-blue-800">
          <button
            onClick={() => onSwitchView('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              currentView === 'student'
                ? 'bg-amber-400 text-blue-950 shadow-md'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Mode</span>
          </button>
          <button
            onClick={() => onSwitchView('teacher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              currentView === 'teacher'
                ? 'bg-amber-400 text-blue-950 shadow-md'
                : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Teacher Portal</span>
          </button>
        </div>

      </div>
    </header>
  );
};
