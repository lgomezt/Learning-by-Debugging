// IDE.tsx
import { useState, useEffect } from "react";

import './IDE.css';
import LeftPanel from './leftpanel.tsx';
import User from './user.tsx';
import EvaluationPopup from './EvaluationPopup.tsx';
import { fetchProblem } from '../../utils/api.ts';
import { useFiles } from "../../../context/filecontext.tsx";
import { type HistoryEvent } from './chatbot.tsx';
import { evaluateCode, type EvaluationResults } from '../../utils/evaluation.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
    const { selectedFile } = useFiles();

    const [ title, setTitle ] = useState<string>("");

    const [problemStatement, setProblemStatement] = useState<string>("");

    // T0 = previous version, T1 = current version.
    // These are only updated when the user signals intent (e.g. by clicking Run or interacting with the chatbot).
    const [userCodeT0, setUserCodeT0] = useState<string>("");
    const [userCodeT1, setUserCodeT1] = useState<string>("");

    const [agentCodeT0, setAgentCodeT0] = useState<string>("");
    const [agentCodeT1, setAgentCodeT1] = useState<string>("");

    const [lessonGoals, setLessonGoals] = useState([]);
    const [commonMistakes, setCommonMistakes] = useState([]);

    // Live-in-editor code states.
    // These store what the user or agent is *currently typing or editing* in real-time.
    // They update on every keystroke but do NOT count as meaningful code revisions
    // until the user explicitly submits the code (e.g., by pressing "Run" or sending a message).
    const [liveUserCode, setLiveUserCode] = useState<string>("");
    const [liveAgentCode, setLiveAgentCode] = useState<string>("");

    const [difficulty, setDifficulty] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);

    const [description, setDescription] = useState<string>("");
    const [milestones, setMilestones] = useState<{ number: number; content: string }[]>([]);
    const [goal, setGoal] = useState<string>("");

    // Evaluation-related state
    const [evaluation, setEvaluation] = useState<string>("");
    const [suggestedAnswer, setSuggestedAnswer] = useState<string>("");
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResults | null>(null);
    const [showEvaluationPopup, setShowEvaluationPopup] = useState<boolean>(false);
    const [evaluationPyodide, setEvaluationPyodide] = useState<any>(null);

    // This is now the single source of truth for the conversation
    const [conversationHistory, setConversationHistory] = useState<HistoryEvent[]>([]);

    // We should move this to utils later
    // This function handles the change in code for both user and agent.
    // It shifts the previous code (t0) to the current code (t1)
    // and updates the current code (t1) with the new code.
    // This is used to track the evolution of code over time.
    function handleCodeChange(
        newCode: string,
        codeT1: string,
        setCodeT0: (v: string) => void,
        setCodeT1: (v: string) => void,
        ) {
            if (newCode !== codeT1) {
                setCodeT0(codeT1); // shift current to previous
                setCodeT1(newCode); // update current
            }
        }

    function commitUserCode(): HistoryEvent | null {

        // Only commit and add to history if the code has actually changed
        if (liveUserCode !== userCodeT1) {
            // First, update the T0/T1 states
            handleCodeChange(liveUserCode, userCodeT1, setUserCodeT0, setUserCodeT1);
            // Second, add the code change as an event in our history
            const userCodeEvent: HistoryEvent = { author: 'user', type: 'code', content: liveUserCode };
            setConversationHistory(prev => [...prev, userCodeEvent]);
            return userCodeEvent;
        } else {
            return null;
        }
    }

    function commitAgentCode(newCode?: string): HistoryEvent | null {
        const codeToCommit = newCode || liveAgentCode;
        // Only commit and add to history if the code has actually changed
        if (codeToCommit !== agentCodeT1) {
            if (newCode) {
                setLiveAgentCode(newCode);
            }
            // First, update the T0/T1 states
            handleCodeChange(codeToCommit, agentCodeT1, setAgentCodeT0, setAgentCodeT1);

            // Second, add the code change as an event in our history
            const agentCodeEvent: HistoryEvent = { author: 'agent', type: 'code', content: codeToCommit };
            setConversationHistory(prev => [...prev, agentCodeEvent]);
            return agentCodeEvent;
        } else {
            return null;
        }
    }

    // Core agent interaction
    async function handleSendMessage(userInput: string) {
        // Manually construct the up-to-the-moment history for the API call.
        // Start with the history as it exists right now.
        let historyForApi = [...conversationHistory];

        // Commit user code and get the new event back instantly.
        const newUserCodeEvent = commitUserCode();
        if (newUserCodeEvent) {
            // If there was a change, add it to our manually built history.
            historyForApi.push(newUserCodeEvent);
        }

        const newAgentCodeEvent = commitAgentCode();
        if (newAgentCodeEvent) {
            // If there was a change, add it to our manually built history.
            historyForApi.push(newAgentCodeEvent);
        }

        // Create the user's chat message event.
        const userChatEvent: HistoryEvent = { author: 'user', type: 'chat', content: userInput };
        historyForApi.push(userChatEvent);

        setConversationHistory(prev => [...prev, userChatEvent]);

        // NOW perform the side effect (API call) completely separate from the state setter.
            try {
                const res = await fetch(`${API_BASE_URL}/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        // We send the optimistic history we just created
                        conversation_history: historyForApi, 
                        problem_statement: problemStatement,
                        lesson_goals: lessonGoals,
                        common_mistakes: commonMistakes
                    }),
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();

                // Agent responds. Add the agent's chat message to history.
                const agentChatEvent: HistoryEvent = { author: 'agent', type: 'chat', content: data.content };
                setConversationHistory(prev => [...prev, agentChatEvent]);

                // If the agent sent new code, commit it. This will automatically add the
                // agent 'code' event to the history for us.
                if (data.updated_code) {
                    commitAgentCode(data.updated_code);
                }

            } catch (err) {
                console.error(err);
                const errorEvent: HistoryEvent = { author: 'agent', type: 'chat', content: "Sorry, something went wrong..." };
                // If the API fails, we should add an error message to the history.
                setConversationHistory(prev => [...prev, errorEvent]);
            }
        }

    // Executed when the user press Load Lesson 1 button
    useEffect(() => {
        async function loadProblem() {
            if (selectedFile != null) {
                const problem = await fetchProblem(selectedFile);  
                console.log("problem", problem)        
                const agentInit = problem.agent_code || "";
                const userInit = problem.user_code || "";

                setTitle(problem.title || "");
                // Initialize both t0 and t1
                setAgentCodeT0("");
                setUserCodeT0("");
                setAgentCodeT1(agentInit);
                setUserCodeT1(userInit);

                const agentCodeEvent: HistoryEvent = { author: 'agent', type: 'code', content: agentInit };
                const userCodeEvent: HistoryEvent = { author: 'user', type: 'code', content: userInit };

                // Set the conversation history to its starting state
                setConversationHistory([agentCodeEvent, userCodeEvent]);

                setDifficulty(problem.difficulty || "");
                setTags(problem.tags || []);
                // Retrieve the problem statement
                setProblemStatement(problem.problem_statement || "");
                setDescription(problem.description_block || "");
                setMilestones(problem.milestones || []);
                setGoal(problem.example_output || "");
                setCommonMistakes(problem.common_mistakes || []);
                setLessonGoals(problem.lesson_goals || []);
                setEvaluation(problem.evaluation || "");
                setSuggestedAnswer(problem.suggested_answer || "");
            }
        }
        
        loadProblem();
    }, [selectedFile]);

    // Load Pyodide for evaluation
    useEffect(() => {
        async function loadPyodide() {
            // @ts-ignore
            const pyodideModule = await import("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.mjs");
            const pyodideInstance = await pyodideModule.loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
            });
            setEvaluationPyodide(pyodideInstance);
        }
        loadPyodide();
    }, []);

    // Handle evaluation
    async function handleEvaluate() {
        if (!evaluationPyodide || !evaluation || !suggestedAnswer) {
            console.error("Evaluation not ready: missing pyodide, evaluation code, or suggested answer");
            return;
        }

        // Commit user code before evaluation
        commitUserCode();

        try {
            console.log("Starting evaluation...");
            console.log("User code:", liveUserCode || userCodeT1);
            console.log("Agent code:", liveAgentCode || agentCodeT1);
            console.log("Evaluation code:", evaluation);
            
            const results = await evaluateCode(
                evaluationPyodide,
                liveUserCode || userCodeT1,
                liveAgentCode || agentCodeT1,
                suggestedAnswer,
                evaluation
            );

            console.log("Evaluation results:", results);
            setEvaluationResults(results);
            setShowEvaluationPopup(true);
        } catch (error) {
            console.error("Evaluation error:", error);
            alert(`Evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    function handleRetry() {
        setShowEvaluationPopup(false);
        // Keep evaluation results visible in console, don't clear them
    }

    function handleAccept() {
        setShowEvaluationPopup(false);
        // TODO: Mark problem as completed, navigate away, etc.
        console.log("Problem completed!");
    }

    return ( 
    <>
        {/*<Header title={title}/>*/}
        <div className="flex h-[calc(100vh)]">
            <div id="container-left" className="flex flex-col">
                <LeftPanel
                    title={title}
                    difficulty={difficulty}
                    tags={tags}
                    problemStatement={problemStatement}
                    description={description}
                    milestones={milestones}
                    goal={goal}
                    userCodeT1={userCodeT1}
                    agentCodeT1={agentCodeT1}
                    handleAgentCodeChange={commitAgentCode}
                    lessonGoals={lessonGoals}
                    commonMistakes={commonMistakes}
                    conversationHistory={conversationHistory}
                    onSendMessage={handleSendMessage}
                />
            </div>
            {/* Right Panel: Split vertically into User (top) and Agent (bottom) */}
            <div className="flex flex-1 flex-col">
                {/* User Section: Top Half */}
                <div className="flex flex-1 flex-col min-h-0 border-b border-slate-700">
                    <User 
                        previousCode={userCodeT0}
                        targetCode={userCodeT1} 
                        code={liveUserCode} 
                        setCode={setLiveUserCode} 
                        onCommit={commitUserCode}
                        onEvaluate={handleEvaluate}
                        evaluationResults={evaluationResults?.userResults}
                    />
                </div>
                
                {/* Agent Section: Bottom Half */}
                <div className="flex flex-1 flex-col min-h-0">
                    <User 
                        previousCode={agentCodeT0} 
                        targetCode={agentCodeT1}   
                        code={liveAgentCode} 
                        setCode={setLiveAgentCode} 
                        onCommit={commitAgentCode}
                        isAgentPanel={true}
                        evaluationResults={evaluationResults?.agentResults}
                    />
                </div>
            </div>
        </div>
        {showEvaluationPopup && (
            <EvaluationPopup
                results={evaluationResults}
                onRetry={handleRetry}
                onAccept={handleAccept}
            />
        )}
    </> )
}

export default App;
