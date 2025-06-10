import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components (these will be created in subsequent files)
import Header from './components/Header';
import Footer from './components/Footer';
import UploadPage from './components/UploadPage';
import ProcessingPage from './components/ProcessingPage';
import ResultsPage from './components/ResultsPage';
import SettingsPage from './components/SettingsPage';
import NotFoundPage from './components/NotFoundPage';

// Create context for global state
export const AppContext = createContext();

function App() {
  // State management
  const [sessionId, setSessionId] = useState(localStorage.getItem('currentSessionId') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('openaiApiKey') || '');
  const [globalTags, setGlobalTags] = useState(localStorage.getItem('globalTags') || '');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({
    isProcessing: false,
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    errors: []
  });
  const [resultFiles, setResultFiles] = useState({
    imageFiles: [],
    captionFiles: [],
    downloadLinks: {}
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Save important state to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('currentSessionId', sessionId);
    }
    if (apiKey) {
      localStorage.setItem('openaiApiKey', apiKey);
    }
    if (globalTags) {
      localStorage.setItem('globalTags', globalTags);
    }
  }, [sessionId, apiKey, globalTags]);

  // Check session status when app loads or when sessionId changes
  useEffect(() => {
    if (sessionId) {
      checkSessionStatus();
    }
  }, [sessionId]);

  // Function to check current session status
  const checkSessionStatus = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/caption/status/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Session not found, reset session
          setSessionId('');
          localStorage.removeItem('currentSessionId');
          toast.error('Session not found or expired');
          navigate('/');
        }
        return;
      }
      
      const data = await response.json();
      
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: !data.isComplete && data.totalImages > 0,
        progress: data.progress,
        totalFiles: data.totalImages,
        processedFiles: data.processedImages
      }));
      
      // If processing is complete, fetch result files
      if (data.isComplete && data.totalImages > 0) {
        fetchResultFiles();
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  // Function to fetch result files
  const fetchResultFiles = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/download/status/${sessionId}`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      setResultFiles({
        imageFiles: data.imageFiles || [],
        captionFiles: data.captionFiles || [],
        downloadLinks: data.downloadLinks || {}
      });
    } catch (error) {
      console.error('Error fetching result files:', error);
    }
  };

  // Function to start a new session
  const startNewSession = () => {
    setSessionId('');
    setUploadedFiles([]);
    setProcessingStatus({
      isProcessing: false,
      progress: 0,
      totalFiles: 0,
      processedFiles: 0,
      errors: []
    });
    setResultFiles({
      imageFiles: [],
      captionFiles: [],
      downloadLinks: {}
    });
    localStorage.removeItem('currentSessionId');
    navigate('/');
  };

  // Context value for global state
  const contextValue = {
    sessionId,
    setSessionId,
    apiKey,
    setApiKey,
    globalTags,
    setGlobalTags,
    uploadedFiles,
    setUploadedFiles,
    processingStatus,
    setProcessingStatus,
    resultFiles,
    setResultFiles,
    checkSessionStatus,
    fetchResultFiles,
    startNewSession
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              sessionId && processingStatus.isProcessing ? 
                <Navigate to="/processing" /> : 
                sessionId && resultFiles.captionFiles.length > 0 ? 
                  <Navigate to="/results" /> : 
                  <UploadPage />
            } />
            <Route path="/processing" element={
              !sessionId ? <Navigate to="/" /> : <ProcessingPage />
            } />
            <Route path="/results" element={
              !sessionId ? <Navigate to="/" /> : <ResultsPage />
            } />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        <Footer />
        
        {/* Toast notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </AppContext.Provider>
  );
}

export default App;
