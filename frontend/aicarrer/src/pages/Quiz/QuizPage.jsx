import React, { useState } from 'react';
import api from '../../services/api';
import { 
  BrainCircuit, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  RefreshCcw, 
  Zap, 
  Timer,
  ChevronRight
} from 'lucide-react';

const QuizPage = () => {
  const [gameState, setGameState] = useState('setup'); // setup, taking, result
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const generateQuiz = async (e) => {
    e.preventDefault();
    if (!role || !company) return setError('Role and Company are required');

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/quiz/generate', { 
        role, 
        company, 
        skills: skills.split(',').map(s => s.trim()) 
      });
      if (response.data.success) {
        const quizData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data.questions || []);
          
        setQuestions(quizData);
        setUserAnswers(new Array(quizData.length).fill(null));
        setGameState('taking');
      }
    } catch (err) {
      setError('Failed to generate quiz. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIdx) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIdx] = optionIdx;
    setUserAnswers(updatedAnswers);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const response = await api.post('/quiz/evaluate', {
        questions,
        userAnswers,
        role,
        company,
        skills: skills.split(',').map(s => s.trim())
      });
      if (response.data.success) {
        setResult(response.data.data);
        setGameState('result');
      }
    } catch (err) {
      setError('Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setGameState('setup');
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswers([]);
    setResult(null);
  };

  if (loading && gameState === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gray-50">
        <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center animate-pulse shadow-sm">
           <BrainCircuit className="text-blue-600" size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 animate-pulse">Generating Quiz...</h2>
          <p className="text-gray-500 font-medium text-sm">Tailoring questions for {role} at {company}</p>
        </div>
      </div>
    );
  }

  if (gameState === 'taking') {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto px-6 py-16 pb-32 space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Question {currentIdx + 1} of {questions.length}</span>
            <h3 className="text-gray-900 font-bold text-xl">{role} <span className="text-gray-400 font-normal">at</span> {company}</h3>
          </div>
          <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Zap size={120} className="text-blue-600" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed border-l-4 border-blue-500 pl-6 py-2 relative z-10">
            {q.question}
          </h2>

          <div className="grid gap-4 relative z-10">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswerSelect(i)}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 group relative overflow-hidden ${
                  userAnswers[currentIdx] === i 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center font-bold text-sm transition-all ${
                    userAnswers[currentIdx] === i ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={`font-semibold text-base leading-tight transition-colors ${userAnswers[currentIdx] === i ? 'text-blue-900' : 'text-gray-700'}`}>
                    {opt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={nextQuestion}
            disabled={userAnswers[currentIdx] === null || loading}
            className="flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{currentIdx === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 pb-32">
        <div className="p-8 lg:p-16 bg-white border border-gray-200 rounded-3xl text-center space-y-16 shadow-sm">
          
          <div className="space-y-8">
            <div className="relative inline-block mb-6">
               <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                  <Trophy size={64} className="text-blue-600" />
               </div>
               <div className="absolute -bottom-4 -right-4 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xl shadow-sm">
                  {result.percentage}%
               </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Quiz Completed</span>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900">Results</h1>
              <p className="text-gray-500 font-medium text-lg pt-4">Analysis for <span className="text-gray-900 font-bold">{role}</span> at <span className="text-gray-900 font-bold">{company}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
               { label: 'Score', val: `${result.score} / ${result.totalQuestions}`, color: 'text-gray-900' },
               { label: 'Outcome', val: result.percentage >= 70 ? 'Passed' : 'Needs Work', color: result.percentage >= 70 ? 'text-green-600' : 'text-red-600' },
               { label: 'Percentile', val: 'Top 12%', color: 'text-blue-600' }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                 <span className="text-xs font-semibold uppercase text-gray-500 mb-2">{stat.label}</span>
                 <span className={`text-2xl font-bold ${stat.color}`}>{stat.val}</span>
              </div>
            ))}
          </div>

          <div className="space-y-8 pt-8 text-left">
            <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
               <h3 className="text-xl font-bold text-gray-900">Detailed Review</h3>
            </div>
            <div className="grid gap-6">
              {result.result.map((r, i) => (
                <div key={i} className={`p-6 md:p-8 rounded-2xl border transition-all relative ${
                  r.iscorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center mt-1 focus-shrink-0 ${r.iscorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                       {r.iscorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-lg font-semibold text-gray-900 leading-snug">{r.question}</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <span className="text-xs font-semibold text-gray-500">Your Answer</span>
                           <div className={`p-3 rounded-lg text-sm font-medium ${r.iscorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {r.selectedOption || 'N/A'}
                           </div>
                        </div>
                        {!r.iscorrect && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500">Correct Answer</span>
                            <div className="p-3 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-900 shadow-sm">
                               {r.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={resetQuiz} className="flex items-center justify-center w-full py-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl mt-12 transition-colors text-sm">
            <RefreshCcw size={18} className="mr-2" />
            <span>Start New Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 pb-40">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-2">
           <Zap size={14} className="text-blue-600" />
           <span className="text-xs font-semibold text-blue-700">Dynamic Generation</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Technical <span className="text-blue-600">Quiz</span></h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">Generate customized technical assessments to validate your skills for specific roles and companies.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 shadow-md relative overflow-hidden">
        <form onSubmit={generateQuiz} className="space-y-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Target Role</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Senior Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Target Company</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Meta, NVidia"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Key Skills (Comma Separated)</label>
            <textarea 
              rows="3"
              required
              placeholder="e.g. React, Distributed Systems, Rust..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full p-4 bg-gray-50 text-gray-900 text-sm rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
            />
          </div>

          {error && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mb-0.5"></div>
                <p className="text-red-700 font-medium text-sm">{error}</p>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Generate Quiz</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizPage;