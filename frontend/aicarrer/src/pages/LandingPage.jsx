import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, Zap, Target, BarChart3, Shield } from 'lucide-react';
import heroImg from '../assets/hero_vibrant.png';

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "Career Blueprint Analysis",
      description: "Extract architectural patterns from your career history with machine precision. Tailored for Tier-1 engineering benchmarks.",
      icon: Target,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Adaptive Simulation",
      description: "Dynamic assessment modules that evolve based on your target role and skill density. Validate your tactical readiness.",
      icon: Zap,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Roadmap Optimization",
      description: "Linear roadmap generation designed to bridge technical gaps. Every step is a calculated move toward your objective.",
      icon: BarChart3,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
    }
  ];

  const steps = [
    { title: "Upload Resume", desc: "Binary PDF ingestion of your technical history", color: "bg-blue-500" },
    { title: "Define Objective", desc: "Select target organization and vector role", color: "bg-indigo-500" },
    { title: "Map Gaps", desc: "Identify missing skill matrices and core competencies", color: "bg-purple-500" },
    { title: "Execute Growth", desc: "Iterative validation via adaptive simulations", color: "bg-teal-500" }
  ];

  return (
    <div className="flex flex-col space-y-24 pb-32">
      {/* High-Impact Hero Section */}
      <section className="relative overflow-hidden pt-16 lg:pt-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-8">
            <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 w-fit">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">New Feature: AI Mock Interviews</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
                Accelerate <br />
                <span className="text-blue-600">Your Career</span> <br/>
                Trajectory.
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Autonomous career optimization for ambitious professionals. We automate your growth using deep analysis and targeted mock interviews.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {user ? (
                <Link to="/dashboard" className="inline-flex justify-center items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-xl shadow-sm transition-colors group">
                  <span>Access Dashboard</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="inline-flex justify-center items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-xl shadow-sm transition-colors group">
                    <span>Get Started</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2" />
                  </Link>
                  <Link to="/login" className="inline-flex justify-center items-center px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-base font-medium rounded-xl shadow-sm transition-colors">
                    <span>Log In</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="relative group">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100 transition-all duration-700 hover:shadow-3xl bg-white">
               <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-500">app.platform.com</div>
               </div>
               <img 
                 src={heroImg} 
                 alt="Platform Interface" 
                 className="w-full h-auto object-cover"
               />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Powerful targeted tools</h2>
            <p className="text-gray-600 text-lg">
              Enterprise-grade infrastructure designed for elite performance in your job search and technical interviews.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Protocol Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-blue-50 rounded-3xl p-8 lg:p-16 grid lg:grid-cols-2 gap-16 items-center border border-blue-100">
          <div className="space-y-8">
             <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">How it works</h2>
                <p className="text-gray-600 text-lg">
                  A simple four-step process to bridge your career gaps and land your dream role.
                </p>
             </div>
             <div className="grid gap-6 mt-8">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start">
                    <div className={`w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center font-bold shrink-0 shadow-sm mt-1`}>
                      {i + 1}
                    </div>
                    <div className="ml-5">
                       <h4 className="text-xl font-bold text-gray-900">{step.title}</h4>
                       <p className="text-gray-600 mt-2">{step.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 p-4">
             <div className="space-y-6 pt-12">
                <div className="aspect-square bg-white rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg hover:-translate-y-2 transition-transform cursor-pointer border border-gray-100">
                  <Zap className="text-blue-600 mb-4" size={32} />
                  <span className="font-semibold text-gray-900">Velocity</span>
                </div>
                <div className="aspect-square bg-white rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg hover:-translate-y-2 transition-transform cursor-pointer border border-gray-100">
                  <Target className="text-indigo-600 mb-4" size={32} />
                  <span className="font-semibold text-gray-900">Precision</span>
                </div>
             </div>
             <div className="space-y-6">
                <div className="aspect-square bg-white rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg hover:-translate-y-2 transition-transform cursor-pointer border border-gray-100">
                  <Shield className="text-teal-600 mb-4" size={32} />
                  <span className="font-semibold text-gray-900">Integrity</span>
                </div>
                <div className="aspect-square bg-white rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg hover:-translate-y-2 transition-transform cursor-pointer border border-gray-100">
                  <CheckCircle2 className="text-purple-600 mb-4" size={32} />
                  <span className="font-semibold text-gray-900">Value</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6">
        <div className="max-w-4xl mx-auto py-16 px-10 bg-blue-600 rounded-3xl text-center space-y-8 shadow-xl text-white">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-white">Ready to take the next step?</h2>
            <p className="text-blue-100 text-lg">Join ambitious professionals who are leveling up their technical skills everyday.</p>
          </div>
          <div className="flex justify-center pt-2">
             {user ? (
               <Link to="/dashboard" className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 rounded-xl font-bold shadow-sm transition-colors">
                 Go to Dashboard
               </Link>
             ) : (
               <Link to="/register" className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 rounded-xl font-bold shadow-sm transition-colors">
                 Create Free Account
               </Link>
             )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
