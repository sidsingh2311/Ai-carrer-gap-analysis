import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tessApi } from '../../services/tessApi';
import {
  Sparkles,
  Bot,
  Brain,
  MessageSquare,
  Compass,
  Database,
  Send,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  FileText,
  RotateCcw,
  Search,
} from 'lucide-react';

const TessPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'vault' | 'strategy'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Memory Vault state
  const [memories, setMemories] = useState([]);
  const [memoryStats, setMemoryStats] = useState(null);
  const [vaultFilter, setVaultFilter] = useState('all');
  const [vaultSearch, setVaultSearch] = useState('');
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Add memory modal/form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    category: 'user_preference',
    tags: '',
    importance: 7,
  });

  // Strategy / Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversation();
    loadMemories();
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const loadConversation = async () => {
    try {
      setLoadingChat(true);
      const res = await tessApi.getConversation();
      if (res?.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const loadMemories = async () => {
    try {
      setLoadingMemories(true);
      const res = await tessApi.getMemories();
      if (res?.data) {
        setMemories(res.data.memories || []);
        setMemoryStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await tessApi.getSuggestions();
      if (res?.data?.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendMessage = async (textOverride = null) => {
    const query = (textOverride || input).trim();
    if (!query || loadingChat) return;

    setInput('');
    const userMsg = { role: 'user', content: query, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoadingChat(true);

    try {
      const res = await tessApi.chat(query);
      if (res?.success && res.data) {
        const assistantMsg = {
          role: 'assistant',
          content: res.data.reply,
          retrievedMemories: res.data.retrievedMemories || [],
          suggestions: res.data.suggestions || [],
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        // Refresh memories and suggestions after chat in case new notes were recorded
        loadMemories();
        loadSuggestions();
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I ran into a temporary error processing your request. Please try again.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSyncHistory = async () => {
    try {
      setSyncing(true);
      setSyncSuccess('');
      const res = await tessApi.syncHistory();
      setSyncSuccess(res?.message || 'Sync successful!');
      await Promise.all([loadMemories(), loadSuggestions()]);
      setTimeout(() => setSyncSuccess(''), 4000);
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleResetChat = async () => {
    if (window.confirm('Reset this conversation history with Tess? (Your stored memories will be preserved)')) {
      try {
        await tessApi.resetConversation();
        await loadConversation();
      } catch (err) {
        console.error('Reset error:', err);
      }
    }
  };

  const handleAddMemorySubmit = async (e) => {
    e.preventDefault();
    if (!newMemory.title || !newMemory.content) return;

    try {
      await tessApi.addMemory(newMemory);
      setNewMemory({
        title: '',
        content: '',
        category: 'user_preference',
        tags: '',
        importance: 7,
      });
      setShowAddModal(false);
      await loadMemories();
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (window.confirm('Are you sure you want Tess to forget this memory?')) {
      try {
        await tessApi.deleteMemory(id);
        await loadMemories();
      } catch (err) {
        console.error('Delete memory error:', err);
      }
    }
  };

  const handleActionChip = (sug) => {
    if (sug.actionType === 'quiz') {
      navigate('/quiz');
    } else if (sug.actionType === 'interview') {
      navigate('/interview');
    } else if (sug.actionType === 'resume') {
      navigate('/resume');
    } else if (sug.actionPayload?.prompt) {
      setActiveTab('chat');
      handleSendMessage(sug.actionPayload.prompt);
    } else if (sug.title) {
      setActiveTab('chat');
      handleSendMessage(sug.title);
    }
  };

  // Filtered memories
  const filteredMemories = memories.filter((m) => {
    const matchesCategory =
      vaultFilter === 'all' ||
      (vaultFilter === 'resume' && (m.category === 'resume_profile' || m.category === 'skill_gap')) ||
      (vaultFilter === 'quiz' && m.category === 'quiz_performance') ||
      (vaultFilter === 'interview' && m.category === 'interview_feedback') ||
      (vaultFilter === 'goals' && (m.category === 'career_goal' || m.category === 'user_preference'));

    const matchesSearch =
      !vaultSearch ||
      m.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      m.content.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      (m.tags && m.tags.some((t) => t.toLowerCase().includes(vaultSearch.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-10 shadow-lg border border-indigo-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
              <Sparkles size={14} className="text-yellow-300 animate-spin-slow" />
              <span>PERSISTENT RAG COPILOT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">Tess</span>, Your AI Career Copilot
            </h1>

            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
              Tess retains memory of your uploaded resumes, technical gaps, quiz attempts, and mock interview drills to guide your daily journey toward your dream role.
            </p>

            {syncSuccess && (
              <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                <CheckCircle2 size={14} />
                <span>{syncSuccess}</span>
              </div>
            )}
          </div>

          {/* Quick Header Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <div className="text-2xl font-bold text-white leading-none">
                {memoryStats?.total ?? memories.length}
              </div>
              <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider mt-1">
                Memories Vaulted
              </div>
            </div>

            <button
              onClick={handleSyncHistory}
              disabled={syncing}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Indexing...' : 'Sync History'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
          }`}
        >
          <MessageSquare size={16} />
          <span>Chat Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'vault'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
          }`}
        >
          <Database size={16} />
          <span>Tess Memory Vault</span>
          {memories.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'vault' ? 'bg-indigo-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {memories.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'strategy'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
          }`}
        >
          <Compass size={16} />
          <span>Daily Strategy & Suggestions</span>
        </button>
      </div>

      {/* TAB 1: CHAT COPILOT */}
      {activeTab === 'chat' && (
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Chat Stream */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
            {/* Chat Sub-Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Tess Interactive Session</h3>
                  <p className="text-xs text-gray-500">
                    Retrieving from {memories.length} personal memory vectors
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetChat}
                title="Reset conversation messages"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset Chat</span>
              </button>
            </div>

            {/* Quick Prompts Carousel */}
            <div className="p-3 bg-indigo-50/40 border-b border-indigo-100/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-gray-400 uppercase font-semibold text-[10px] shrink-0">Try Asking:</span>
              {[
                "What are my critical skill gaps right now?",
                "Suggest a 7-day study schedule for my target role",
                "How should I structure my STAR behavioral answers?",
                "Which quiz should I take next to improve my score?",
                "Remember that I am studying for 2 hours every evening",
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50 shrink-0 shadow-2xs font-medium transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/30">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xs'
                    }`}
                  >
                    {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() || 'U' : <Sparkles size={14} />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Cited Memories Badges */}
                    {msg.retrievedMemories && msg.retrievedMemories.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5 items-center text-xs text-gray-400">
                        <Brain size={12} className="text-purple-500 shrink-0" />
                        <span className="font-semibold text-[11px]">Grounded in:</span>
                        {msg.retrievedMemories.map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-medium truncate max-w-[200px]"
                          >
                            {m.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interactive Action Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3.5 pt-2.5 border-t border-gray-100 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Recommended Actions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleActionChip(sug)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors shadow-2xs"
                            >
                              <Zap size={12} className="text-indigo-600" />
                              <span>{sug.title}</span>
                              <ArrowUpRight size={12} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex items-center space-x-3 text-gray-400 text-xs py-3 pl-11">
                  <Loader2 size={18} className="animate-spin text-indigo-600" />
                  <span>Tess is analyzing your profile vectors and formulating an answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-4 bg-white border-t border-gray-100 flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Tess for advice, or tell her a detail to remember (e.g., 'Remember that I am learning Docker')..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loadingChat || !input.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm shadow-sm transition-all disabled:opacity-40 flex items-center space-x-2"
              >
                <span>Send</span>
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Right Sidebar: Memory Highlights & Copilot Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                <Brain size={18} className="text-indigo-600" />
                <span>Memory Footprint</span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tess continuously indexes facts from your app activity so your advice is always grounded in your actual skills and progress.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Resume & Gaps</span>
                  <span className="font-bold text-indigo-600">{memoryStats?.resumeGaps || 0}</span>
                </div>
                <div className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Quiz Records</span>
                  <span className="font-bold text-purple-600">{memoryStats?.quizzes || 0}</span>
                </div>
                <div className="flex justify-between text-xs py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Mock Interviews</span>
                  <span className="font-bold text-teal-600">{memoryStats?.interviews || 0}</span>
                </div>
                <div className="flex justify-between text-xs py-1.5">
                  <span className="text-gray-500">Stated Preferences</span>
                  <span className="font-bold text-amber-600">{memoryStats?.goalsAndNotes || 0}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('vault')}
                className="w-full text-center py-2.5 mt-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-indigo-600 text-xs font-semibold border border-gray-200 transition-colors"
              >
                Inspect Memory Vault
              </button>
            </div>

            {/* Quick Tell Tess Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <Sparkles size={16} />
                <span>Teaching Tess</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Want Tess to remember something specific? Type <code className="px-1.5 py-0.5 bg-white rounded border border-indigo-200 text-indigo-700 font-mono text-[11px]">Remember that...</code> in chat or click below to store a direct fact!
              </p>
              <button
                onClick={() => {
                  setActiveTab('vault');
                  setShowAddModal(true);
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus size={14} />
                <span>Add Custom Memory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMORY VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Filter Bar & Search */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Memories' },
                { id: 'resume', label: 'Resume & Gaps' },
                { id: 'quiz', label: 'Quiz Scores' },
                { id: 'interview', label: 'Interview Logs' },
                { id: 'goals', label: 'Goals & Preferences' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVaultFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    vaultFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  placeholder="Search memories..."
                  className="pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors shrink-0"
              >
                <Plus size={14} />
                <span>Add Fact</span>
              </button>
            </div>
          </div>

          {/* Memories Cards Grid */}
          {loadingMemories ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              <span className="text-sm">Retrieving memory vault...</span>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Database size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Memories Found</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Tess hasn't stored any memories matching this filter yet. Upload a resume, take a quiz, or add a custom fact!
              </p>
              <button
                onClick={handleSyncHistory}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw size={14} />
                <span>Sync Past Activities</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemories.map((mem) => {
                const getCategoryStyle = () => {
                  switch (mem.category) {
                    case 'resume_profile':
                    case 'skill_gap':
                      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
                    case 'quiz_performance':
                      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
                    case 'interview_feedback':
                      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
                    case 'career_goal':
                    case 'user_preference':
                      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
                    default:
                      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                  }
                };

                const style = getCategoryStyle();

                return (
                  <div
                    key={mem._id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {mem.category.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => handleDeleteMemory(mem._id)}
                          title="Forget this memory"
                          className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h4 className="font-bold text-gray-900 text-base leading-snug">
                        {mem.title}
                      </h4>

                      <p className="text-gray-600 text-xs leading-relaxed">
                        {mem.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {(mem.tags || []).slice(0, 3).map((t, tIdx) => (
                          <span key={tIdx} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span className="shrink-0 font-medium">
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Memory Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Add Fact to Tess's Vault</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleAddMemorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Title / Summary
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemory.title}
                      onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                      placeholder="e.g., Target Role: Senior Backend Engineer at Netflix"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={newMemory.category}
                      onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    >
                      <option value="user_preference">Personal Preference / Schedule</option>
                      <option value="career_goal">Career Goal / Target Company</option>
                      <option value="skill_gap">Known Technical Weakness</option>
                      <option value="resume_profile">Skill / Project Experience</option>
                      <option value="conversation_note">General Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Full Details / Context
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newMemory.content}
                      onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                      placeholder="e.g., I have 3 years of hands-on Go and PostgreSQL experience. I struggle most with distributed caching and system design trade-offs."
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newMemory.tags}
                      onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                      placeholder="golang, postgresql, netflix, system design"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
                    >
                      Store in Vault
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAILY STRATEGY & SUGGESTIONS */}
      {activeTab === 'strategy' && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
              <Compass size={18} />
              <span>Tess Proactive Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Personalized Recommendations for Today
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
              These suggestions are dynamically synthesized by analyzing your target role, known resume skill gaps, and recent quiz and interview scores.
            </p>
          </div>

          {loadingSuggestions ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              <span className="text-sm">Synthesizing personalized strategy...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                          sug.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {sug.priority} Priority
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target size={18} />
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg leading-snug">
                      {sug.title}
                    </h3>

                    <p className="text-gray-600 text-sm leading-relaxed">
                      {sug.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleActionChip(sug)}
                    className="w-full inline-flex items-center justify-center space-x-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Launch Action</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TessPage;
