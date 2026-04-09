import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, BrainCircuit, LineChart, LogOut, Menu, X, Video } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume AI', path: '/resume', icon: FileText },
    { name: 'Quiz Gen', path: '/quiz', icon: BrainCircuit },
    { name: 'AI Interview', path: '/interview', icon: Video },
    { name: 'Progress', path: '/progress', icon: LineChart },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              CareerGap
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                location.pathname === link.path 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon className={`w-4 h-4 ${location.pathname === link.path ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{link.name}</span>
            </Link>
          ))}

          {user ? (
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200 space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900 leading-none">{user.name}</span>
                <span className="text-xs text-blue-600 mt-1">Online</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors">Sign up</Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 p-4 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 p-3 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.path 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon className={`w-5 h-5 ${location.pathname === link.path ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{link.name}</span>
            </Link>
          ))}

          {user ? (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-md font-medium text-sm transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 pt-4 mt-4 border-t border-gray-100">
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 py-3 font-medium text-sm rounded-md transition-colors">Log in</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="text-center bg-blue-600 hover:bg-blue-700 py-3 rounded-md text-white font-medium text-sm shadow-sm transition-colors">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;