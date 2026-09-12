import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tessApi } from '../services/tessApi';
import { 
  Sparkles, 
  Bot, 
  ArrowRight, 
  BrainCircuit, 
  CheckCircle, 
  Loader2, 
  Zap, 
  RefreshCw 
} from 'lucide-react';

const TessDashboardCard = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [memoryStats, setMemoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  const loadTessData = async () => {
    try {
      setLoading(true);
      const [sugRes, memRes] = await Promise.all([
        tessApi.getSuggestions().catch(() => ({ data: { suggestions: [] } })),
        tessApi.getMemories().catch(() => ({ data: { stats: {} } })),
      ]);

      if (sugRes?.data?.suggestions) {
        setSuggestions(sugRes.data.suggestions);
      }
      if (memRes?.data?.stats) {
        setMemoryStats(memRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load Tess dashboard card:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTessData();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await tessApi.syncHistory();
      await loadTessData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const topSuggestion = (Array.isArray(suggestions) && suggestions.length > 0) ? suggestions[0] : {
    title: 'Personalized Skill Deep-Dive',
    description: 'Tess is analyzing your latest assessments. Start a chat with Tess to plan your next milestone.',
    actionType: 'chat',
    actionPayload: { prompt: 'What should I prioritize this week?' },
    priority: 'High',
  };

  const handleAction = () => {
    if (topSuggestion.actionType === 'quiz') {
      navigate('/quiz');
    } else if (topSuggestion.actionType === 'interview') {
      navigate('/interview');
    } else if (topSuggestion.actionType === 'resume') {
      navigate('/resume');
    } else {
      navigate('/tess');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Tess Identity & Recommendation */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold tracking-wide border border-indigo-200/60">
              <Sparkles size={13} className="text-indigo-600 animate-pulse" />
              <span>TESS AI COPILOT</span>
            </div>

            <div className="inline-flex items-center space-x-1 text-xs text-gray-500 font-medium">
              <BrainCircuit size={14} className="text-purple-500" />
              <span>
                {memoryStats?.total !== undefined
                  ? `${memoryStats.total} Memories Indexed`
                  : 'Continuous RAG Active'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>{topSuggestion.title}</span>
              {topSuggestion.priority === 'High' && (
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  Priority Focus
                </span>
              )}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {topSuggestion.description}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Resume Gaps: {memoryStats?.resumeGaps || 0}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              <span>Quiz Milestones: {memoryStats?.quizzes || 0}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <BrainCircuit size={14} className="text-indigo-500" />
              <span>Interview Logs: {memoryStats?.interviews || 0}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <button
            onClick={handleAction}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all group"
          >
            <span>Take Action</span>
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-2">
            <Link
              to="/tess"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs shadow-2xs transition-colors"
            >
              <Bot size={14} className="mr-1.5 text-indigo-600" />
              <span>Open Tess Hub</span>
            </Link>

            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync latest activities into Tess memory"
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin text-indigo-600' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TessDashboardCard;
