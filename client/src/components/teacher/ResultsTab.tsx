import React, { useState } from 'react';
import { ClassRoom, TeacherResultItem } from '../../types';
import { Download, RefreshCw } from 'lucide-react';

interface ResultsTabProps {
  classes: ClassRoom[];
  results: TeacherResultItem[];
  selectedClassFilter: string;
  onFilterChange: (clsId: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onResetStudent: (studentId: string, studentName: string) => void;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({
  classes,
  results,
  selectedClassFilter,
  onFilterChange,
  isLoading,
  onRefresh,
  onResetStudent
}) => {
  const [inspectStudent, setInspectStudent] = useState<TeacherResultItem | null>(null);

  const completedCount = results.filter(r => r.status === 'Completed').length;
  const inProgressCount = results.filter(r => r.status === 'In Progress').length;
  const completedWithScores = results.filter(r => r.score !== null);
  const avgScore = completedWithScores.length > 0
    ? (completedWithScores.reduce((acc, c) => acc + (c.score || 0), 0) / completedWithScores.length).toFixed(1)
    : '-';

  const handleExportCsv = () => {
    const headers = ["Student ID", "Student Name", "Class", "Status", "Listens Used", "Score", "Percentage", "Completed At"];
    const rows = results.map(r => [
      r.studentId,
      `"${r.studentName}"`,
      `"${r.className}"`,
      r.status,
      `${r.listensUsed}/${r.maxListens}`,
      r.score !== null ? `${r.score}/${r.totalQuestions}` : "N/A",
      r.percentage !== null ? `${r.percentage}%` : "N/A",
      r.completedAt ? new Date(r.completedAt).toLocaleString() : "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cambridge_stage6_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Students</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{results.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">Completed</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{completedCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">In Progress</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">Avg Score</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{avgScore}/10</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter by Class:</label>
          <select
            value={selectedClassFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer"
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh Results"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Student</th>
                <th className="py-4 px-4">Class</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Listens</th>
                <th className="py-4 px-4">Score</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No students found.</td>
                </tr>
              ) : (
                results.map(r => (
                  <tr key={r.studentId} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">{r.studentName}</td>
                    <td className="py-4 px-4 text-slate-500 text-xs">{r.className}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">
                      <span className={`px-2 py-0.5 rounded-lg ${
                        r.listensUsed >= r.maxListens ? 'bg-rose-100 text-rose-800' : 'bg-slate-100'
                      }`}>
                        {r.listensUsed} / {r.maxListens}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {r.score !== null ? (
                        <div className="font-bold text-blue-600">
                          {r.score} / {r.totalQuestions} <span className="text-xs text-slate-400">({r.percentage}%)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {r.status === 'Completed' && (
                        <button
                          type="button"
                          onClick={() => setInspectStudent(r)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer"
                        >
                          Answers
                        </button>
                      )}
                      {(r.status === 'Completed' || r.listensUsed > 0) && (
                        <button
                          type="button"
                          onClick={() => onResetStudent(r.studentId, r.studentName)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                          title="Reset student attempt"
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inspectStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Answer Sheet: {inspectStudent.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Score: {inspectStudent.score} / {inspectStudent.totalQuestions} ({inspectStudent.percentage}%) • Listens: {inspectStudent.listensUsed}/2
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {inspectStudent.questionResults?.map((qr, idx) => (
                <div
                  key={qr.questionId}
                  className={`p-4 rounded-2xl border ${
                    qr.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>Question {idx + 1}</span>
                    <span className={qr.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {qr.isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mb-2">{qr.question}</div>
                  <div className="text-xs text-slate-600">
                    Student chose: <strong className={qr.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>{qr.studentChoice}</strong>
                    {!qr.isCorrect && (
                      <span className="ml-3 text-slate-600">
                        Correct Answer: <strong className="text-emerald-700">{qr.correctAnswer}</strong>
                      </span>
                    )}
                  </div>
                  {qr.explanation && (
                    <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                      Explanation: {qr.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
