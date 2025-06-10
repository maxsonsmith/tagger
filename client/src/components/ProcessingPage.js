import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../App';

const ProcessingPage = () => {
  const { 
    sessionId, 
    apiKey, 
    globalTags, 
    uploadedFiles,
    processingStatus, 
    setProcessingStatus,
    checkSessionStatus,
    fetchResultFiles
  } = useContext(AppContext);
  
  const [isCancelling, setIsCancelling] = useState(false);
  const [processingStarted, setProcessingStarted] = useState(false);
  const navigate = useNavigate();

  // Function to start caption generation
  const startCaptionGeneration = useCallback(async () => {
    if (!sessionId || !apiKey || processingStarted) return;
    
    try {
      setProcessingStarted(true);
      
      const response = await fetch('/api/caption/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          apiKey,
          globalTags,
          maxTokens: 300 // Default max tokens
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start caption generation');
      }
      
      const data = await response.json();
      
      // Update processing status
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: true,
        errors: [...prev.errors, ...(data.errors || [])]
      }));
      
      toast.success('Caption generation started successfully');
      
    } catch (error) {
      console.error('Error starting caption generation:', error);
      toast.error(`Error: ${error.message}`);
      
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        errors: [...prev.errors, { error: error.message }]
      }));
    }
  }, [sessionId, apiKey, globalTags, processingStarted, setProcessingStatus]);
  
  // Function to check processing status periodically
  const pollProcessingStatus = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await checkSessionStatus();
      
      // If processing is complete, navigate to results page
      if (!processingStatus.isProcessing && processingStatus.processedFiles > 0) {
        await fetchResultFiles();
        toast.success('Caption generation completed successfully');
        navigate('/results');
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
    }
  }, [sessionId, processingStatus, checkSessionStatus, fetchResultFiles, navigate]);
  
  // Function to cancel processing
  const handleCancelProcessing = async () => {
    if (!sessionId || isCancelling) return;
    
    setIsCancelling(true);
    
    try {
      // We don't have a direct way to cancel processing, but we can mark it as complete
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      toast.info('Processing cancelled');
      navigate('/results');
    } catch (error) {
      console.error('Error cancelling processing:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Start caption generation when component mounts
  useEffect(() => {
    if (!processingStarted && sessionId && apiKey) {
      startCaptionGeneration();
    }
  }, [processingStarted, sessionId, apiKey, startCaptionGeneration]);
  
  // Poll for status updates
  useEffect(() => {
    if (!sessionId || !processingStatus.isProcessing) return;
    
    // Initial check
    pollProcessingStatus();
    
    // Set up polling interval
    const intervalId = setInterval(pollProcessingStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [sessionId, processingStatus.isProcessing, pollProcessingStatus]);
  
  // Redirect if no session ID
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
    }
  }, [sessionId, navigate]);

  // Calculate time estimates
  const calculateTimeRemaining = () => {
    const { processedFiles, totalFiles } = processingStatus;
    if (processedFiles === 0) return 'Calculating...';
    
    // Estimate based on 5 seconds per image on average
    const remainingFiles = totalFiles - processedFiles;
    const estimatedSecondsRemaining = remainingFiles * 5;
    
    if (estimatedSecondsRemaining < 60) {
      return `About ${estimatedSecondsRemaining} seconds remaining`;
    } else if (estimatedSecondsRemaining < 3600) {
      return `About ${Math.ceil(estimatedSecondsRemaining / 60)} minutes remaining`;
    } else {
      return `About ${Math.ceil(estimatedSecondsRemaining / 3600)} hours remaining`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Processing Images</h1>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress: {processingStatus.progress}%</span>
          <span>
            {processingStatus.processedFiles} of {processingStatus.totalFiles} files
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${processingStatus.progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {calculateTimeRemaining()}
        </p>
      </div>
      
      {/* Status Message */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <div className="flex items-start">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-blue-500 mr-2 mt-0.5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd" 
            />
          </svg>
          <div>
            <h3 className="text-blue-800 font-medium">Processing Information</h3>
            <p className="text-blue-700 text-sm mt-1">
              GPT-4 Turbo is analyzing your images and generating detailed captions based on LoRA tagging guidelines.
              This process may take some time depending on the number and complexity of your images.
            </p>
            {globalTags && (
              <p className="text-blue-700 text-sm mt-2">
                Global tags being applied: <span className="font-mono">{globalTags}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Processing Details */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-2">Processing Details</h2>
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200 text-sm text-gray-600">Session ID</div>
            <div className="p-3 text-sm font-mono">{sessionId}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200 text-sm text-gray-600">Total Files</div>
            <div className="p-3 text-sm">{processingStatus.totalFiles}</div>
          </div>
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200 text-sm text-gray-600">Processed Files</div>
            <div className="p-3 text-sm">{processingStatus.processedFiles}</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="p-3 border-r border-gray-200 text-sm text-gray-600">Status</div>
            <div className="p-3 text-sm">
              {processingStatus.isProcessing ? (
                <span className="text-yellow-600 font-medium">Processing</span>
              ) : (
                <span className="text-green-600 font-medium">Complete</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {processingStatus.errors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Errors</h2>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium mb-2">
              {processingStatus.errors.length} error(s) occurred during processing
            </h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {processingStatus.errors.map((error, index) => (
                <li key={index}>
                  {error.file ? `${error.file}: ${error.error}` : error.error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Upload
        </button>
        
        {processingStatus.isProcessing ? (
          <button
            onClick={handleCancelProcessing}
            disabled={isCancelling}
            className={`px-4 py-2 rounded-md text-white ${
              isCancelling ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Processing'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/results')}
            className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  );
};

export default ProcessingPage;
