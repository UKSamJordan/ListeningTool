import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles } from 'lucide-react';

interface CelebrationModalProps {
  studentName: string;
  score: number;
  totalQuestions: number;
  onDone: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  studentName,
  score,
  totalQuestions,
  onDone
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  const getFeedbackMessage = () => {
    if (percentage >= 90) return { title: "Outstanding Cambridge Achievement!", desc: "Exceptional listening skills and high precision." };
    if (percentage >= 70) return { title: "Great Effort!", desc: "Strong comprehension demonstrated across the questions." };
    if (percentage >= 50) return { title: "Good Progress!", desc: "Solid effort on your Cambridge Stage 6 listening test." };
    return { title: "Challenge Completed!", desc: "Great practice! Every listening challenge builds your English proficiency." };
  };

  const feedback = getFeedbackMessage();

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-lg w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-blue-950 flex items-center justify-center mx-auto mb-4 shadow-xl ring-4 ring-amber-100">
          <Award className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Well Done, {studentName}!
        </h3>

        <p className="text-sm font-bold text-amber-600 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4" /> {feedback.title}
        </p>

        <div className="my-6 p-6 rounded-3xl bg-slate-50 border-2 border-slate-100 max-w-xs mx-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Your Listening Score
          </div>
          <div className="text-4xl sm:text-5xl font-black text-blue-600 mt-1">
            {score} <span className="text-2xl text-slate-400 font-semibold">/ {totalQuestions}</span>
          </div>
          <div className="text-sm font-bold text-slate-600 mt-1">
            {percentage}% Correct
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-8">
          {feedback.desc} Your results have been submitted to your teacher.
        </p>

        <button
          type="button"
          onClick={onDone}
          className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/20 transition active:scale-98 cursor-pointer"
        >
          Finish & Return
        </button>

      </div>
    </div>
  );
};
