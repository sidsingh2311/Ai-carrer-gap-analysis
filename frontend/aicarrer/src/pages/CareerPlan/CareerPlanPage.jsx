import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { careerPlanApi } from '../../services/careerPlanApi';
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Target,
  Award,
  Zap,
  ChevronRight,
  TrendingUp,
  Edit3,
} from 'lucide-react';

const CareerPlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFocus, setEditingFocus] = useState(false);
  const [focusText, setFocusText] = useState('');

  const [formData, setFormData] = useState({
    targetRole: 'Full Stack Engineer',
    targetCompany: 'Google',
    targetTimeline: '3 Months',
    weeklyCommitmentHours: 12,
  });

  const loadPlan = async () => {
    try {
      setLoading(true);
      const res = await careerPlanApi.getPlan();
      if (res?.data) {
        setPlan(res.data);
        setFocusText(res.data.weeklyFocus || '');
      }
    } catch (err) {
      console.error('Failed to load career plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await careerPlanApi.generatePlan(formData);
      if (res?.data) {
        setPlan(res.data);
        setFocusText(res.data.weeklyFocus || '');
        setShowModal(false);
      }
    } catch (err) {
      console.error('Failed to generate plan:', err);
      alert(err.response?.data?.message || 'Plan generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (milestoneId, taskId) => {
    try {
      const res = await careerPlanApi.toggleTask(milestoneId, taskId);
      if (res?.data) {
        setPlan(res.data);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleSaveFocus = async () => {
    try {
      const res = await careerPlanApi.updateWeeklyFocus(focusText);
      if (res?.data) {
        setPlan(res.data);
        setEditingFocus(false);
      }
    } catch (err) {
      console.error('Failed to update weekly focus:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading your personalized career roadmap...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-6 sm:p-10 shadow-lg border border-indigo-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
              <Compass size={14} className="text-yellow-300 animate-spin-slow" />
              <span>AI CAREER ROADMAP</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {plan ? `${plan.targetRole} Execution Plan` : 'Personalized Career Plan'}
            </h1>

            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed">
              {plan
                ? `A 4-phase execution plan targeting ${plan.targetCompany} in ${plan.targetTimeline}, dynamically synchronized with your assessments and Tess Copilot.`
                : 'Generate a step-by-step career plan customized to your target role, dream company, and current skill gaps.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all"
            >
              <Sparkles size={16} className="text-indigo-600" />
              <span>{plan ? 'Regenerate Plan' : 'Create My Plan'}</span>
            </button>

            <button
              onClick={() => navigate('/tess')}
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              <span>Ask Tess</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Plan Dashboard Cards (if plan exists) */}
      {plan ? (
        <>
          {/* Metrics & Weekly Focus Bar */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Progress Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Roadmap Progress</p>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">
                  {plan.progressPercentage}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {plan.completedTasks} of {plan.totalTasks} tasks completed
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                <TrendingUp size={28} />
              </div>
            </div>

            {/* Target Details */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Target Objective</p>
                <div className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[200px]">
                  {plan.targetCompany}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  <span>{plan.targetTimeline} ({plan.weeklyCommitmentHours} hrs/wk)</span>
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
                <Target size={28} />
              </div>
            </div>

            {/* Interview Readiness */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Interview Readiness</p>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {plan.overallReadiness}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Estimated hiring benchmark</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                <Award size={28} />
              </div>
            </div>
          </div>

          {/* Weekly Focus Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border border-indigo-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Zap size={14} className="text-indigo-600" />
                <span>Current Sprint Focus</span>
              </div>
              {editingFocus ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={focusText}
                    onChange={(e) => setFocusText(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white border border-indigo-300 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveFocus}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingFocus(false)}
                    className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-600 text-xs hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-gray-800 text-sm font-medium leading-relaxed">
                  {plan.weeklyFocus}
                </p>
              )}
            </div>
            {!editingFocus && (
              <button
                onClick={() => setEditingFocus(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors shrink-0"
              >
                <Edit3 size={13} />
                <span>Edit Focus</span>
              </button>
            )}
          </div>

          {/* Milestones & Tasks Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Roadmap Milestones</span>
            </h2>

            <div className="space-y-6">
              {plan.milestones.map((milestone) => {
                const isCompleted = milestone.status === 'completed';
                const tasksDone = milestone.tasks.filter((t) => t.isCompleted).length;
                const totalTasks = milestone.tasks.length;

                return (
                  <div
                    key={milestone._id}
                    className={`rounded-3xl border transition-all p-6 sm:p-8 bg-white shadow-sm ${
                      isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {/* Milestone Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}
                          >
                            Phase {milestone.phaseNumber}
                          </span>
                          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <Clock size={12} />
                            <span>Est. {milestone.estimatedWeeks} Weeks</span>
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 pt-1">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-2xl">
                          {milestone.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            {tasksDone} / {totalTasks}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">
                            Tasks Complete
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-700">
                          {totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Tasks Checklist */}
                    <div className="pt-6 space-y-3">
                      {milestone.tasks.map((task) => (
                        <div
                          key={task._id}
                          onClick={() => handleToggleTask(milestone._id, task._id)}
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                            task.isCompleted
                              ? 'bg-gray-50/80 border-gray-200 opacity-75'
                              : 'bg-white border-gray-200/80 hover:border-indigo-300 hover:shadow-2xs'
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 text-indigo-600 shrink-0 transition-transform active:scale-90"
                          >
                            {task.isCompleted ? (
                              <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : (
                              <Circle size={20} className="text-gray-400 hover:text-indigo-600" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4
                                className={`text-sm font-semibold text-gray-900 ${
                                  task.isCompleted ? 'line-through text-gray-500' : ''
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.resourceRecommendation && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                                  <BookOpen size={11} />
                                  <span>{task.resourceRecommendation}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 leading-relaxed">
                              {task.description}
                            </p>

                            {task.skills && task.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {task.skills.map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] font-semibold text-gray-600 px-2 py-0.5 rounded bg-gray-100"
                                  >
                                    #{skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Compass size={40} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-gray-900">No Career Plan Active Yet</h3>
            <p className="text-gray-500 text-sm">
              Let Tess analyze your profile and skill gaps to automatically generate a tailored, 4-phase preparation roadmap.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <Sparkles size={18} />
            <span>Generate My 4-Phase Roadmap</span>
          </button>
        </div>
      )}

      {/* Plan Generation / Regeneration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Configure Your Career Goal</h3>
                <p className="text-xs text-gray-500">Tess will customize the roadmap to your target timeline.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  required
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer / AI Engineer"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Dream Company / Tier
                </label>
                <input
                  type="text"
                  value={formData.targetCompany}
                  onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                  placeholder="e.g. Google, Stripe, High-Growth Startup"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Timeline
                  </label>
                  <select
                    value={formData.targetTimeline}
                    onChange={(e) => setFormData({ ...formData, targetTimeline: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1 Month">1 Month (Sprint)</option>
                    <option value="3 Months">3 Months (Standard)</option>
                    <option value="6 Months">6 Months (Deep)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Weekly Hours
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={60}
                    value={formData.weeklyCommitmentHours}
                    onChange={(e) =>
                      setFormData({ ...formData, weeklyCommitmentHours: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Synthesizing Plan...</span>
                    </>
                  ) : (
                    <span>Generate AI Plan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerPlanPage;
