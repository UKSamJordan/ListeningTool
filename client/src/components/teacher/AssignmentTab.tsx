import React, { useState, useEffect } from 'react';
import { Assignment } from '../../types';
import { Sparkles, Check, Save, AlertCircle } from 'lucide-react';

interface AssignmentTabProps {
  activeAssignment: Assignment | null;
  onUpdateAssignment: (assignment: Partial<Assignment>) => Promise<void>;
  onRefreshData: () => void;
}

export const AssignmentTab: React.FC<AssignmentTabProps> = ({
  activeAssignment,
  onUpdateAssignment,
  onRefreshData
}) => {
  const [title, setTitle] = useState<string>(activeAssignment?.title || '');
  const [youtubeUrl, setYoutubeUrl] = useState<string>(activeAssignment?.youtubeUrl || '');
  const [showVideo, setShowVideo] = useState<boolean>(activeAssignment?.showVideo || false);
  const [maxListens, setMaxListens] = useState<number>(activeAssignment?.maxListens || 2);
  const [instructions, setInstructions] = useState<string>(activeAssignment?.instructions || '');
  const [questions, setQuestions] = useState<any[]>(activeAssignment?.questions || []);
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');

  useEffect(() => {
    if (activeAssignment) {
      setTitle(activeAssignment.title);
      setYoutubeUrl(activeAssignment.youtubeUrl);
      setShowVideo(activeAssignment.showVideo);
      setMaxListens(activeAssignment.maxListens || 2);
      setInstructions(activeAssignment.instructions);
      setQuestions(activeAssignment.questions || []);
    }
  }, [activeAssignment]);

  const isDirty = Boolean(
    activeAssignment && (
      title !== (activeAssignment.title || '') ||
      youtubeUrl.trim() !== (activeAssignment.youtubeUrl || '').trim() ||
      showVideo !== (activeAssignment.showVideo || false) ||
      maxListens !== (activeAssignment.maxListens || 2) ||
      instructions !== (activeAssignment.instructions || '') ||
      JSON.stringify(questions) !== JSON.stringify(activeAssignment.questions || [])
    )
  );

  const handleGenerateQuestions = async () => {
    if (!youtubeUrl) {
      alert("Please enter a valid YouTube URL first.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl,
          topicOrTranscript: topicPrompt
        })
      });
      const data = await res.json();
      if (!data.success && data.message) {
        alert(data.message);
      }
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        if (data.videoInfo?.title && !title) {
          setTitle(data.videoInfo.title);
        }
        if (data.videoInfo?.transcript && !topicPrompt) {
          setTopicPrompt(data.videoInfo.transcript);
        }
        if (data.success) {
          alert(data.hasTranscript 
            ? `Success! 10 Cambridge Stage 6 questions were generated based directly on the actual audio transcript! Remember to click 'Save & Publish' above to activate this for students.` 
            : `Generated 10 Cambridge Stage 6 questions! Remember to click 'Save & Publish' above to activate this for students.`
          );
        }
      }
    } catch (err) {
      alert("Error generating questions. Please verify your Gemini API key in Settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAssignment = async () => {
    setSaveSuccess('');
    setIsSaving(true);
    try {
      await onUpdateAssignment({
        title,
        youtubeUrl: youtubeUrl.trim(),
        showVideo,
        maxListens: Number(maxListens) || 2,
        instructions,
        questions
      });
      setSaveSuccess("Assignment published successfully! Students can now see the updated task.");
      setTimeout(() => setSaveSuccess(''), 4000);
      onRefreshData();
    } catch (err) {
      alert("Failed to save assignment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSaveVideo = async () => {
    if (!youtubeUrl.trim()) return;
    setSaveSuccess('');
    setIsSaving(true);
    try {
      await onUpdateAssignment({
        youtubeUrl: youtubeUrl.trim(),
        title: title.trim() || undefined
      });
      setSaveSuccess("New video saved and published! Students will now hear this track.");
      setTimeout(() => setSaveSuccess(''), 4000);
      onRefreshData();
    } catch (err) {
      alert("Failed to save video.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900">Assignment Configuration</h2>
            {isDirty && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure the YouTube audio clip, toggle video visibility, and generate Cambridge Stage 6 questions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAssignment}
          disabled={isSaving}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
            isDirty
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 ring-2 ring-blue-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save & Publish"}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assignment Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cambridge Stage 6: Ocean Discoveries"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-600 uppercase">YouTube Link</label>
            {activeAssignment?.youtubeUrl && (
              <span className="text-xs text-slate-400">
                Active: <span className="font-mono text-blue-600 truncate max-w-[200px] inline-block align-bottom">{activeAssignment.youtubeUrl}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={handleQuickSaveVideo}
              disabled={isSaving || !youtubeUrl.trim() || youtubeUrl.trim() === (activeAssignment?.youtubeUrl || '').trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                youtubeUrl.trim() && youtubeUrl.trim() !== (activeAssignment?.youtubeUrl || '').trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title="Save and publish this YouTube link immediately"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Video</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Paste any YouTube link here. Click "Save Video" to immediately activate this clip for all students.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Display Video Player</div>
              <div className="text-xs text-slate-500">
                {showVideo ? "Video is visible to students" : "Audio-only shield covers video (Recommended)"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVideo(!showVideo)}
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                showVideo ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                showVideo ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Maximum Allowed Listens</div>
              <div className="text-xs text-slate-500">Locked once limit is reached</div>
            </div>
            <select
              value={maxListens}
              onChange={(e) => setMaxListens(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-sm bg-white cursor-pointer"
            >
              <option value={1}>1 Listen</option>
              <option value={2}>2 Listens (Standard)</option>
              <option value={3}>3 Listens</option>
              <option value={5}>5 Listens</option>
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-blue-100 space-y-4">
          <div className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base">Gemini AI Question Generator</h3>
          </div>
          <p className="text-xs text-indigo-700">
            Generate 10 Cambridge Stage 6 listening comprehension questions (retrieval, vocabulary, inference, main idea) aligned with Cambridge Primary English standards.
          </p>

          <div>
            <label className="block text-xs font-bold text-indigo-950 uppercase mb-1">
              Spoken Audio Transcript / Dialogue Notes
            </label>
            <textarea
              rows={3}
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="The spoken dialogue of the audio track. (Automatically extracted from YouTube captions if available, or you can paste your listening script / story text here!)"
              className="w-full p-3 rounded-xl border border-blue-200 text-xs bg-white focus:border-blue-600 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={isGenerating}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Analyzing audio and writing questions..." : "Generate 10 Cambridge Questions"}</span>
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Comprehension Questions ({questions.length})</h3>
            <span className="text-xs text-slate-400">Edit questions, choices, and correct answers</span>
          </div>

          {questions.map((q, qIdx) => (
            <div key={q.id || qIdx} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Question {qIdx + 1}
                </span>
                <input
                  type="text"
                  value={q.skill || ""}
                  onChange={(e) => {
                    const newQ = [...questions];
                    newQ[qIdx].skill = e.target.value;
                    setQuestions(newQ);
                  }}
                  placeholder="Skill Focus"
                  className="text-xs font-semibold px-2 py-0.5 rounded border border-slate-200 text-slate-600 w-40"
                />
              </div>

              <input
                type="text"
                value={q.question}
                onChange={(e) => {
                  const newQ = [...questions];
                  newQ[qIdx].question = e.target.value;
                  setQuestions(newQ);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                  <div key={letter} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctAnswer === letter}
                      onChange={() => {
                        const newQ = [...questions];
                        newQ[qIdx].correctAnswer = letter;
                        setQuestions(newQ);
                      }}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <span className="text-xs font-bold text-slate-500">{letter}:</span>
                    <input
                      type="text"
                      value={q.options[optIdx] || ""}
                      onChange={(e) => {
                        const newQ = [...questions];
                        newQ[qIdx].options[optIdx] = e.target.value;
                        setQuestions(newQ);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        <div className="pt-6 border-t">
          <button
            type="button"
            onClick={handleSaveAssignment}
            disabled={isSaving}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl transition cursor-pointer disabled:bg-blue-400"
          >
            {isSaving ? "Publishing Assignment..." : "Save & Publish Assignment for Students"}
          </button>
        </div>

      </div>
    </div>
  );
};
