import React, { useState, useEffect } from 'react';

export const SettingsTab: React.FC = () => {
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [teacherPin, setTeacherPin] = useState<string>('');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/teacher/settings')
      .then(res => res.json())
      .then(data => setHasGeminiKey(data.hasGeminiKey))
      .catch(console.error);
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/teacher/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiApiKey || undefined,
          teacherPin: teacherPin || undefined
        })
      });
      const data = await res.json();
      setHasGeminiKey(data.hasGeminiKey);
      alert("Settings updated successfully!");
      setGeminiApiKey('');
      setTeacherPin('');
    } catch (e) {
      alert("Failed to update settings.");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Teacher Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure your AI API key and Teacher security PIN.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder={hasGeminiKey ? "Key active (Enter new key to update)" : "AIzaSy..."}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:border-blue-600"
          />
          <p className="text-xs text-slate-400 mt-1">
            {hasGeminiKey ? "✓ A Gemini API key is currently active." : "Optional: Add your Gemini API key from Google AI Studio to unlock AI question generation."}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Change Teacher PIN
          </label>
          <input
            type="password"
            value={teacherPin}
            onChange={(e) => setTeacherPin(e.target.value)}
            placeholder="New 4-digit PIN"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:border-blue-600"
          />
          <p className="text-xs text-slate-400 mt-1">Enter a new PIN to change your dashboard access code.</p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};
