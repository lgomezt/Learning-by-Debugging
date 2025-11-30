// user.tsx
import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import UserOutput from "./useroutput.tsx";
import { FaUser, FaRobot } from 'react-icons/fa';
import { diffChars } from 'diff';
import type { TestResult } from '../../utils/evaluation';

const TYPING_SPEED_MS = 15; 
// A small helper function to create a delay in async functions
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

type UserProps = {
  previousCode?: string; // The code state *before* the most recent change (T0)
  targetCode?: string;   // The new, final code state we are animating towards (T1)
  code?: string;         // The live, in-editor code (mostly for the user panel)
  setCode?: (code: string) => void;
  onCommit?: () => void;
  onEvaluate?: () => void;
  evaluationResults?: TestResult[];
  isAgentPanel?: boolean;
};

const panelThemes = {
  user: {
    label: "Your Workspace",
    Icon: FaUser,
    headerClasses: "bg-slate-800 text-slate-200",
    buttonClasses: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  agent: {
    label: "Coding Peer's Workspace",
    Icon: FaRobot,
    headerClasses: "bg-slate-700 text-slate-300",
    buttonClasses: "bg-cyan-600 hover:bg-cyan-700 text-white",
  }
};

function User({ 
  previousCode = "",
  targetCode = "print('Hello, world!')",
  code,
  setCode,
  onCommit,
  onEvaluate,
  evaluationResults,
  isAgentPanel = false
}: UserProps) {

  // Select the correct theme based on the isAgentPanel prop
  const theme = isAgentPanel ? panelThemes.agent : panelThemes.user;

  const [output, setOutput] = useState<string>("");
  const [pyodide, setPyodide] = useState<any>(null);

  // Local state to control the text displayed in the editor.
  // This allows us to have an animated value that's separate from the incoming props.
  const [displayedCode, setDisplayedCode] = useState(targetCode);
  const animationCancelled = useRef(false);

  // This effect handles the typing animation for the agent panel
  useEffect(() => {
    animationCancelled.current = true; // Signal any previous animation to stop

    if (!isAgentPanel) {
      if(code) setDisplayedCode(code); // User panel updates instantly
      return;
    }

    // This function will run the new animation
    const animate = async () => {
      animationCancelled.current = false; // Reset cancellation flag for the new animation
      
      // Calculate the difference between the old and new code
      const diffs = diffChars(previousCode, targetCode);
      let currentCode = "";

      for (const part of diffs) {
        if (animationCancelled.current) return; // Exit if a newer animation has started

        if (part.added) {
          // If a part of the text was ADDED, type it out character by character
          for (const char of part.value) {
            if (animationCancelled.current) return;
            currentCode += char;
            setDisplayedCode(currentCode);
            await delay(TYPING_SPEED_MS);
          }
        } else if (!part.removed) {
          // If a part was UNCHANGED, add it instantly
          currentCode += part.value;
          setDisplayedCode(currentCode);
        }
        // If a part was REMOVED, we do nothing, effectively deleting it.
      }
      
      // Ensure the final state is perfect and syncs with the parent
      if (!animationCancelled.current) {
          setDisplayedCode(targetCode);
          if (setCode) setCode(targetCode);
      }
    };

    animate();

    // Cleanup function to cancel animation on unmount or re-render
    return () => {
      animationCancelled.current = true;
    };
  }, [targetCode, previousCode, isAgentPanel]);

  useEffect(() => {
    async function load() {
      // Import Pyodide from ESM-compatible URL
      // @ts-ignore
      const pyodideModule = await import("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.mjs");
      const pyodideInstance = await pyodideModule.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
      });
      setPyodide(pyodideInstance);
    }
    load();
  }, []);

  // Called when the user presses "Run".
  // Before executing, it promotes the current live code to a committed version (T1),
  // which then becomes part of the tracked state used by the agent for reasoning.
  async function runCode() {
    // Update the code T1 and T0 states
    if (onCommit) onCommit(); 
    if (!pyodide) return;
    setOutput("");
    // Capture output
    pyodide.setStdout({ batched: (s: string) => setOutput((prev) => prev + s + "\n") });
    pyodide.setStderr({ batched: (s: string) => setOutput((prev) => prev + s + "\n") });
    try {
      // IMPORTANT: Run the committed code from the prop, not the potentially-animating displayedCode
      await pyodide.runPythonAsync(code);
    } catch (err: unknown) {
      setOutput(String(err));
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    // Update the parent's live code state immediately
    if (setCode) setCode(newCode);
    // If it's the user panel, also update the local display immediately
    if (!isAgentPanel) {
        setDisplayedCode(newCode);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      {/* Header bar extends full width */}
      <div className={`flex flex-none items-center justify-between px-4 py-2 ${theme.headerClasses}`}>
        <div className="flex items-center gap-3">
          <theme.Icon className="w-5 h-5" />
          <div className="text-sm font-semibold">{theme.label}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={runCode}
            disabled={!pyodide}
          >
            Run
          </button>
          {!isAgentPanel && onEvaluate && (
            <button
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              onClick={onEvaluate}
              disabled={!pyodide}
            >
              Evaluate
            </button>
          )}
        </div>
      </div>
      {/* Editor and Terminal side by side */}
      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0">
          <Editor
            className="flex-1"
            defaultLanguage="python"
            value={displayedCode} // The editor shows our local animated state
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "monospace",
              readOnly: isAgentPanel, // Make the agent editor read-only to prevent user interference
              wordWrap: 'on',
              lineNumbers: 'on'
            }}
          />
        </div>
        <UserOutput text={output} evaluationResults={evaluationResults} isAgentPanel={isAgentPanel}></UserOutput>
      </div>
    </div>
  );
}

export default User;