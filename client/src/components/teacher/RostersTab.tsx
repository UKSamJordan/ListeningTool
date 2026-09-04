import React, { useState } from 'react';
import { ClassRoom } from '../../types';
import { Trash2 } from 'lucide-react';

interface RostersTabProps {
  classes: ClassRoom[];
  onRefreshData: () => void;
}

export const RostersTab: React.FC<RostersTabProps> = ({ classes, onRefreshData }) => {
  const [rosterClassId, setRosterClassId] = useState<string>(classes[0]?.id || '');
  const [bulkNamesText, setBulkNamesText] = useState<string>('');
  const [newClassName, setNewClassName] = useState<string>('');

  const handleSaveRoster = async () => {
    const names = bulkNamesText.split('\n').map(s => s.trim()).filter(Boolean);
    if (names.length === 0) {
      alert("Please paste at least one student name.");
      return;
    }
    try {
      await fetch(`/api/classes/${rosterClassId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNames: names })
      });
      alert("Roster updated successfully!");
      setBulkNamesText('');
      onRefreshData();
    } catch (e) {
      alert("Failed to update roster.");
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim(), studentNames: [] })
      });
      alert(`Class "${newClassName}" created!`);
      setNewClassName('');
      onRefreshData();
    } catch (e) {
      alert("Failed to create class.");
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? This will remove the class and its student list.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert(`Class "${className}" was deleted.`);
        onRefreshData();
      } else {
        alert("Failed to delete class.");
      }
    } catch (e) {
      alert("Failed to delete class.");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Class Rosters Management</h2>
        <p className="text-xs text-slate-500 mt-1">
          Add or remove classes and manage student rosters easily.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Bulk Paste Students</h3>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Target Class</label>
            <select
              value={rosterClassId}
              onChange={(e) => setRosterClassId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.students.length} students)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Student Names (One per line)
            </label>
            <textarea
              rows={8}
              value={bulkNamesText}
              onChange={(e) => setBulkNamesText(e.target.value)}
              placeholder="An Nguyen&#10;Bao Tran&#10;Chi Le&#10;Duc Pham"
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:border-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveRoster}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition cursor-pointer"
          >
            Update Class Roster
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Current Enrolled Classes</h3>
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{cls.name}</div>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title={`Delete ${cls.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {cls.students.length} students enrolled
                </div>
                <div className="mt-2 text-xs text-slate-600 max-h-24 overflow-y-auto font-mono bg-white p-2 rounded-lg border border-slate-100">
                  {cls.students.map(s => s.name).join(", ") || "No students"}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Create New Class</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Class 6C"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateClass}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
