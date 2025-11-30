// EvaluationPopup.tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { EvaluationResults } from '../../utils/evaluation';

type EvaluationPopupProps = {
  results: EvaluationResults | null;
  onClose: () => void;
  onRetry: () => void;
  onAccept: () => void;
};

function EvaluationPopup({ results, onClose, onRetry, onAccept }: EvaluationPopupProps) {

  useEffect(() => {
    if (results && results.userPassRate === 100 && results.agentPassRate === 100) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: Math.random(),
            y: Math.random(),
          },
          colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
        });
      }, 200);
    }
  }, [results]);

  if (!results) return null;

  const allPassed = results.userPassRate === 100 && results.agentPassRate === 100;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Evaluation Results</h2>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded">
            <span className="font-semibold">Your Code:</span>
            <span className={`font-bold ${results.userPassRate === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {results.userPassRate.toFixed(0)}% ({results.userResults.filter(r => r.passed).length}/{results.userResults.length} tests passed)
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-50 rounded">
            <span className="font-semibold">Agent Code:</span>
            <span className={`font-bold ${results.agentPassRate === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {results.agentPassRate.toFixed(0)}% ({results.agentResults.filter(r => r.passed).length}/{results.agentResults.length} tests passed)
            </span>
          </div>
        </div>

        {allPassed ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600 mb-4">
              🎉 Congratulations! All tests passed!
            </p>
            <button
              onClick={onAccept}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            >
              Accept
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold text-orange-600 mb-4">
              Some tests failed. Keep trying!
            </p>
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EvaluationPopup;

