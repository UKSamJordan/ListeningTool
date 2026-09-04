import React, { useState } from 'react';
import { Question } from '../types';
import { HelpCircle, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';

interface QuizStationProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export const QuizStation: React.FC<QuizStationProps> = ({
  questions,
  onSubmit,
  isSubmitting = false
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const isAllAnswered = answeredCount === totalCount;

  const handleSelectOption = (questionId: string, choiceLetter: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceLetter
    }));
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    onSubmit(answers);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-100 flex items-center justify-between sticky top-20 z-30 backdrop-blur-md bg-white/95">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Comprehension Questions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Answer all 10 questions carefully based on the audio clip.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-extrabold text-blue-600">
            {answeredCount} / {totalCount} Answered
          </div>
          <div className="w-28 sm:w-36 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const selectedChoice = answers[q.id];
          const choiceLetters = ['A', 'B', 'C', 'D'];

          return (
            <div
              key={q.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 transition-all ${
                selectedChoice
                  ? 'border-blue-500/30 ring-1 ring-blue-500/10'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  {q.skill && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {q.skill}
                    </span>
                  )}
                </div>
                {selectedChoice && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                  </span>
                )}
              </div>

              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-5">
                {q.question}
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {q.options.map((optText, optIdx) => {
                  const letter = choiceLetters[optIdx];
                  const isSelected = selectedChoice === letter;

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleSelectOption(q.id, letter)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}>
                        {letter}
                      </div>
                      <span className={`text-sm sm:text-base font-medium ${
                        isSelected ? 'text-blue-950 font-semibold' : 'text-slate-700'
                      }`}>
                        {optText}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      <div className="pt-4 pb-12">
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={answeredCount === 0 || isSubmitting}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl transition-all transform cursor-pointer ${
            answeredCount > 0
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-[0.99] shadow-blue-500/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Submit My Assessment ({answeredCount}/{totalCount} Completed)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 text-center">
              Ready to submit your answers?
            </h3>

            {!isAllAnswered && (
              <p className="text-amber-700 bg-amber-50 rounded-xl p-3 text-xs sm:text-sm mt-3 text-center">
                ⚠️ You have answered <strong>{answeredCount}</strong> out of <strong>{totalCount}</strong> questions. Unanswered questions will receive 0 points.
              </p>
            )}

            <p className="text-slate-500 text-xs sm:text-sm text-center mt-2">
              Your listening answers will be saved for your teacher to review.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm transition"
              >
                Review Answers
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
