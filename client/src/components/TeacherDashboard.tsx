import React, { useState, useEffect } from 'react';
import { Assignment, ClassRoom, TeacherResultItem } from '../types';
import { TeacherAuth } from './teacher/TeacherAuth';
import { ResultsTab } from './teacher/ResultsTab';
import { AssignmentTab } from './teacher/AssignmentTab';
import { RostersTab } from './teacher/RostersTab';
import { SettingsTab } from './teacher/SettingsTab';
import { FileEdit, BarChart3, Users, Settings } from 'lucide-react';

interface TeacherDashboardProps {
  classes: ClassRoom[];
  activeAssignment: Assignment | null;
  onUpdateAssignment: (assignment: Partial<Assignment>) => Promise<void>;
  onRefreshData: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classes,
  activeAssignment,
  onUpdateAssignment,
  onRefreshData
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'assignment' | 'results' | 'rosters' | 'settings'>('results');
  const [results, setResults] = useState<TeacherResultItem[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);

  const fetchResults = async () => {
    setIsLoadingResults(true);
    try {
      const res = await fetch(`/api/teacher/results?classId=${selectedClassFilter}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchResults();
    }
  }, [selectedClassFilter, isAuthenticated]);

  const handleResetStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to reset ${studentName}'s attempt? This clears their listens and score.`)) {
      return;
    }
    try {
      await fetch('/api/teacher/reset-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      fetchResults();
    } catch (err) {
      alert("Failed to reset student");
    }
  };

  if (!isAuthenticated) {
    return <TeacherAuth onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 sm:px-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'results' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Class Results</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'assignment' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Assignment & AI Creator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rosters')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'rosters' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Class Rosters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAuthenticated(false)}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
        >
          Lock Dashboard
        </button>
      </div>

      {activeTab === 'results' && (
        <ResultsTab
          classes={classes}
          results={results}
          selectedClassFilter={selectedClassFilter}
          onFilterChange={setSelectedClassFilter}
          isLoading={isLoadingResults}
          onRefresh={fetchResults}
          onResetStudent={handleResetStudent}
        />
      )}

      {activeTab === 'assignment' && (
        <AssignmentTab
          activeAssignment={activeAssignment}
          onUpdateAssignment={onUpdateAssignment}
          onRefreshData={onRefreshData}
        />
      )}

      {activeTab === 'rosters' && (
        <RostersTab
          classes={classes}
          onRefreshData={onRefreshData}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab />
      )}

    </div>
  );
};
