import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/progress/dashboard');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
           <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
           <span className="text-sm font-medium text-gray-500">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const cards = [
    { 
      title: 'Current Efficiency', 
      value: stats?.overallPercentage ? `${stats.overallPercentage.toFixed(1)}%` : '0%', 
      icon: Trophy, 
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    { 
      title: 'Missions Complete', 
      value: stats?.totalQuiz || 0, 
      icon: Zap, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    { 
      title: 'Apex Performance', 
      value: stats?.highestscore ? `${stats.highestscore}%` : '0%', 
      icon: Target, 
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100'
    },
    { 
      title: 'Operational Days', 
      value: stats?.daysActive || '1', 
      icon: Clock, 
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-md">
             <Trophy size={14} className="text-blue-600" />
             <span className="text-xs font-medium text-blue-700">Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
             Welcome back, <span className="text-blue-600">{user?.name || 'Explorer'}</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm">
           <div className="w-2 h-2 rounded-full bg-green-500"></div>
           <span className="text-sm font-medium text-gray-600">System Online</span>
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow ${card.border}`}>
            <div className={`p-3 w-fit rounded-lg ${card.bg} ${card.color} mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Action Nodes */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Target size={180} className="text-blue-600" />
            </div>
            <div className="p-8 lg:p-10 space-y-8 relative z-10">
               <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">Resume AI Analysis</h2>
                  <p className="text-gray-600 max-w-md leading-relaxed text-sm"> Identify technical gaps between your profile and global standards. Upload your resume for deep neural scanning. </p>
               </div>
               <Link 
                to="/resume" 
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-fit"
              >
                <span>Launch Analysis</span>
                <ArrowUpRight size={18} className="ml-2" />
              </Link>
            </div>
            <div className="px-8 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
               <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium">
                 <CheckCircle2 size={16} className="text-green-500" />
                 <span>Compliance Subsystem Active</span>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 space-y-8 shadow-sm hover:shadow-md transition-shadow group">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6">
               <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">Dynamic Quiz Generator</h2>
                  <p className="text-gray-600 max-w-sm text-sm leading-relaxed">Generate role-specific challenges to validate your skill matrices effectively.</p>
               </div>
               <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Zap size={24} />
               </div>
             </div>
             <Link 
              to="/quiz" 
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors w-auto md:w-fit"
            >
              <span>Initialize Assessment</span>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 space-y-8 shadow-sm hover:shadow-md transition-shadow group">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6">
               <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">AI Mock Interview</h2>
                  <p className="text-gray-600 max-w-sm text-sm leading-relaxed">Practice with our advanced AI interviewer to refine your verbal technical responses.</p>
               </div>
               <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Target size={24} />
               </div>
             </div>
             <Link 
              to="/interview" 
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors w-auto md:w-fit"
            >
              <span>Start Interview</span>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Clock size={20} className="text-gray-400" />
              <span>Skill Vectors</span>
            </h3>
            
            <div className="space-y-3">
              {[
                { title: 'Backend Skills', desc: 'System Design Patterns', status: 'Pending', color: 'bg-blue-500' },
                { title: 'Cloud Arch', desc: 'GCP Prof Arch', status: 'Active', color: 'bg-indigo-500' },
                { title: 'Python Prof', desc: 'Score < 70%', status: 'Critical', color: 'bg-red-500' }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center transition-colors hover:bg-gray-100 cursor-pointer">
                  <div className={`w-1 h-8 rounded-full ${item.color} mr-3`}></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate leading-none mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link to="/progress" className="block w-full text-center mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View Full History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;