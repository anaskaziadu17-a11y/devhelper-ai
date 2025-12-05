import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { MessageRenderer } from './components/CodeBlock';
import { ViewState, Message, OS, ChatSession, Tutorial } from './types';
import { 
  createChatSession, 
  sendMessageStream, 
  diagnoseError, 
  getTerminalHelp, 
  generateTutorialContent 
} from './services/geminiService';
import { 
  loadSessions, 
  saveSession, 
  loadTutorials, 
  saveCustomTutorial,
  getUserProgress 
} from './services/storage';
import { 
  Send, 
  Play, 
  AlertTriangle, 
  Loader2, 
  Plus, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Key,
  BookOpen,
  Stethoscope,
  GraduationCap
} from 'lucide-react';
import { TERMINAL_CHEATSHEET } from './constants';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Dashboard State
  const [progress, setProgress] = useState(getUserProgress());
  
  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Using a ref to hold the generative AI chat instance
  const chatInstanceRef = useRef<any>(null);
  
  // Diagnostic State
  const [errorLog, setErrorLog] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Terminal State
  const [terminalOS, setTerminalOS] = useState<OS>(OS.Windows);
  const [terminalQuery, setTerminalQuery] = useState('');
  const [terminalResult, setTerminalResult] = useState('');

  // Tutorials State
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  // Teacher State
  const [newTutorialTopic, setNewTutorialTopic] = useState('');
  const [newTutorialLevel, setNewTutorialLevel] = useState('Beginner');
  const [isGeneratingTutorial, setIsGeneratingTutorial] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setTutorials(loadTutorials());
  }, []);

  // --- Chat Logic ---
  const startNewChat = async () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    saveSession(newSession);
    
    chatInstanceRef.current = await createChatSession();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    if (!currentSessionId) {
      await startNewChat();
    }
    
    const activeSessionId = currentSessionId || sessions[0]?.id; // Fallback if race condition
    if (!activeSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };

    // Update local UI state immediately
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
      ? { ...s, messages: [...s.messages, userMsg] } 
      : s
    ));
    setInputMessage('');
    setIsTyping(true);

    try {
      if (!chatInstanceRef.current) {
        chatInstanceRef.current = await createChatSession();
      }

      const streamResult = await sendMessageStream(chatInstanceRef.current, userMsg.content);
      
      let fullResponse = "";
      const botMsgId = (Date.now() + 1).toString();
      
      // Add empty bot message placeholder
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
        ? { ...s, messages: [...s.messages, { id: botMsgId, role: 'model', content: '', timestamp: Date.now() }] } 
        : s
      ));

      for await (const chunk of streamResult) {
        const chunkText = (chunk as GenerateContentResponse).text;
        fullResponse += chunkText;
        
        // Update streaming response
        setSessions(prev => prev.map(s => {
          if (s.id !== activeSessionId) return s;
          const updatedMessages = [...s.messages];
          const lastMsgIndex = updatedMessages.findIndex(m => m.id === botMsgId);
          if (lastMsgIndex !== -1) {
            updatedMessages[lastMsgIndex] = { ...updatedMessages[lastMsgIndex], content: fullResponse };
          }
          return { ...s, messages: updatedMessages };
        }));
      }
      
      // Save final state
      const updatedSession = sessions.find(s => s.id === activeSessionId);
      if (updatedSession) {
          const finalSession = {
              ...updatedSession,
              messages: [...updatedSession.messages, userMsg, { id: botMsgId, role: 'model' as const, content: fullResponse, timestamp: Date.now() }]
          };
          saveSession(finalSession);
      }

    } catch (e) {
      console.error(e);
      // Handle error in UI
    } finally {
      setIsTyping(false);
    }
  };

  // --- Diagnostics Logic ---
  const handleDiagnosis = async () => {
    if (!errorLog.trim()) return;
    setIsDiagnosing(true);
    const result = await diagnoseError(errorLog);
    setDiagnosticResult(result || "No diagnosis returned.");
    setIsDiagnosing(false);
  };

  // --- Teacher Mode Logic ---
  const handleGenerateTutorial = async () => {
    if (!newTutorialTopic.trim()) return;
    setIsGeneratingTutorial(true);
    const content = await generateTutorialContent(newTutorialTopic, newTutorialLevel);
    
    const newTutorial: Tutorial = {
      id: Date.now().toString(),
      title: newTutorialTopic,
      description: `AI Generated guide for ${newTutorialTopic}`,
      difficulty: newTutorialLevel as any,
      tags: ['AI Generated'],
      author: 'AI Teacher',
      content: content || '# Error generating content'
    };

    saveCustomTutorial(newTutorial);
    setTutorials(prev => [...prev, newTutorial]);
    setIsGeneratingTutorial(false);
    setNewTutorialTopic('');
    alert("Tutorial created successfully!");
  };

  // --- Terminal Help Logic ---
  const handleTerminalHelp = async () => {
      if (!terminalQuery.trim()) return;
      setTerminalResult('Generating command...');
      const res = await getTerminalHelp(terminalQuery, terminalOS);
      setTerminalResult(res || 'Could not find command.');
  }

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="p-6 md:p-10 space-y-8 overflow-y-auto h-full">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back, Coder</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your progress and pick up where you left off.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
               <BookOpen size={24} />
             </div>
             <h3 className="font-semibold text-slate-900 dark:text-white">Completed Tutorials</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{progress.completedTutorials.length}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
               <MessageRenderer content="" /> 
               <ShieldCheck size={24} />
             </div>
             <h3 className="font-semibold text-slate-900 dark:text-white">Secure Mode</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Environment keys are secure.</p>
          <div className="mt-4 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
             <ShieldCheck size={16} className="mr-1" /> System Active
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
               <Play size={24} />
             </div>
             <h3 className="font-semibold text-slate-900 dark:text-white">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{progress.streak} Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recommended Actions</h2>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-colors cursor-pointer group" onClick={() => setView('chat')}>
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-500">Solve a Bug</h4>
                        <p className="text-sm text-slate-500">Paste your error logs in the diagnostic tool.</p>
                    </div>
                    <ChevronRight className="text-slate-400 group-hover:text-brand-500" />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-colors cursor-pointer group" onClick={() => setView('tutorials')}>
                 <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-500">Learn Python Setup</h4>
                        <p className="text-sm text-slate-500">Master virtual environments in 5 mins.</p>
                    </div>
                    <ChevronRight className="text-slate-400 group-hover:text-brand-500" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => {
    const activeSession = sessions.find(s => s.id === currentSessionId) || { messages: [] };
    
    return (
      <div className="flex h-full flex-col md:flex-row overflow-hidden">
        {/* Chat Sidebar */}
        <div className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
          <div className="p-4">
             <button onClick={startNewChat} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
               <Plus size={18} />
               <span>New Chat</span>
             </button>
          </div>
          <div className="flex-1 overflow-y-auto">
             {sessions.map(s => (
               <div key={s.id} onClick={() => setCurrentSessionId(s.id)} className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 ${currentSessionId === s.id ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                 <h4 className="font-medium text-slate-700 dark:text-slate-300 truncate">{s.messages[0]?.content || "New Conversation"}</h4>
                 <p className="text-xs text-slate-400 mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm relative">
           <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
              {activeSession.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageRenderer content="" />
                    <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-full mb-4">
                        <MessageRenderer content="" />
                        <span className="text-4xl">👋</span>
                    </div>
                    <p className="text-lg">How can I help you code today?</p>
                </div>
              )}
              {activeSession.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl rounded-2xl p-4 md:p-6 ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                     {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                     ) : (
                        <MessageRenderer content={msg.content} />
                     )}
                  </div>
                </div>
              ))}
              {isTyping && (
                  <div className="flex justify-start">
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center space-x-2">
                        <Loader2 className="animate-spin text-brand-500" size={20} />
                        <span className="text-slate-500 text-sm">Thinking...</span>
                     </div>
                  </div>
              )}
           </div>

           <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="max-w-4xl mx-auto relative flex items-center">
                 <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about code, errors, or setup..."
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                 />
                 <button 
                   onClick={handleSendMessage}
                   disabled={isTyping || !inputMessage.trim()}
                   className="absolute right-2 p-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 text-white rounded-lg transition-colors"
                 >
                   <Send size={18} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderTutorials = () => {
    if (selectedTutorial) {
      return (
        <div className="h-full overflow-y-auto p-6 md:p-10">
           <button onClick={() => setSelectedTutorial(null)} className="mb-4 text-brand-500 hover:underline flex items-center">
             &larr; Back to Tutorials
           </button>
           <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">{selectedTutorial.title}</h1>
              <div className="flex space-x-2 mb-6">
                 <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-500">{selectedTutorial.difficulty}</span>
                 <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-500">{selectedTutorial.author}</span>
              </div>
              <MessageRenderer content={selectedTutorial.content} />
           </article>
        </div>
      );
    }
    return (
      <div className="h-full overflow-y-auto p-6 md:p-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Guided Tutorials</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {tutorials.map(t => (
             <div key={t.id} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500 hover:shadow-md transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${t.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' : t.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {t.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-500 transition-colors">{t.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 flex-1">{t.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {t.tags.map(tag => (
                    <span key={tag} className="text-xs text-slate-400">#{tag}</span>
                  ))}
                </div>
                <button onClick={() => setSelectedTutorial(t)} className="w-full py-2 border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white rounded-lg transition-all text-sm font-medium">
                  Start Learning
                </button>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const renderDiagnostics = () => (
    <div className="h-full overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto">
       <div className="mb-8">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AI Diagnostic Engine</h1>
         <p className="text-slate-500">Paste your error logs below. The AI will analyze the stack trace and suggest fixes.</p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]">
          <div className="flex flex-col space-y-4">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Error Log / Stack Trace</label>
             <textarea 
               value={errorLog}
               onChange={(e) => setErrorLog(e.target.value)}
               className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-xs md:text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
               placeholder="Example: TypeError: Cannot read properties of undefined (reading 'map')..."
             />
             <button 
               onClick={handleDiagnosis}
               disabled={isDiagnosing || !errorLog}
               className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
             >
                {isDiagnosing ? <Loader2 className="animate-spin" /> : <Stethoscope />}
                <span>Analyze Error</span>
             </button>
          </div>

          <div className="flex flex-col space-y-4">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Diagnosis Report</label>
             <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 overflow-y-auto shadow-sm">
                {!diagnosticResult ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                      <AlertTriangle size={48} className="mb-4" />
                      <p>Waiting for input...</p>
                   </div>
                ) : (
                   <MessageRenderer content={diagnosticResult} />
                )}
             </div>
          </div>
       </div>
    </div>
  );

  const renderTerminal = () => (
    <div className="h-full overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Terminal Master</h1>
      
      {/* Quick OS Toggle */}
      <div className="flex justify-center space-x-4 mb-10">
         {[OS.Windows, OS.MacOS, OS.Linux].map(os => (
            <button
               key={os}
               onClick={() => setTerminalOS(os)}
               className={`px-6 py-3 rounded-xl border transition-all font-medium ${terminalOS === os ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-500'}`}
            >
              {os}
            </button>
         ))}
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl mb-8">
         <div className="bg-slate-800 px-4 py-2 flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="ml-4 text-xs text-slate-400 font-mono">Terminal Helper ({terminalOS})</div>
         </div>
         <div className="p-6 space-y-4">
            <div className="flex items-center space-x-2 text-brand-400 font-mono">
               <span>$</span>
               <input 
                 type="text" 
                 value={terminalQuery}
                 onChange={(e) => setTerminalQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleTerminalHelp()}
                 className="bg-transparent border-none outline-none text-slate-200 w-full placeholder-slate-600"
                 placeholder="How do I find a file containing 'error'?"
               />
            </div>
            {terminalResult && (
               <div className="pt-4 border-t border-slate-800">
                  <MessageRenderer content={terminalResult} />
               </div>
            )}
         </div>
      </div>

      <div>
         <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Common Commands ({terminalOS})</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TERMINAL_CHEATSHEET.filter(c => c.os.includes(terminalOS)).map((cmd, i) => (
               <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group">
                  <div>
                    <code className="text-brand-600 dark:text-brand-400 font-bold block mb-1">{cmd.cmd}</code>
                    <span className="text-sm text-slate-500">{cmd.desc}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );

  const renderTeacher = () => (
    <div className="h-full overflow-y-auto p-6 md:p-10 max-w-3xl mx-auto">
       <div className="text-center mb-10">
         <div className="inline-flex p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <GraduationCap size={32} />
         </div>
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Teacher Mode</h1>
         <p className="text-slate-500">Generate structured lessons instantly for your students.</p>
       </div>

       <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Lesson Topic</label>
            <input 
               type="text" 
               value={newTutorialTopic}
               onChange={(e) => setNewTutorialTopic(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
               placeholder="e.g., Asynchronous JavaScript, Rust Ownership, SQL Joins"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty Level</label>
             <div className="grid grid-cols-3 gap-4">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setNewTutorialLevel(lvl)}
                    className={`py-2 rounded-lg text-sm font-medium border ${newTutorialLevel === lvl ? 'bg-brand-500 text-white border-brand-500' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-500'}`}
                  >
                    {lvl}
                  </button>
                ))}
             </div>
          </div>

          <button 
            onClick={handleGenerateTutorial}
            disabled={isGeneratingTutorial || !newTutorialTopic}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
             {isGeneratingTutorial ? <Loader2 className="animate-spin" /> : <BookOpen />}
             <span>Generate Curriculum</span>
          </button>
       </div>
    </div>
  );

  const renderSettings = () => (
     <div className="h-full overflow-y-auto p-6 md:p-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Settings & Security</h1>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
           <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center space-x-3">
              <Key className="text-brand-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">API Key Vault</h3>
                <p className="text-xs text-slate-500">Manage keys for external tools safely.</p>
              </div>
           </div>
           <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                 <p><strong>Note:</strong> This vault is a local simulator. In a production app, keys would be encrypted using a KMS (Key Management Service). For this demo, keys are stored in your browser's LocalStorage.</p>
              </div>
              
              <div>
                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">OpenAI / Anthropic Key (Simulation)</label>
                 <div className="flex space-x-2 mt-2">
                    <input type="password" placeholder="sk-..." className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none" />
                    <button className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-700">Save</button>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 p-6">
           <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
           <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">Permanently delete all locally stored chats, tutorials, and progress.</p>
           <button 
             onClick={() => {
                localStorage.clear();
                window.location.reload();
             }}
             className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center space-x-2"
           >
              <Trash2 size={16} />
              <span>Reset Application Data</span>
           </button>
        </div>
     </div>
  );

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === 'dashboard' && renderDashboard()}
      {view === 'chat' && renderChat()}
      {view === 'tutorials' && renderTutorials()}
      {view === 'diagnostics' && renderDiagnostics()}
      {view === 'terminal' && renderTerminal()}
      {view === 'teacher' && renderTeacher()}
      {view === 'settings' && renderSettings()}
    </Layout>
  );
};

export default App;