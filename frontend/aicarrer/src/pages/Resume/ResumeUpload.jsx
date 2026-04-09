import React, { useState } from 'react';
import { 
  CloudUpload, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  Zap,
  ArrowRight,
  ShieldCheck,
  Upload,
  AlertTriangle,
  BrainCircuit
} from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Initializing Neural Ingestion...');
    setResult(null);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setStatus('Mapping Skill Matrices...');
      const response = await api.post('/analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setStatus('Analysis Complete');
        setResult(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process the resume. Please try again.');
      setStatus('Idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 pb-24">
      <header className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-md shadow-sm">
           <ShieldCheck size={14} className="text-blue-600" />
           <span className="text-xs font-medium text-blue-700">Resume AI Analysis</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
           Upload your <br />
           <span className="text-blue-600">Resume</span>
        </h1>
        <p className="text-gray-600 max-w-lg text-base leading-relaxed">
          Upload your technical artifact for deep architectural mapping and vector optimization.  
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Upload Zone */}
        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-8">
           <div 
             className={`relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
               file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
             }`}
           >
              <input 
                type="file" 
                onChange={handleFileChange}
                accept=".pdf"
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />
              <div className="flex flex-col items-center space-y-3 text-center px-6 relative z-10">
                 <div className={`p-4 rounded-full ${file ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 shadow-sm border border-gray-100'} transition-all`}>
                    <Upload size={24} />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">
                       {file ? file.name : 'Click or drag PDF to upload'}
                    </h3>
                    <p className="text-xs text-gray-500">{file ? 'Ready to analyze' : 'Max file size 5MB'}</p>
                 </div>
              </div>
           </div>

           <div className="flex flex-col space-y-4">
              <button 
                onClick={handleUpload}
                disabled={!file || loading}
                className={`flex items-center justify-center w-full py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${(!file || loading) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Analyze Resume</span>
                )}
              </button>
              
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg">
                 <span className="text-xs font-semibold text-gray-500">Status:</span>
                 <span className={`text-xs font-medium text-gray-700 ${loading ? 'animate-pulse text-blue-600' : ''}`}>{status}</span>
              </div>
           </div>

           {error && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center space-x-3 mt-4">
                <AlertTriangle className="text-red-500 shrink-0" size={18} />
                <span className="text-sm font-medium text-red-700">{error}</span>
             </div>
           )}
        </div>

        {/* Info / Specs */}
        <div className="space-y-6">
           <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-600">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Analysis Details</h3>
              <div className="space-y-3">
                 {[
                    { label: 'File Type', val: 'PDF ONLY', color: 'text-blue-600' },
                    { label: 'Engine version', val: 'v4', color: 'text-gray-900' },
                    { label: 'Privacy', val: 'Confidential', color: 'text-green-600' }
                 ].map((spec, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 last:pb-0">
                       <span className="text-sm font-medium text-gray-500">{spec.label}</span>
                       <span className={`text-sm font-bold ${spec.color}`}>{spec.val}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                 <Zap size={16} className="text-blue-600" fill="currentColor" />
                 <span className="text-sm font-bold text-blue-800">Pro Tip</span>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">
                 Deep architectural mapping includes gap detection, skill validation, and roadmap vector optimization based on modern industry standards.
              </p>
           </div>
        </div>
      </div>

      {/* Analysis Output Section */}
      {result && (
         <div className="bg-white border border-gray-200 shadow-lg p-8 lg:p-10 rounded-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden mt-12">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <BrainCircuit size={120} className="text-blue-600" />
            </div>
            
            <div className="flex items-center space-x-3 border-l-4 border-blue-600 pl-4 py-1 relative z-10">
               <h2 className="text-2xl font-bold text-gray-900">Analysis Output</h2>
               <CheckCircle2 className="text-green-500 ml-auto" size={24} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 relative z-10">
               <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl h-full space-y-4">
                  <span className="text-sm font-bold text-gray-900">Identified Strengths</span>
                  <div className="flex flex-wrap gap-2">
                     {result.skills?.map((skill, i) => (
                       <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-semibold shadow-sm">
                          {skill}
                       </span>
                     ))}
                  </div>
               </div>

               <div className="p-6 bg-red-50 border border-red-100 rounded-xl h-full space-y-4">
                  <span className="text-sm font-bold text-red-800">Target Deficits</span>
                  <div className="flex flex-wrap gap-2">
                     {result.gaps?.map((gap, i) => (
                       <span key={i} className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded-md text-xs font-semibold shadow-sm">
                          {gap}
                       </span>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-4 relative z-10">
               <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Core Synthesis</span>
               <p className="text-lg font-medium text-blue-900 leading-relaxed italic">
                  "{result.summary}"
               </p>
               <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <Link to="/quiz" className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors group">
                     <span>Execute Validation Quiz</span>
                     <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/dashboard" className="inline-flex justify-center items-center px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg shadow-sm transition-colors">
                     <span>Return to Dashboard</span>
                  </Link>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ResumeUpload;
