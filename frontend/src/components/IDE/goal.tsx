type GoalProps = {
  text: string;
};

function Goal({ text }: GoalProps) {
  return (
    <div className="flex flex-col bg-slate-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Goal</h2>
      </div>
      
      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
        Finish this lesson by creating an output like the one shown below.
      </p>
      
      {/* Output Area */}
      <div>
        <div className="bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-slate-400 text-xs ml-2">Expected Output</span>
            </div>
            <div className="text-slate-500 text-xs">target</div>
          </div>
          <pre className="text-sm font-mono whitespace-pre-wrap overflow-y-auto bg-slate-950 text-emerald-300 p-4 max-h-64">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Goal;