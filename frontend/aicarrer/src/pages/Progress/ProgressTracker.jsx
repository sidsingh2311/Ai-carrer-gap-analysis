import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  History, 
  Award, 
  AlertCircle,
  Loader2,
  Calendar,
  Zap
} from 'lucide-react';

const ProgressTracker = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.get('/progress/dashboard');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Progress data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-6">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <Loader2 className="text-blue-600 animate-spin" size={32} />
           </div>
           <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Loading Progress...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.trend?.length) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center mt-12 bg-white rounded-3xl border border-gray-200 space-y-10 shadow-sm">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <History className="text-blue-600" size={40} />
        </div>
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">No Assessment History</span>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">Your Journey Starts Here</h2>
          <p className="text-gray-500 font-medium max-w-md mx-auto text-base">You haven't completed any assessments yet. Begin your initialization sequence to populate this matrix.</p>
        </div>
        <div className="flex justify-center flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => window.location.href = '/quiz'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-sm transition-all text-sm"
            >
              Start an Assessment
            </button>
            <button 
              onClick={() => window.location.href = '/resume'}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-bold shadow-sm transition-all text-sm"
            >
              Upload Resume
            </button>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.trend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.percentage
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-20 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-200 pb-10">
        <div className="space-y-4">
           <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold tracking-wider">
              <History size={14} />
              <span>Performance Dashboard</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Progress <span className="text-blue-600">Overview</span>
           </h1>
           <p className="text-gray-500 font-medium max-w-2xl text-lg pt-2">Track your assessment history, interview metrics, and skill evolution.</p>
        </div>
        <div className="flex items-center space-x-4 px-6 py-4 bg-white border border-gray-200 rounded-2xl w-fit shadow-sm">
           <Zap size={24} className="text-blue-500" />
           <span className="text-sm font-bold tracking-widest text-gray-700 uppercase">Live Metrics</span>
        </div>
      </header>

      {/* Block Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Average Score', value: `${data.overallPercentage?.toFixed(1)}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Highest Score', value: `${data.highestscore}%`, icon: Award, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Lowest Score', value: `${data.lowestscore}%`, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Assessments Taken', value: `${data.trend?.length || 0}`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' }
        ].map((card, i) => (
          <div key={i} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-xl ${card.bg} ${card.color} border ${card.border}`}>
                <card.icon size={24} />
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{card.label}</p>
            <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Performance Chart Block */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 lg:p-12 space-y-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                 <TrendingUp className="text-blue-600" size={20} />
              </div>
              <span>Score Trajectory</span>
            </h3>
            <p className="text-gray-500 text-sm font-medium ml-14">Your performance across recent assessments.</p>
          </div>
          <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 uppercase shadow-sm">
            <Calendar size={16} className="text-gray-500" />
            <span>Last {chartData.length} Assessments</span>
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '4 4' }}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '12px',
                }}
                itemStyle={{ color: '#2563eb', fontSize: '14px', fontWeight: 'bold' }}
                labelStyle={{ color: '#4b5563', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area 
                isAnimationActive={true}
                animationDuration={1500}
                type="monotone" 
                dataKey="score" 
                stroke="#2563eb" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                activeDot={{ r: 6, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Table Block */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 lg:p-12 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <History className="text-blue-600" size={24} />
                <span>Recent Assessments</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                    <th className="py-4 pl-4">Date</th>
                    <th className="py-4">Role & Company</th>
                    <th className="py-4 text-center">Score</th>
                    <th className="py-4 text-right pr-4">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.trend.slice().reverse().map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-6 pl-4">
                        <div className="font-semibold text-gray-900">{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </td>
                      <td className="py-6">
                         <div className="flex flex-col space-y-1">
                            <span className="font-bold text-gray-900">{item.role || 'General Assessment'}</span>
                            <span className="text-sm text-gray-500">{item.company || 'Not Specified'}</span>
                         </div>
                      </td>
                      <td className="py-6 text-center">
                        <div className="inline-flex flex-col items-center">
                           <span className="font-bold text-gray-900">{item.percentage}%</span>
                           <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                              <div className={`h-full transition-all ${item.percentage >= 70 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${item.percentage}%` }}></div>
                           </div>
                        </div>
                      </td>
                      <td className="py-6 text-right pr-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.percentage >= 70 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.percentage >= 70 ? 'Passed' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
