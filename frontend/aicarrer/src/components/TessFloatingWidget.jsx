import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tessApi } from '../services/tessApi';
import {
  Sparkles,
  Bot,
  X,
  Send,
  Loader2,
  Maximize2,
  Brain,
  RotateCcw,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

const TessFloatingWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !initialLoaded && user) {
      loadConversation();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Don't render on auth pages, when logged out, or on the full /tess page
  if (!user || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/tess') {
    return null;
  }

  const loadConversation = async () => {
    try {
      const res = await tessApi.getConversation();
      if (res?.data?.messages) {
        setMessages(res.data.messages);
      }
      setInitialLoaded(true);
    } catch (err) {
      console.error('Failed to load conversation for widget:', err);
      // Fallback greeting
      setMessages([
        {
          role: 'assistant',
          content:
            "Hi! I'm **Tess**, your AI Career Copilot. I remember your resume gaps, quiz scores, and interview performance. Ask me anything or request a personalized study plan!",
          suggestions: [
            {
              title: 'What are my biggest skill gaps?',
              actionType: 'chat',
              actionPayload: { prompt: 'What are my biggest skill gaps right now?' },
            },
            {
              title: 'What should I practice today?',
              actionType: 'chat',
              actionPayload: { prompt: 'What should I practice today based on my past scores?' },
            },
          ],
        },
      ]);
      setInitialLoaded(true);
    }
  };

  const handleSend = async (textToSend = null) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: query, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

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
      }
    } catch (err) {
      console.error('Tess chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I had a problem processing your request. Please try again in a moment.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset this conversation with Tess?')) {
      try {
        await tessApi.resetConversation();
        await loadConversation();
      } catch (err) {
        console.error('Reset failed:', err);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.actionType === 'quiz') {
      setIsOpen(false);
      navigate('/quiz');
    } else if (suggestion.actionType === 'interview') {
      setIsOpen(false);
      navigate('/interview');
    } else if (suggestion.actionType === 'resume') {
      setIsOpen(false);
      navigate('/resume');
    } else if (suggestion.actionPayload?.prompt) {
      handleSend(suggestion.actionPayload.prompt);
    } else if (suggestion.title) {
      handleSend(suggestion.title);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Popover Window */}
      {isOpen && (
        <div className="flex flex-col w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                  <Sparkles size={20} className="animate-spin-slow" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight flex items-center gap-1.5">
                  <span>Tess Copilot</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                    RAG AI
                  </span>
                </h3>
                <p className="text-xs text-indigo-100/80 font-medium">
                  Remembers your resume, quizzes & drills
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/tess');
                }}
                title="Open full Tess Command Center"
                className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-indigo-50/60 border-b border-indigo-100/80 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-gray-400 font-semibold uppercase text-[10px] shrink-0">Quick:</span>
            <button
              onClick={() => handleSend("What are my biggest skill gaps right now?")}
              className="px-2.5 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50 shrink-0 shadow-2xs font-medium"
            >
              My Gaps
            </button>
            <button
              onClick={() => handleSend("What should I practice today based on my scores?")}
              className="px-2.5 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50 shrink-0 shadow-2xs font-medium"
            >
              Today's Focus
            </button>
            <button
              onClick={() => handleSend("How ready am I for my target company?")}
              className="px-2.5 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-50 shrink-0 shadow-2xs font-medium"
            >
              Readiness Check
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/40">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-2xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
                      : 'bg-white border border-gray-200/80 text-gray-800 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Retrieved Memories Citation Badges */}
                  {msg.retrievedMemories && msg.retrievedMemories.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 items-center text-[10px] text-gray-400 font-medium">
                      <Brain size={11} className="text-purple-500 shrink-0" />
                      <span>Used memory:</span>
                      {msg.retrievedMemories.slice(0, 2).map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[160px]"
                        >
                          {m.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Suggested Actions:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSuggestionClick(sug)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs border border-indigo-200/60 transition-colors shadow-2xs"
                          >
                            <Zap size={11} className="text-indigo-600" />
                            <span>{sug.title}</span>
                            <ArrowUpRight size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-gray-400 text-xs py-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span>Tess is thinking and consulting memory vault...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Tess anything or tell her a detail..."
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20"
        >
          {/* Pulsing halo */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse pointer-events-none" />

          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white">
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
          </div>

          <div className="relative text-left pr-1">
            <div className="text-xs font-bold tracking-tight uppercase flex items-center gap-1.5">
              <span>Tess Copilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[10px] text-indigo-100/90 font-medium leading-none mt-0.5">
              Ask AI Mentor
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

export default TessFloatingWidget;
