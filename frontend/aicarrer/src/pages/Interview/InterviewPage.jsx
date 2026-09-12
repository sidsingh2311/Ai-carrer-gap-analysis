import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Mic, MicOff, Send, CheckCircle, AlertCircle, 
  ChevronRight, BrainCircuit, ShieldCheck, User, Zap,
  Play, RotateCcw, Award, Star, Settings, Target,
  Cpu, Layers, Flame, BarChart3, Check, Sparkles
} from 'lucide-react';
import { startInterview, submitAnswer } from '../../services/interview.service';

const PRACTICE_MODES = [
  {
    id: 'star',
    title: 'STAR Behavioral',
    subtitle: 'Situational & Leadership',
    icon: Star,
    badge: 'Popular',
    desc: 'Evaluates Situation, Task, Action, and Result breakdown for behavioral interviews.'
  },
  {
    id: 'technical',
    title: 'Technical Deep-Dive',
    subtitle: 'Code, Design & Edge Cases',
    icon: Cpu,
    desc: 'Probes core computer science, internal framework mechanics, and optimization trade-offs.'
  },
  {
    id: 'system_design',
    title: 'System Design',
    subtitle: 'Architecture & Scale',
    icon: Layers,
    desc: 'Tests high-level scalability, caching, database partitioning, and resilience.'
  },
  {
    id: 'rapid_fire',
    title: 'Rapid Fire Drill',
    subtitle: 'Speed & Fundamentals',
    icon: Flame,
    desc: 'Quick-tempo conceptual queries designed to test recall speed under real pressure.'
  }
];

const InterviewPage = () => {
  const [step, setStep] = useState('setup'); // 'setup', 'interview', 'results'
  const [loading, setLoading] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  
  // Setup form state with persistence
  const [setupForm, setSetupForm] = useState(() => {
    const saved = localStorage.getItem('interview_setup');
    return saved ? JSON.parse(saved) : {
      role: '',
      company: '',
      skills: '',
      level: 'intermediate',
      mode: 'star'
    };
  });

  // Media state
  const [mediaStream, setMediaStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);

  // Persist form data to localStorage
  useEffect(() => {
    localStorage.setItem('interview_setup', JSON.stringify(setupForm));
  }, [setupForm]);

  // Handle video feed assignment
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, step]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      setMediaStream(stream);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Camera and Microphone access are recommended for the AI Interview.');
    }
  };

  const stopMedia = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setUserAnswer('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Recognition start error:', err);
      }
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await startInterview({
        role: setupForm.role,
        company: setupForm.company,
        skills: setupForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        level: setupForm.level,
        mode: setupForm.mode || 'star'
      });
      setInterviewData(data.data);
      setCurrentQuestion(data.data.questions[0]);
      setStep('interview');
      await startMedia();
    } catch (err) {
      console.error(err);
      alert('Error starting interview. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  const inactivityTimerRef = useRef(null);

  // AI Voice: Speak question when currentQuestion changes
  useEffect(() => {
    if (currentQuestion?.question && step === 'interview') {
      const speak = () => {
        setTimeout(() => {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
          const voices = window.speechSynthesis.getVoices();
          utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 500);
      };
      
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
      } else {
        speak();
      }
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentQuestion, step]);

  // Handle auto-submission logic
  useEffect(() => {
    if (step === 'interview' && userAnswer.trim() && !isRecording) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      const isLastQuestion = (interviewData?.currentQuestionIndex || 0) + 1 >= interviewData?.questions?.length;
      const timeoutSecs = isLastQuestion ? 6000 : 7000;

      inactivityTimerRef.current = setTimeout(() => {
        handleSubmitAnswer();
      }, timeoutSecs);
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [userAnswer, isRecording, step]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    window.speechSynthesis.cancel();
    try {
      const result = await submitAnswer({
        interviewId: interviewData._id,
        userAnswer
      });

      setInterviewData(result.interview);

      if (result.completed) {
        setStep('results');
        stopMedia();
      } else {
        setCurrentQuestion(result.nextQuestion);
        setUserAnswer('');
        setIsRecording(false);
        recognitionRef.current?.stop();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute average 5-pillar metrics across all completed questions
  const computePillarAverages = () => {
    if (!interviewData?.questions?.length) return null;
    const answered = interviewData.questions.filter(q => q.metrics);
    if (!answered.length) return null;

    const totals = { accuracy: 0, clarity: 0, structure: 0, completeness: 0, confidence: 0 };
    answered.forEach(q => {
      totals.accuracy += q.metrics.accuracy || 0;
      totals.clarity += q.metrics.clarity || 0;
      totals.structure += q.metrics.structure || 0;
      totals.completeness += q.metrics.completeness || 0;
      totals.confidence += q.metrics.confidence || 0;
    });

    const count = answered.length;
    return {
      accuracy: Math.round((totals.accuracy / count) * 10) / 10,
      clarity: Math.round((totals.clarity / count) * 10) / 10,
      structure: Math.round((totals.structure / count) * 10) / 10,
      completeness: Math.round((totals.completeness / count) * 10) / 10,
      confidence: Math.round((totals.confidence / count) * 10) / 10,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AnimatePresence mode="wait">
        {/* SETUP STEP */}
        {step === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto py-12 px-6 w-full"
          >
            <div className="flex flex-col items-center text-center space-y-3 mb-10">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shadow-xs">
                <Video size={30} className="text-blue-600" />
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                AI Mock <span className="text-blue-600">Interview Studio</span>
              </h1>
              <p className="text-gray-500 font-medium text-base max-w-xl mx-auto">
                Select a focused practice mode, configure your targets, and practice with real-time AI audio questions and 5-pillar recruiter evaluations.
              </p>
            </div>

            {/* PRACTICE MODES SELECTION */}
            <div className="mb-10">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Choose Practice Mode</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PRACTICE_MODES.map((m) => {
                  const Icon = m.icon;
                  const isSelected = (setupForm.mode || 'star') === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSetupForm({ ...setupForm, mode: m.id })}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                      }`}
                    >
                      {m.badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          {m.badge}
                        </span>
                      )}
                      <div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{m.title}</h4>
                        <p className="text-xs font-semibold text-blue-600 mb-2">{m.subtitle}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                        <span className={isSelected ? 'text-blue-700 font-bold' : 'text-gray-400'}>
                          {isSelected ? 'Selected' : 'Select Mode'}
                        </span>
                        {isSelected && <Check size={14} className="text-blue-600 font-bold" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 space-y-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <Settings className="w-5 h-5 text-blue-600" /> Target Details
                </h2>
                <form onSubmit={handleStartInterview} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Target Role</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Frontend Lead"
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 h-11 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={setupForm.role}
                        onChange={(e) => setSetupForm({...setupForm, role: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Target Company</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Stripe, Google"
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 h-11 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={setupForm.company}
                        onChange={(e) => setSetupForm({...setupForm, company: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1">Key Topics & Technologies</label>
                    <input 
                      type="text" 
                      placeholder="e.g. React, Distributed Systems, Web Performance"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 h-11 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={setupForm.skills}
                      onChange={(e) => setSetupForm({...setupForm, skills: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1">Seniority Level</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSetupForm({...setupForm, level: lvl})}
                          className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            setupForm.level === lvl 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Initializing Session...' : 'Launch Live Assessment'}
                    {!loading && <ChevronRight className="w-4 h-4 ml-1" />}
                  </button>
                </form>
              </div>

              {/* Camera Preview */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 space-y-6 flex flex-col justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <Video className="w-5 h-5 text-blue-600" /> Camera & Mic Preview
                </h2>
                <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative shadow-inner group flex-grow">
                  <video 
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && mediaStream) {
                        el.srcObject = mediaStream;
                      }
                    }}
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {!mediaStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 space-y-3 border border-gray-200 rounded-2xl">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                        <Video size={24} className="text-blue-600" />
                      </div>
                      <button 
                        onClick={startMedia}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                      >
                        Enable Camera & Mic Check
                      </button>
                    </div>
                  )}
                  {mediaStream && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <div className="bg-white/95 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Hardware Connected
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-2 text-xs text-blue-900">
                  <p className="font-bold flex items-center gap-1.5 text-blue-800">
                    <Target size={14} /> Evaluation Criteria
                  </p>
                  <p className="text-blue-800/80 leading-relaxed">
                    Responses are evaluated across 5 pillars: Accuracy, Clarity, Structure (STAR adherence), Completeness, and Confidence.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* INTERVIEW IN PROGRESS */}
        {step === 'interview' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow p-6 md:p-8 flex flex-col"
          >
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 flex-grow">
              {/* Left Side: Video & Status */}
              <div className="space-y-5 flex flex-col h-full bg-white border border-gray-200 shadow-sm p-6 rounded-3xl">
                <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                      Interview <span className="text-blue-600">Session</span>
                    </h1>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5 block">
                      Mode: {setupForm.mode?.toUpperCase() || 'STAR'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase text-gray-400">Progress</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(interviewData?.currentQuestionIndex || 0) + 1} / {interviewData?.questions?.length || 3}
                        </p>
                     </div>
                     <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center">
                        <BrainCircuit className="text-blue-600 w-4 h-4" />
                     </div>
                  </div>
                </div>

                <div className="flex-grow bg-gray-900 rounded-2xl overflow-hidden relative shadow-inner min-h-[360px]">
                   <video 
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && mediaStream) {
                          el.srcObject = mediaStream;
                        }
                      }}
                      autoPlay 
                      muted 
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-5 left-5 flex flex-col gap-2">
                      <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gray-200 flex items-center gap-2 shadow-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold text-gray-800">
                          {isRecording ? 'Listening (Voice Transcribing)' : 'Ready'}
                        </span>
                      </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-100 text-red-600' : 'bg-white border border-gray-200 text-gray-500'}`}>
                         {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-gray-900">Audio Transcription</p>
                         <p className={`text-[11px] font-semibold ${isRecording ? 'text-red-500' : 'text-gray-400'}`}>
                           {isRecording ? 'Live recording...' : 'Click resume to transcribe'}
                         </p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={toggleRecording}
                     className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                       isRecording 
                         ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                         : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
                     }`}
                   >
                     {isRecording ? 'Pause Recording' : 'Resume Mic'}
                   </button>
                </div>
              </div>

              {/* Right Side: Question & Answer */}
              <div className="space-y-5 flex flex-col h-full bg-white border border-gray-200 shadow-sm p-6 rounded-3xl">
                 <div className="flex-grow flex flex-col gap-5">
                    <motion.div 
                      key={currentQuestion?.question}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-blue-50 text-blue-900 p-6 rounded-2xl relative border border-blue-100 shadow-xs"
                    >
                       <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2 block">
                         Interviewer Prompt
                       </span>
                       <h2 className="text-lg md:text-xl font-bold leading-snug">
                          {currentQuestion?.question}
                       </h2>
                    </motion.div>

                    <div className="flex-grow flex flex-col bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-xs relative min-h-[280px]">
                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                          Your Answer Transcript (Spoken or Typed)
                        </label>
                        <textarea
                          placeholder="Speak into microphone or type your answer here..."
                          className="flex-grow bg-white border border-gray-200 rounded-xl p-4 text-gray-800 font-medium text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                        />
                        <div className="mt-4 flex items-center justify-between">
                           <span className="text-[11px] text-gray-400">
                             Auto-submits after 7 seconds of pause
                           </span>
                           <button 
                              type="button"
                              onClick={handleSubmitAnswer}
                              disabled={loading || !userAnswer.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                           >
                              {loading ? 'Evaluating...' : 'Submit Answer'}
                              <Send size={14} />
                           </button>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS & 5-PILLAR ANALYTICS STEP */}
        {step === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto py-12 px-6 space-y-10 w-full"
          >
            {/* Header */}
            <div className="text-center space-y-4">
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
               >
                  <Award size={40} className="text-blue-600" />
               </motion.div>
               <div>
                 <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-1">
                   Assessment <span className="text-blue-600">Scorecard</span>
                 </h1>
                 <p className="text-gray-500 font-medium text-base">
                   Performance diagnostics for {setupForm.role} ({setupForm.mode?.toUpperCase()} Mode)
                 </p>
               </div>
            </div>

            {/* 5-PILLAR SCORECARD SUMMARY */}
            {(() => {
              const pillars = computePillarAverages();
              if (!pillars) return null;
              const pillarCards = [
                { key: 'accuracy', label: 'Technical Accuracy', val: pillars.accuracy, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                { key: 'clarity', label: 'Clarity & Delivery', val: pillars.clarity, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                { key: 'structure', label: 'Structure (STAR)', val: pillars.structure, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                { key: 'completeness', label: 'Completeness', val: pillars.completeness, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { key: 'confidence', label: 'Confidence', val: pillars.confidence, color: 'text-amber-600 bg-amber-50 border-amber-100' },
              ];

              return (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">5-Pillar Competency Index</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {pillarCards.map((p) => (
                      <div key={p.key} className={`p-4 rounded-2xl border ${p.color} text-center space-y-1`}>
                        <div className="text-3xl font-black">{p.val}<span className="text-xs text-gray-400">/10</span></div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-700">{p.label}</div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-current h-full rounded-full" 
                            style={{ width: `${p.val * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* DETAILED QUESTION BREAKDOWN */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Per-Question Recruiter Analysis</h3>
              <div className="space-y-6">
                {interviewData?.questions?.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    key={index}
                    className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
                  >
                    {/* Top Row: Q# and Score */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          Q{index + 1}
                        </span>
                        <h4 className="font-bold text-gray-900 text-base">{item.question}</h4>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-lg font-black text-blue-950">{item.score || 0}/10</span>
                        <span className="text-xs text-gray-500 font-semibold">Overall</span>
                      </div>
                    </div>

                    {/* Metric Badges if present */}
                    {item.metrics && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                          Accuracy: {item.metrics.accuracy}/10
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                          Clarity: {item.metrics.clarity}/10
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                          Structure: {item.metrics.structure}/10
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                          Completeness: {item.metrics.completeness}/10
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                          Confidence: {item.metrics.confidence}/10
                        </span>
                      </div>
                    )}

                    {/* STAR Breakdown Grid if present */}
                    {item.starBreakdown && (item.starBreakdown.situation || item.starBreakdown.action) && (
                      <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 p-5 rounded-2xl border border-indigo-100 space-y-3">
                        <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Target size={14} />
                          <span>STAR Method Adherence Breakdown</span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-white rounded-xl border border-indigo-50">
                            <span className="font-bold text-indigo-900 block mb-1">Situation (S)</span>
                            <p className="text-gray-600">{item.starBreakdown.situation || 'Not clearly established'}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-indigo-50">
                            <span className="font-bold text-indigo-900 block mb-1">Task (T)</span>
                            <p className="text-gray-600">{item.starBreakdown.task || 'Needs clearer objective'}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-indigo-50">
                            <span className="font-bold text-indigo-900 block mb-1">Action (A)</span>
                            <p className="text-gray-600">{item.starBreakdown.action || 'Specific individual action missing'}</p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-indigo-50">
                            <span className="font-bold text-indigo-900 block mb-1">Result (R)</span>
                            <p className="text-gray-600">{item.starBreakdown.result || 'Quantifiable outcome missing'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recruiter Feedback & Ideal Answer */}
                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <h5 className="text-xs font-bold uppercase text-blue-700">Recruiter Feedback</h5>
                        <p className="text-gray-700 text-xs leading-relaxed">{item.feedback}</p>
                      </div>
                      <div className="space-y-1 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <h5 className="text-xs font-bold uppercase text-emerald-800">Target Benchmark Output</h5>
                        <p className="text-gray-700 text-xs leading-relaxed italic">{item.idealAnswer || 'Benchmark not available'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <button 
                type="button"
                onClick={() => { setStep('setup'); setInterviewData(null); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                Practice Another Mode
              </button>
              <button 
                type="button"
                onClick={() => window.location.href = '/dashboard'}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-8 py-3.5 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-colors text-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-gray-500" />
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewPage;
