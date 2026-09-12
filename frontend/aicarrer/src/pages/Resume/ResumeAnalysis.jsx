import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import applicationApi from '../../services/applicationApi';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Target, 
  Compass,
  ArrowRight,
  Briefcase,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const ResumeAnalysis = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'jd_match'
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [jdResult, setJdResult] = useState(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savingApp, setSavingApp] = useState(false);
  const [appSaved, setAppSaved] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a PDF file');
      setFile(null);
    }
  };

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!file || !role || !company) return setError('All fields are required');

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', role);
    formData.append('companyName', company);

    try {
      const response = await api.post('/analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleJdSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription || jobDescription.trim().length < 30) {
      return setError('Please paste a job description with at least 30 characters');
    }

    setLoading(true);
    setError('');
    setAppSaved(false);
    const formData = new FormData();
    if (file) formData.append('resume', file);
    formData.append('targetRole', role || 'Target Role');
    formData.append('companyName', company || 'Target Company');
    formData.append('jobDescription', jobDescription);

    try {
      const res = await applicationApi.matchJobDescription(formData);
      if (res.success) {
        setJdResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Job description matching failed. Make sure you upload a resume or have analyzed one before.');
    } finally {
      setLoading(false);
    }
  };

  const copyBullet = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleSaveToTracker = async () => {
    if (!jdResult) return;
    setSavingApp(true);
    try {
      await applicationApi.createApplication({
        company: company || 'Target Company',
        role: role || 'Target Role',
        matchScore: jdResult.matchScore || 0,
        jobDescription: jobDescription,
        status: 'applied',
        notes: `ATS Match: ${jdResult.matchScore}% (${jdResult.fitVerdict}). ${jdResult.summary || ''}`
      });
      setAppSaved(true);
    } catch (err) {
      console.error('Failed to save to application tracker:', err);
    } finally {
      setSavingApp(false);
    }
  };

  // RENDER JD MATCH RESULTS
  if (jdResult) {
    const isHigh = jdResult.matchScore >= 75;
    const isMed = jdResult.matchScore >= 50 && jdResult.matchScore < 75;

    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24">
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-200 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500"></div>
          
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <Sparkles size={14} className="text-indigo-600" />
              <span>ATS Job Description Match Complete</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              ATS Match & Keyword Diagnostics
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Comparing profile against <span className="text-indigo-600 font-bold">{role || 'Target Role'}</span> at <span className="text-indigo-600 font-bold">{company || 'Target Company'}</span>
            </p>
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center min-w-[140px]">
              <div className={`text-4xl md:text-5xl font-black tracking-tight ${
                isHigh ? 'text-emerald-600' : isMed ? 'text-blue-600' : 'text-amber-600'
              }`}>
                {jdResult.matchScore}%
              </div>
              <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">ATS Score</div>
              <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isHigh ? 'bg-emerald-100 text-emerald-800' : isMed ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {jdResult.fitVerdict}
              </span>
            </div>
          </div>
        </header>

        {/* Action Row: Save to tracker */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-2xl">
          <div className="flex items-center space-x-3">
            <Briefcase className="w-5 h-5 text-indigo-600 shrink-0" />
            <p className="text-sm font-medium text-gray-800">
              {appSaved ? 'Successfully saved to your job pipeline!' : 'Track this job in your Application Kanban Board with this match score.'}
            </p>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {appSaved ? (
              <button
                onClick={() => navigate('/applications')}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Check size={16} />
                <span>View in Application Tracker</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSaveToTracker}
                disabled={savingApp}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase size={15} />}
                <span>Save to Application Tracker</span>
              </button>
            )}
            <button
              onClick={() => setJdResult(null)}
              className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        {jdResult.summary && (
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Zap size={16} className="text-indigo-600" />
              <span>AI Fit Evaluation</span>
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{jdResult.summary}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Matched vs Missing Skills */}
          <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Verified Skill Overlap</span>
            </h2>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Matched in Your Profile</h4>
                <div className="flex flex-wrap gap-2">
                  {jdResult.matchedSkills?.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                      ✓ {skill}
                    </span>
                  ))}
                  {(!jdResult.matchedSkills || jdResult.matchedSkills.length === 0) && (
                    <span className="text-gray-400 text-xs">No direct keyword matches detected.</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Missing / Unmentioned in Profile</h4>
                <div className="flex flex-wrap gap-2">
                  {jdResult.missingSkills?.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                      ✕ {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ATS Keyword Diagnostic */}
          <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Critical ATS Scanner Keywords</span>
            </h2>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {jdResult.atsKeywords?.map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${kw.inResume ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-sm font-semibold text-gray-800">{kw.keyword}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      kw.importance === 'High' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {kw.importance || 'Medium'} Priority
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      kw.inResume ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {kw.inResume ? 'Found' : 'Missing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Bullet Point Tailoring Suggestions */}
        {jdResult.bulletPointSuggestions && jdResult.bulletPointSuggestions.length > 0 && (
          <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-700 mb-2">
                <Sparkles size={14} className="text-purple-600" />
                <span>XYZ Formula Resume Bullet Optimizer</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Tailored Resume Bullet Suggestions</h2>
              <p className="text-gray-500 text-sm">Drop these high-impact lines directly into your resume work experience section to satisfy ATS filters.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {jdResult.bulletPointSuggestions.map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200 space-y-4 hover:border-indigo-300 transition-all shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                      {item.skill}
                    </span>
                    <button
                      onClick={() => copyBullet(item.optimizedBullet, idx)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span>{copiedIndex === idx ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Target Bullet:</div>
                    <p className="text-sm text-gray-900 font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-200 font-mono text-[13px]">
                      • {item.optimizedBullet}
                    </p>
                  </div>

                  {item.rationale && (
                    <div className="text-xs text-gray-500 italic pt-2 border-t border-gray-100">
                      💡 {item.rationale}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setJdResult(null)}
            className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-sm text-sm transition-all cursor-pointer"
          >
            Run Another Match
          </button>
        </div>
      </div>
    );
  }

  // RENDER STANDARD GAP ANALYSIS RESULTS
  if (result) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-200 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <FileText size={160} className="text-blue-600" />
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
               <Zap size={14} className="text-blue-600" />
               <span>Analysis Complete</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Intelligence Report</h1>
            <p className="text-gray-500 text-sm font-medium">Targeting <span className="text-blue-600 font-bold">{role}</span> at <span className="text-blue-600 font-bold">{company}</span></p>
          </div>
          <div className="text-left md:text-right relative z-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="text-4xl md:text-5xl font-bold text-blue-600 tracking-tight">{result.matchScore}%</div>
            <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Match Score</div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Skills & Gaps */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-200 p-8 rounded-3xl space-y-8 shadow-sm">
              <div className="flex items-center space-x-3 border-l-4 border-blue-500 pl-4 py-1">
                <h2 className="text-2xl font-bold text-gray-900">Critical Gaps</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {result.gapAnalysis.map((gap, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 hover:shadow-md hover:border-gray-200 transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-lg text-gray-900">{gap.skill}</h4>
                      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${
                        gap.importance === 'High' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {gap.importance} Priority
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">"{gap.reason}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-3xl space-y-8 shadow-sm">
              <div className="flex items-center space-x-3 border-l-4 border-indigo-500 pl-4 py-1">
                <h2 className="text-2xl font-bold text-gray-900">Action Plan Roadmap</h2>
              </div>
              <div className="relative pl-12 space-y-12 before:content-[''] before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-200">
                {result.roadmap.map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[48px] top-1 w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shadow-sm z-10">
                       {i + 1}
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">{step.step}</h4>
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Readiness & Resources */}
          <div className="space-y-8">
            <div className="p-8 bg-blue-600 rounded-3xl shadow-md space-y-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
                 <Target size={140} className="text-white" />
              </div>
              <div className="space-y-2 relative z-10">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Interview Readiness</span>
                <h3 className="text-3xl font-bold text-white">{result.interviewReadiness.level}</h3>
              </div>
              <p className="text-blue-50 text-sm leading-relaxed relative z-10 border-t border-blue-500/30 pt-6">"{result.interviewReadiness.notes}"</p>
            </div>

            <Link
              to="/career-plan"
              className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-3xl shadow-md transition-all group"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Personalized Roadmap</div>
                <div className="text-lg font-bold">Generate Career Plan</div>
                <div className="text-xs text-indigo-100 mt-1">Convert gaps into 4 weekly milestone sprints</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button 
              onClick={() => setResult(null)} 
              className="flex items-center justify-center w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl shadow-sm transition-colors text-sm cursor-pointer"
            >
              <FileText size={18} className="mr-2 text-gray-500" />
              <span>Perform New Analysis</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: TABBED FORM (Standard vs JD Match)
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 pb-40">
      <div className="text-center space-y-4 mb-10 relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-2">
           <Zap size={14} className="text-blue-600" />
           <span className="text-xs font-semibold text-blue-700">AI Powered Process</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Resume & JD <span className="text-blue-600">Intelligence</span>
        </h1>
        <p className="text-gray-600 text-base max-w-xl mx-auto">
          Audit your profile against specific job expectations, optimize ATS keyword density, and generate tailored resume bullets.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200/80 p-1.5 rounded-2xl mb-8 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => { setActiveTab('standard'); setError(''); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'standard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText size={16} className={activeTab === 'standard' ? 'text-blue-600' : ''} />
          <span>Role Gap Analysis</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('jd_match'); setError(''); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'jd_match'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles size={16} className={activeTab === 'jd_match' ? 'text-indigo-600' : ''} />
          <span>ATS JD Matcher</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-lg">
        {activeTab === 'standard' ? (
          /* STANDARD FORM */
          <form onSubmit={handleStandardSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Target Role</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Lead Technical Architect"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-13 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Target Company</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google, Microsoft, Apple"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full h-13 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="relative group p-1 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-3xl transition-colors bg-gray-50">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className={`py-12 flex flex-col items-center justify-center space-y-4 transition-all rounded-3xl ${
                file ? 'bg-blue-50' : 'bg-transparent'
              }`}>
                <div className={`p-4 rounded-full shadow-sm transition-all ${
                  file ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-gray-200'
                }`}>
                  {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                </div>
                <div className="text-center space-y-1">
                  <p className={`text-base font-bold ${file ? 'text-blue-900' : 'text-gray-900'}`}>
                    {file ? file.name : 'Upload PDF Resume'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file ? 'Ready for processing' : 'Drag & drop or click to browse'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !file}
              className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Analyze Role Fit</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* JD MATCHER FORM */
          <form onSubmit={handleJdSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Target Role</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Backend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Target Company</label>
                <input 
                  type="text" 
                  placeholder="e.g. Stripe, Amazon"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 ml-1">Paste Job Description (JD)</label>
                <span className="text-xs text-gray-400">Min 30 chars</span>
              </div>
              <textarea
                required
                rows={7}
                placeholder="Paste the requirements, responsibilities, and required qualifications from LinkedIn, Indeed, or career portal..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full p-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none leading-relaxed"
              />
            </div>

            {/* Optional Resume Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 ml-1">Resume PDF (Optional if analyzed before)</label>
              <div className="relative group p-1 border border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl transition-colors bg-gray-50">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="py-4 px-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      {file ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {file ? file.name : 'Upload New Resume PDF'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {file ? 'Selected' : 'Or AI will pull your saved profile from Tess Memory'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 hover:underline">
                    Browse
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !jobDescription}
              className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Run ATS Keyword & Match Diagnostics</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalysis;
