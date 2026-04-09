import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Mic, MicOff, Send, CheckCircle, AlertCircle, 
  ChevronRight, BrainCircuit, ShieldCheck, User, Zap,
  Play, RotateCcw, Award, Star, Settings
} from 'lucide-react';
import { startInterview, submitAnswer } from '../../services/interview.service';

const InterviewPage = () => {
  const [step, setStep] = useState('setup'); // 'setup', 'interview', 'evaluating', 'results'
  const [loading, setLoading] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluationResults, setEvaluationResults] = useState(null);
  
  // Setup form state with persistence
  const [setupForm, setSetupForm] = useState(() => {
    const saved = localStorage.getItem('interview_setup');
    return saved ? JSON.parse(saved) : {
      role: '',
      company: '',
      skills: '',
      level: 'intermediate'
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
  }, [mediaStream, step]); // Re-run when stream is ready or step changes

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
      alert('Camera and Microphone access are required for the AI Interview.');
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
        skills: setupForm.skills.split(',').map(s => s.trim()),
        level: setupForm.level
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
        // Small delay to ensure browser speech engine is ready after transition
        setTimeout(() => {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
          
          // Get available voices and pick a professional one if possible
          const voices = window.speechSynthesis.getVoices();
          utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
          
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 500);
      };
      
      // Handle the case where voices are loaded asynchronously
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

  // Handle auto-submission logic (7 seconds for questions, 6 seconds for final)
  useEffect(() => {
    if (step === 'interview' && userAnswer.trim() && !isRecording) {
      // Clear existing timer
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
    window.speechSynthesis.cancel(); // Stop speaking if submitting
    try {
      const result = await submitAnswer({
        interviewId: interviewData._id,
        userAnswer
      });

      // Update the interview data state with the latest from the backend
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-5xl mx-auto py-16 px-6 w-full"
          >
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                <Video size={32} className="text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                AI <span className="text-blue-600">Interview Setup</span>
              </h1>
              <p className="text-gray-500 font-medium text-lg max-w-xl mx-auto">Configure your mock interview parameters to begin the assessment.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 pl-2">
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 space-y-6 flex-1">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <Settings className="w-5 h-5 text-blue-600" /> Interview Parameters
                </h2>
                <form onSubmit={handleStartInterview} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Target Role</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Senior Dev"
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 h-12 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                          value={setupForm.role}
                          onChange={(e) => setSetupForm({...setupForm, role: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Target Company</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Google"
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 h-12 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                          value={setupForm.company}
                          onChange={(e) => setSetupForm({...setupForm, company: e.target.value})}
                          required
                        />
                      </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Core Competencies</label>
                    <input 
                      type="text" 
                      placeholder="e.g. React, Node.js, System Design"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 h-12 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                      value={setupForm.skills}
                      onChange={(e) => setSetupForm({...setupForm, skills: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Complexity Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSetupForm({...setupForm, level: lvl})}
                          className={`py-3 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all ${
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {loading ? 'Initializing...' : 'Start Interview'}
                    {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
                  </button>
                </form>
              </div>

              <div className="space-y-6 flex-1 flex flex-col">
                <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 space-y-6 flex-grow flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-4">
                    <Video className="w-5 h-5 text-blue-600" /> Camera Preview
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 space-y-4 border border-gray-200 rounded-2xl">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                          <Video size={24} className="text-blue-600" />
                        </div>
                        <button 
                          onClick={startMedia}
                          className="text-sm font-bold text-blue-600 hover:text-blue-700 underline transition-colors"
                        >
                          Enable Camera Feed
                        </button>
                      </div>
                    )}
                    {mediaStream && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <div className="bg-white/90 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-blue-100 shadow-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Feed Active
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-3">
                    <h3 className="text-sm font-bold text-blue-800">Tips for success</h3>
                    <ul className="space-y-2">
                      {[
                        'Ensure you have good natural lighting',
                        'Maintain eye contact with your camera',
                        'Speak clearly to ensure accurate transcription',
                        'Review answers before submission'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-blue-900 leading-snug">
                          <span className="text-blue-500 shrink-0 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'interview' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow p-6 md:p-10 flex flex-col"
          >
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 flex-grow">
              {/* Left Side: Video & Status */}
              <div className="space-y-6 flex flex-col h-full bg-white border border-gray-200 shadow-sm p-6 rounded-3xl">
                <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Interview <span className="text-blue-600">Session</span>
                    </h1>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 block">Recording Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="text-right">
                        <p className="text-xs font-semibold uppercase text-gray-400">Question</p>
                        <p className="text-sm font-bold text-gray-900">{(interviewData?.currentQuestionIndex || 0) + 1} / {interviewData?.questions?.length}</p>
                     </div>
                     <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center">
                        <BrainCircuit className="text-blue-600 w-5 h-5" />
                     </div>
                  </div>
                </div>

                <div className="flex-grow bg-gray-900 rounded-2xl overflow-hidden relative shadow-inner min-h-[400px]">
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
                    <div className="absolute top-6 left-6 flex flex-col gap-3">
                      <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 flex items-center gap-2 shadow-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-xs font-bold text-gray-800">
                          {isRecording ? 'Listening' : 'Ready'}
                        </span>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isRecording && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-3 rounded-full shadow-sm flex items-center gap-2"
                        >
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [8, h * 6, 8] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                className="w-1 bg-blue-600 rounded-full"
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-100 text-red-600 shadow-sm' : 'bg-white border border-gray-200 text-gray-500'}`}>
                         {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-gray-900">Transcription Audio</p>
                         <p className={`text-xs font-semibold ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
                           {isRecording ? 'Capturing your voice' : 'Microphone paused'}
                         </p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={toggleRecording}
                     className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                       isRecording 
                         ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                         : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
                     }`}
                   >
                     {isRecording ? 'Pause Recording' : 'Resume'}
                   </button>
                </div>
              </div>

              {/* Right Side: Question & Answer */}
              <div className="space-y-6 flex flex-col h-full bg-white border border-gray-200 shadow-sm p-6 rounded-3xl">
                 <div className="flex-grow flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                       <motion.div 
                          key={currentQuestion?.question}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-blue-50 text-blue-900 p-8 rounded-2xl relative group border border-blue-100 shadow-sm"
                        >
                           <div className="relative z-10 flex flex-col space-y-3">
                              <h2 className="text-xl md:text-2xl font-bold leading-snug">
                                 {currentQuestion?.question}
                              </h2>
                           </div>
                        </motion.div>
                    </div>

                    <div className="flex-grow flex flex-col bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm relative min-h-[300px]">
                        <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Your Response Transcript</label>
                        <textarea
                          placeholder="Speak into the microphone and your response will appear here..."
                          className="flex-grow bg-white border border-gray-200 rounded-xl p-4 text-gray-800 font-medium text-base focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none shadow-sm"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                        />
                        <div className="mt-4 flex items-center justify-end">
                           <button 
                              type="button"
                              onClick={handleSubmitAnswer}
                              disabled={loading || !userAnswer.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:active:scale-100"
                           >
                              {loading ? 'Submitting...' : 'Submit Answer'}
                              <Send size={16} className="translate-y-[-1px]" />
                           </button>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto py-16 px-6 space-y-12 w-full"
          >
            <div className="text-center space-y-6">
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto shadow-sm"
               >
                  <Award size={48} className="text-blue-600" />
               </motion.div>
               <div>
                 <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-2">
                   Interview <span className="text-blue-600">Complete</span>
                 </h1>
                 <p className="text-gray-500 font-medium text-lg">Detailed performance review for your {setupForm.role} mock interview.</p>
               </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {interviewData?.questions?.map((item, index) => (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.1 }}
                   key={index}
                   className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                 >
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                       <div className="space-y-1">
                          <span className="text-xs font-bold uppercase text-gray-400 block">Score</span>
                          <div className="flex items-center gap-1.5">
                             <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                             <span className="text-2xl font-bold text-gray-900">{item.score || 0}<span className="text-gray-400 text-lg">/10</span></span>
                          </div>
                       </div>
                       <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                          Q{index + 1}
                       </div>
                    </div>

                    <div className="space-y-2 flex-grow">
                       <h3 className="text-xs font-bold uppercase text-gray-500">Question</h3>
                       <p className="font-semibold text-gray-900 text-base leading-snug">{item.question}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                       <div className="space-y-1">
                          <h3 className="text-xs font-bold uppercase text-blue-600">Feedback</h3>
                          <p className="text-gray-700 text-sm leading-relaxed">{item.feedback}</p>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                          <h3 className="text-xs font-bold uppercase text-gray-500">Ideal Output</h3>
                          <p className="text-xs font-medium text-gray-600 leading-relaxed italic">{item.idealAnswer || "Ideal answer not available."}</p>
                       </div>
                    </div>
                 </motion.div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
               <button 
                 type="button"
                 onClick={() => window.location.href = '/dashboard'}
                 className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-xl font-bold shadow-sm flex items-center gap-3 transition-colors text-sm"
               >
                 <RotateCcw className="w-5 h-5 text-gray-500" />
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
