import { useState, useEffect, useRef} from "react";
import type { TestResult } from '../../utils/evaluation';

type UserOutputProps = {
    text: string;
    evaluationResults?: TestResult[];
    isAgentPanel?: boolean;
}

function UserOutput({ text, evaluationResults, isAgentPanel = false }: UserOutputProps) {
    const [type] = useState<number>(1);
    const [history, setHistory] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Debug: Log when evaluation results change
    useEffect(() => {
        if (evaluationResults && evaluationResults.length > 0) {
            console.log(`${isAgentPanel ? 'Agent' : 'User'} evaluation results:`, evaluationResults);
        }
    }, [evaluationResults, isAgentPanel]);

    useEffect(() => {
        if (text) setHistory((prev) => [...prev, text]);
    }, [text]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, evaluationResults]);

    return (
        <div className="flex flex-col flex-1 border-l border-slate-700 bg-slate-900 min-w-0">
            <div className="flex flex-1 min-h-0">
                {type === 1 && (
                    <div className="px-4 py-4 bg-slate-950 text-slate-100 flex-1 font-mono text-sm overflow-auto whitespace-pre-wrap break-words">
                        {history.length === 0 && (!evaluationResults || evaluationResults.length === 0) ? (
                            <div className="text-slate-500 italic">Ready to run your code...</div>
                        ) : (
                            <>
                                {/* Evaluation Results */}
                                {evaluationResults && evaluationResults.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-cyan-400 text-sm font-semibold mb-2">
                                            {isAgentPanel ? 'Agent Evaluation Results' : 'User Evaluation Results'}
                                        </div>
                                        {evaluationResults.map((result, idx) => (
                                            <div key={idx} className="mb-3 p-2 bg-slate-800 rounded">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs">
                                                        Test {isAgentPanel ? 'agent' : 'user'} code {result.testNumber}/{result.totalTests}
                                                    </span>
                                                    <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                                                        {result.passed ? '✅' : '❌'}
                                                    </span>
                                                </div>
                                                {result.input && (
                                                    <div className="text-xs text-slate-400 mb-1">
                                                        Input: {JSON.stringify(result.input)}
                                                    </div>
                                                )}
                                                {result.error ? (
                                                    <div className="text-xs text-red-400">
                                                        Error: {result.error}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-xs text-slate-400 mb-1">
                                                        Expected: <span className="text-green-300">{result.expectedOutput || '(empty)'}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                        Got: <span className={result.passed ? 'text-green-300' : 'text-red-300'}>{result.actualOutput || '(empty)'}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Regular output history */}
                                {history.length > 0 && (
                                    <div className={evaluationResults && evaluationResults.length > 0 ? 'mt-4 pt-4 border-t border-slate-700' : ''}>
                                        {history.map((line, idx) => (
                                            <div key={idx} className="mb-3">
                                                <div className="text-emerald-400 text-xs mb-1">% python3 main.py</div>
                                                <div className="text-slate-100">{line}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={scrollRef} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserOutput;