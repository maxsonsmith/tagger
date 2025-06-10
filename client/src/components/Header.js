import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../App';

const Header = () => {
  const { sessionId, startNewSession } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Function to determine if a nav link is active
  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-500';
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-blue-600 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-xl font-bold text-gray-800">LoRA Caption Generator</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`${isActive('/')} transition-colors duration-200`}>
              Upload
            </Link>
            {sessionId && (
              <>
                <Link to="/processing" className={`${isActive('/processing')} transition-colors duration-200`}>
                  Processing
                </Link>
                <Link to="/results" className={`${isActive('/results')} transition-colors duration-200`}>
                  Results
                </Link>
              </>
            )}
            <Link to="/settings" className={`${isActive('/settings')} transition-colors duration-200`}>
              Settings
            </Link>
            {sessionId && (
              <button 
                onClick={startNewSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                New Session
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-3 pb-3">
            <Link 
              to="/" 
              className={`block ${isActive('/')}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Upload
            </Link>
            {sessionId && (
              <>
                <Link 
                  to="/processing" 
                  className={`block ${isActive('/processing')}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Processing
                </Link>
                <Link 
                  to="/results" 
                  className={`block ${isActive('/results')}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Results
                </Link>
              </>
            )}
            <Link 
              to="/settings" 
              className={`block ${isActive('/settings')}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
            {sessionId && (
              <button 
                onClick={() => {
                  startNewSession();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                New Session
              </button>
            )}
          </nav>
        )}

        {/* Session ID display */}
        {sessionId && (
          <div className="mt-2 text-xs text-gray-500">
            Session ID: <span className="font-mono">{sessionId}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
