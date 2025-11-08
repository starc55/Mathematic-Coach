import React, { useState, useRef, useEffect } from 'react';
import { getSocraticResponse } from './services/geminiService';
import type { ChatMessage, SavedSession } from './types';
import { ChatBubble } from './components/ChatBubble';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ImageUpload } from './components/ImageUpload';
import { SendIcon, SparklesIcon, PlusIcon, SaveIcon, FolderIcon, BookOpenIcon, LightBulbIcon } from './components/Icons';
import { LoadSessionModal } from './components/LoadSessionModal';
import { PracticeProblems } from './components/PracticeProblems';
import type { PracticeProblem } from './data/practiceProblems';

const APP_STORAGE_KEY = 'socratic-math-tutor-history';
const SAVED_SESSIONS_STORAGE_KEY = 'socratic-math-tutor-sessions';
const COMPLETED_PROBLEMS_STORAGE_KEY = 'socratic-math-tutor-completed-problems';

type AppView = 'welcome' | 'practice' | 'chat';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(true);
  
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);
  const [showSaveNotification, setShowSaveNotification] = useState<boolean>(false);
  const [completedProblemIds, setCompletedProblemIds] = useState<Set<string>>(new Set());


  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Load saved sessions and completed problems from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_SESSIONS_STORAGE_KEY);
      if (saved) {
        setSavedSessions(JSON.parse(saved));
      }
      const savedCompleted = localStorage.getItem(COMPLETED_PROBLEMS_STORAGE_KEY);
      if (savedCompleted) {
        setCompletedProblemIds(new Set(JSON.parse(savedCompleted)));
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
    }
  }, []);
  
  // Try to resume session from localStorage on initial load
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(APP_STORAGE_KEY);
      if (savedHistory) {
        const history: ChatMessage[] = JSON.parse(savedHistory);
        if (history.length > 0) {
            setChatHistory(history);
            if (history[0].image) {
                setUploadedImage(history[0].image);
            }
            setView('chat');
        }
      }
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem(APP_STORAGE_KEY);
    }
  }, []);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auto-save current session
  useEffect(() => {
    try {
      if (chatHistory.length > 0 && view === 'chat') {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(chatHistory));
      } else {
        localStorage.removeItem(APP_STORAGE_KEY);
      }
    } catch (error) {
        console.error("Failed to save chat history to localStorage", error);
    }
  }, [chatHistory, view]);
  
  const startSocraticSession = async (historySoFar: ChatMessage[], promptForApi: string) => {
    setIsLoading(true);
    setError(null);
    setChatHistory(historySoFar);
    setView('chat');

    try {
      const response = await getSocraticResponse(promptForApi, historySoFar, isThinkingMode);
      setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unknown error occurred while starting the session.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        const base64data = reader.result as string;
        if (base64data) {
            setUploadedImage(base64data);
            const initialUserMessage: ChatMessage = {
                role: 'user',
                content: '', // Content is empty, image is the focus
                image: base64data,
            };
            const initialPrompt = "This is a math problem. Please explain the very first step to begin solving it. Be encouraging and ask me to try it myself.";
            startSocraticSession([initialUserMessage], initialPrompt);
        }
    };
  };
  
  const handleSelectProblem = (problem: PracticeProblem) => {
    setUploadedImage(null); // No image for practice problems
    const initialUserMessage: ChatMessage = {
      role: 'user',
      content: `Here is the math problem I want to solve: ${problem.problem}`,
    };
    const initialPrompt = "This is a math problem. Please explain the very first step to begin solving it. Be encouraging and ask me to try it myself.";
    startSocraticSession([initialUserMessage], initialPrompt);

    // Mark problem as completed and save to localStorage
    const newCompletedIds = new Set(completedProblemIds);
    newCompletedIds.add(problem.id);
    setCompletedProblemIds(newCompletedIds);
    try {
        localStorage.setItem(COMPLETED_PROBLEMS_STORAGE_KEY, JSON.stringify(Array.from(newCompletedIds)));
    } catch (error) {
        console.error("Failed to save completed problems to localStorage", error);
    }
  };

  const submitUserMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: messageText };
    const currentChatHistory = [...chatHistory]; // Capture state before update

    setChatHistory([...currentChatHistory, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await getSocraticResponse(messageText, currentChatHistory, isThinkingMode);
      setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitUserMessage(userInput);
    setUserInput('');
  };

  const handleNewChat = () => {
    if (chatHistory.length > 0 && !window.confirm("Are you sure you want to start a new chat? Your current progress will be lost unless you've saved the session.")) {
        return;
    }
    setChatHistory([]);
    setUploadedImage(null);
    setError(null);
    setUserInput('');
    setView('welcome');
    localStorage.removeItem(APP_STORAGE_KEY);
  };

  const handleSaveSession = () => {
    if (chatHistory.length === 0) {
      setError("Cannot save an empty chat.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newSession: SavedSession = {
      id: `session-${Date.now()}`,
      name: `Session - ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      chatHistory: chatHistory,
      image: uploadedImage,
    };

    const updatedSessions = [...savedSessions, newSession];
    setSavedSessions(updatedSessions);
    localStorage.setItem(SAVED_SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  const handleLoadSession = (sessionId: string) => {
    const sessionToLoad = savedSessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      setChatHistory(sessionToLoad.chatHistory);
      setUploadedImage(sessionToLoad.image);
      setIsLoadModalOpen(false);
      setView('chat');
    } else {
      setError("Could not find the session to load.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      const updatedSessions = savedSessions.filter(s => s.id !== sessionId);
      setSavedSessions(updatedSessions);
      localStorage.setItem(SAVED_SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    }
  };

  const renderWelcomeView = () => (
    <div className="text-center p-8 bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 max-w-2xl mx-auto">
        <SparklesIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-3xl font-light mb-2 text-white">Welcome!</h2>
        <p className="text-slate-400 mb-8">Ready to tackle a math problem? Choose an option to get started.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ImageUpload onImageUpload={handleImageUpload} disabled={isLoading} />
          <button
            onClick={() => setView('practice')}
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-200/20 text-base font-medium rounded-full shadow-sm text-slate-200 bg-slate-200/10 hover:bg-slate-200/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BookOpenIcon className="w-5 h-5 mr-2 -ml-1" />
            Practice Problems
          </button>
        </div>
    </div>
  );
  
  const renderChatView = () => (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
        {chatHistory.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
        {isLoading && chatHistory.length > 0 && (
          <div className="flex justify-center items-center gap-4">
            <LoadingSpinner />
            <span className="text-slate-400">The AI is thinking...</span>
          </div>
        )}
        {error && <div className="text-rose-400 text-center p-2 bg-rose-900/30 rounded-md">{error}</div>}
        <div ref={chatEndRef} />
    </div>
  );
  
  const promptSuggestions = [
    "What's the concept behind this?",
    "Show me the next step",
    "Explain that in a different way",
  ];

  return (
    <div className="flex flex-col h-screen font-sans bg-transparent text-slate-200">
      {showSaveNotification && (
        <div className="absolute top-20 right-4 bg-slate-700/50 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 z-50">
          Session saved successfully!
        </div>
      )}
      <LoadSessionModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
      />
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 shadow-lg p-4 flex justify-between items-center z-10 sticky top-0">
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
          Socratic Math Tutor
        </h1>
        <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="thinking-mode" className="text-sm font-medium text-slate-300 hidden sm:block">
                Thinking
              </label>
              <button
                onClick={() => setIsThinkingMode(!isThinkingMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isThinkingMode ? 'bg-slate-400' : 'bg-slate-600'}`}
                aria-pressed={isThinkingMode}
                title="Toggle Thinking Mode"
              >
                <span className="sr-only">Enable Thinking Mode</span>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isThinkingMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <button
                onClick={handleSaveSession}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Save current session"
              >
                <SaveIcon className="w-5 h-5" />
                <span className="hidden md:inline">Save</span>
            </button>
            <button
                onClick={() => setIsLoadModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Load a session"
              >
                <FolderIcon className="w-5 h-5" />
                <span className="hidden md:inline">Load</span>
            </button>
            <button
                onClick={handleNewChat}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/10 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Start new chat"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden md:inline">New</span>
            </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center">
        {view === 'welcome' && !isLoading && renderWelcomeView()}
        {view === 'practice' && !isLoading && <PracticeProblems onSelectProblem={handleSelectProblem} onBack={() => setView('welcome')} completedProblemIds={completedProblemIds} />}
        {view === 'chat' && renderChatView()}
        {isLoading && view !== 'chat' && (
           <div className="flex flex-col justify-center items-center gap-4 h-full">
             <LoadingSpinner />
             <span className="text-slate-400">Starting your session...</span>
           </div>
        )}
      </main>

      {view === 'chat' && (
        <footer className="bg-black/20 backdrop-blur-lg p-4 border-t border-white/10 sticky bottom-0">
            <div className="max-w-3xl mx-auto flex flex-wrap justify-center items-center gap-2 mb-3">
              <LightBulbIcon className="w-5 h-5 text-slate-400" />
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => submitUserMessage(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm text-slate-200 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center space-x-4">
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={"Ask a question or for the next step..."}
                disabled={isLoading}
                className="flex-1 p-3 border border-slate-600 rounded-full focus:ring-2 focus:ring-slate-400 focus:outline-none bg-white/5 text-white placeholder-slate-400 disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={!userInput.trim() || isLoading}
                className="bg-slate-200 text-slate-900 rounded-full p-3 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
            >
                <SendIcon className="w-6 h-6" />
            </button>
            </form>
        </footer>
      )}
    </div>
  );
};

export default App;