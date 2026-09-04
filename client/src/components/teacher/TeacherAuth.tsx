import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface TeacherAuthProps {
  onSuccess: () => void;
}

export const TeacherAuth: React.FC<TeacherAuthProps> = ({ onSuccess }) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/teacher/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      if (data.authenticated) {
        onSuccess();
      } else {
        setAuthError(data.error || "Incorrect Teacher PIN");
      }
    } catch (err) {
      setAuthError("Failed to authenticate with server");
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Teacher Portal</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Enter your Teacher PIN to manage assignments and view student scores. (Default: 1234)
        </p>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {authError}
          </div>
        )}

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter PIN (1234)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-center font-mono text-xl tracking-widest focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
