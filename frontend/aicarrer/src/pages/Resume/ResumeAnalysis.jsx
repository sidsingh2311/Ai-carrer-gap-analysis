import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Target, 
  Compass,
  ArrowRight
} from 'lucide-react';

const ResumeAnalysis = () => {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
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

           
            
            <button 
              onClick={() => setResult(null)} 
              className="flex items-center justify-center w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl shadow-sm transition-colors text-sm"
            >
              <FileText size={18} className="mr-2 text-gray-500" />
              <span>Perform New Analysis</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 pb-40">
      <div className="text-center space-y-4 mb-16 relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-2">
           <Zap size={14} className="text-blue-600" />
           <span className="text-xs font-semibold text-blue-700">AI Powered Process</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Resume <span className="text-blue-600">Intelligence</span></h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">Upload your resume and select your target role for high-precision gap analysis and a personalized learning roadmap.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Target Role</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Lead Technical Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-14 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
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
                className="w-full h-14 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
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
            <div className={`py-16 flex flex-col items-center justify-center space-y-6 transition-all rounded-3xl ${
              file ? 'bg-blue-50' : 'bg-transparent'
            }`}>
              <div className={`p-5 rounded-full shadow-sm transition-all ${
                file ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-gray-200'
              }`}>
                {file ? <CheckCircle2 size={36} /> : <Upload size={36} />}
              </div>
              <div className="text-center space-y-2">
                <p className={`text-xl font-bold ${file ? 'text-blue-900' : 'text-gray-900'}`}>{file ? file.name : 'Upload PDF Resume'}</p>
                <p className="text-sm text-gray-500">{file ? 'Ready for processing' : 'Drag and drop or click to select'}</p>
              </div>
            </div>
          </div>

          {error && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mb-0.5"></div>
                <p className="text-red-700 font-medium text-sm">{error}</p>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !file}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Analyze Profile</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
