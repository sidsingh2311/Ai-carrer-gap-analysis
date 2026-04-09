import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import Dashboard from './pages/Dashboard/Dashboard';
import ResumeAnalysis from './pages/Resume/ResumeAnalysis';
import QuizPage from './pages/Quiz/QuizPage';
import ProgressTracker from './pages/Progress/ProgressTracker';
import InterviewPage from './pages/Interview/InterviewPage';
import { Zap, MapPin } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Navbar />
          <main className="relative z-10 min-h-[calc(100vh-160px)]">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/resume" element={
                <ProtectedRoute>
                  <ResumeAnalysis />
                </ProtectedRoute>
              } />
              
              <Route path="/quiz" element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              } />

              <Route path="/interview" element={
                <ProtectedRoute>
                  <InterviewPage />
                </ProtectedRoute>
              } />
              
              <Route path="/progress" element={
                <ProtectedRoute>
                  <ProgressTracker />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          
          <footer className="py-8 bg-white border-t border-gray-200 px-6">
             <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex flex-col items-center md:items-start space-y-2">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Zap size={20} fill="currentColor" />
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                      AI Career Gap
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    &copy; 2026 AI Career Gap. All rights reserved.
                  </p>
               </div>
               
               <div className="flex flex-col items-center md:items-end space-y-4">
                  <a 
                    href="https://github.com/sidsingh2311" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                     <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                     </svg>
                     <span className="font-medium">GitHub</span>
                  </a>

                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                     <MapPin size={16} />
                     <span>Noida, Uttar Pradesh</span>
                  </div>
               </div>
             </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
