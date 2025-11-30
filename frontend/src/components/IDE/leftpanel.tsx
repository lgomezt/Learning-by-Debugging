// leftpanel.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "./chatbot";
import Goal from "./goal";
import { type HistoryEvent } from "./chatbot"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus'

type LeftPanelProps = {
  title: string;
  difficulty: string;
  tags: string[];
  problemStatement: string;
  description: string;
  milestones: { number: number; content: string }[];
  goal: string;
  userCodeT1: string;
  agentCodeT1: string;
  handleAgentCodeChange: (newCode: string) => void;
  lessonGoals: string[];
  commonMistakes: string[];
  conversationHistory: HistoryEvent[];
  onSendMessage: (input: string) => Promise<void>;
};

function LeftPanel({
        title,
        difficulty,
        tags,
        description,
        milestones,
        goal,
        conversationHistory,
        onSendMessage,
    }: LeftPanelProps) {

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"description" | "chatbot">("description");
    const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
    const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());

    const togglePanel = () => {
        setIsPanelCollapsed(!isPanelCollapsed);
    };

    const toggleMilestone = (index: number) => {
        const newExpanded = new Set(expandedMilestones);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedMilestones(newExpanded);
    };

    const getDifficultyStyle = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'text-green-400';
            case 'medium':
                return 'text-yellow-400';
            case 'hard':
                return 'text-red-400';
            default:
                return 'text-emerald-400';
        }
    };

    return ( 
        <div className={`flex flex-col h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 ease-in-out ${
            isPanelCollapsed ? 'w-8' : 'w-[calc(100vw/3)]'
        }`}>
            {/* Collapsed Sidebar*/}
            {isPanelCollapsed ? (
                <div className="flex flex-col h-full bg-slate-900">
                    <div className="p-3 border-b border-slate-700 flex justify-center">
                        <button
                            onClick={togglePanel}
                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-colors rounded hover:bg-slate-700"
                            title="Expand panel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Left Panel Header */}
                    <div className="flex bg-slate-800 border-b border-slate-700">
                        <button 
                            onClick={() => navigate("/problem_selection")}
                            className="px-3 py-3 text-slate-400 hover:text-emerald-300 transition-colors border-r border-slate-700"
                            title="Back to problem selection"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <button onClick={() => setActiveTab("description")}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors relative ${
                                activeTab === "description"
                                    ? "border-emerald-500 text-emerald-400 bg-slate-900"
                                    : "border-transparent text-slate-400 hover:text-emerald-300"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                            Description
                        </button>
                        <button onClick={() => setActiveTab("chatbot")}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === "chatbot"
                                    ? "border-emerald-500 text-emerald-400 bg-slate-900"
                                    : "border-transparent text-slate-400 hover:text-emerald-300"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            Coding Peer
                        </button>
                        
                        <div className="flex-1 flex justify-end items-center pr-2">
                            <button onClick={togglePanel}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-colors rounded hover:bg-slate-700"
                                title="Collapse panel"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-hidden bg-slate-900">
                        {/* Description Content */}
                        {activeTab === "description" && (
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <h1 className="text-xl font-medium text-white">
                                            {title}
                                        </h1>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${getDifficultyStyle(difficulty)}`}>
                                                {difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {tags && tags.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-slate-400">Topics:</span>
                                            {tags.map((tag, index) => (
                                                <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors cursor-default">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {/* Description Tab Content*/}
                                    <div className="p-4">
                                        {/* prose: to activate @tailwindcss/typography plugin */}
                                        {/* prose-invert: flips the color scheme to be light text on a dark background */}
                                         <div className="
                                            prose prose-invert text-slate-100 leading-relaxed
                                        
                                            prose-code:text-emerald-400 prose-code:p-1 prose-code:rounded-md 
                                            prose-code:before:content-none prose-code:after:content-none

                                            prose-pre:bg-slate-800 prose-pre:rounded-lg prose-pre:shadow-lg
                                            ">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    rehypePlugins={[rehypePrism]}
                                                >
                                                {description}
                                            </ReactMarkdown>
                                        </div>
                                    </div> {milestones && milestones.length > 0 && (
                                        <div className="p-4">
                                            <div className="space-y-3">
                                                {milestones.map((milestone, index) => (
                                                    <div key={index} className="border border-slate-700 rounded-lg">
                                                        <button onClick={() => toggleMilestone(index)}
                                                            className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-800 hover:bg-slate-750 transition-colors rounded-lg"
                                                        >
                                                            <span className="text-sm font-medium text-slate-200">
                                                                Milestone {milestone.number}
                                                            </span>
                                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedMilestones.has(index) ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {expandedMilestones.has(index) && (
                                                            <div className="px-4 py-3 border-t border-slate-700 bg-slate-900">
                                                                <div className="text-slate-100 leading-relaxed">
                                                                    <div className="
                                                                    prose prose-invert text-slate-100 leading-relaxed
                                                                    
                                                                    prose-code:text-emerald-400 prose-code:p-1 prose-code:rounded-md 
                                                                    prose-code:before:content-none prose-code:after:content-none

                                                                    prose-pre:bg-slate-800 prose-pre:rounded-lg prose-pre:shadow-lg                                                                    
                                                                    ">
                                                                        <ReactMarkdown 
                                                                            remarkPlugins={[remarkGfm]}
                                                                            rehypePlugins={[rehypePrism]}
                                                                        >
                                                                            {milestone.content}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Goal section at the bottom of Description */}
                                    {goal && (
                                        <div className="p-4 mt-6 border-t border-slate-700 pt-6">
                                            <Goal text={goal}></Goal>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Chatbot Tab Content */}
                        {activeTab === "chatbot" && (
                            <div className="h-full flex flex-col">
                                <Chatbot                                    
                                    conversationHistory={conversationHistory}
                                    onSendMessage={onSendMessage}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default LeftPanel;