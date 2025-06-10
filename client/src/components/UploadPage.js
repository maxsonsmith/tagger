import React, { useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { AppContext } from '../App';

const UploadPage = () => {
  const { 
    sessionId, 
    setSessionId, 
    apiKey, 
    setApiKey, 
    globalTags, 
    setGlobalTags, 
    uploadedFiles, 
    setUploadedFiles,
    setProcessingStatus
  } = useContext(AppContext);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [folderMode, setFolderMode] = useState(false);
  const navigate = useNavigate();

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create FormData object
      const formData = new FormData();
      
      // Add files to FormData
      if (folderMode) {
        acceptedFiles.forEach(file => {
          // Preserve folder structure in file names
          formData.append('images', file, file.path || file.name);
        });
      } else {
        acceptedFiles.forEach(file => {
          formData.append('images', file);
        });
      }
      
      // Set up headers
      const headers = {};
      if (sessionId) {
        headers['X-Session-ID'] = sessionId;
      }
      
      // Upload files
      const response = await fetch(`/api/upload/${folderMode ? 'folder' : 'multiple'}`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update session ID if not set
      if (!sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Update uploaded files
      setUploadedFiles(prev => [
        ...prev,
        ...(data.files || []).map(file => ({
          name: file.originalname,
          path: file.path,
          size: file.size,
          type: file.mimetype
        }))
      ]);
      
      toast.success(`Successfully uploaded ${data.files?.length || 0} files`);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  }, [sessionId, setSessionId, setUploadedFiles, folderMode]);
  
  // Configure dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive 
  } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    },
    multiple: true,
    noClick: isUploading,
    noDrag: isUploading,
    noKeyboard: isUploading,
    useFsAccessApi: true,
    webkitDirectory: folderMode,
    preventDropOnDocument: true
  });
  
  // Handle API key change
  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };
  
  // Handle global tags change
  const handleGlobalTagsChange = (e) => {
    setGlobalTags(e.target.value);
  };
  
  // Start processing
  const handleStartProcessing = () => {
    if (!apiKey) {
      toast.error('Please enter your OpenAI API key');
      return;
    }
    
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    // Set processing status
    setProcessingStatus({
      isProcessing: true,
      progress: 0,
      totalFiles: uploadedFiles.length,
      processedFiles: 0,
      errors: []
    });
    
    // Navigate to processing page
    navigate('/processing');
  };
  
  // Toggle folder mode
  const toggleFolderMode = () => {
    setFolderMode(!folderMode);
  };
  
  // Reset upload progress after completion
  useEffect(() => {
    if (uploadProgress === 100) {
      const timer = setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Images for Caption Generation</h1>
      
      {/* API Key Input */}
      <div className="mb-6">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
          OpenAI API Key <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="sk-..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Your API key is stored locally and never sent to our servers except when processing images.
        </p>
      </div>
      
      {/* Global Tags Input */}
      <div className="mb-6">
        <label htmlFor="globalTags" className="block text-sm font-medium text-gray-700 mb-1">
          Global Tags (Optional)
        </label>
        <input
          type="text"
          id="globalTags"
          value={globalTags}
          onChange={handleGlobalTagsChange}
          placeholder="high quality, detailed, best quality"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          These tags will be added to all generated captions.
        </p>
      </div>
      
      {/* Upload Mode Toggle */}
      <div className="mb-6 flex items-center">
        <button
          onClick={toggleFolderMode}
          className={`px-4 py-2 rounded-md mr-2 ${
            !folderMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
          disabled={isUploading || uploadedFiles.length > 0}
        >
          Upload Files
        </button>
        <button
          onClick={toggleFolderMode}
          className={`px-4 py-2 rounded-md ${
            folderMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
          disabled={isUploading || uploadedFiles.length > 0}
        >
          Upload Folder
        </button>
        <span className="ml-2 text-sm text-gray-500">
          {folderMode ? 'Folder structure will be preserved' : 'Upload individual files'}
        </span>
      </div>
      
      {/* File Dropzone */}
      <div 
        {...getRootProps()} 
        className={`dropzone mb-6 ${isDragActive ? 'active' : ''} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p>Uploading files... {uploadProgress}%</p>
          </div>
        ) : isDragActive ? (
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-blue-500 mx-auto mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="text-lg font-medium text-blue-600">Drop the files here...</p>
          </div>
        ) : (
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-gray-400 mx-auto mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">
              {folderMode ? 'Click to select a folder or drag it here' : 'Click to select files or drag them here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: JPG, PNG, GIF, WebP, BMP
            </p>
          </div>
        )}
      </div>
      
      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Uploaded Files ({uploadedFiles.length})
          </h2>
          
          {uploadedFiles.length <= 10 ? (
            <div className="image-grid">
              {uploadedFiles.slice(0, 10).map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={file.path.startsWith('http') ? file.path : URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">{file.name}</span>
                    </div>
                  )}
                  <div className="p-2 text-xs truncate" title={file.name}>
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md">
              <p>{uploadedFiles.length} files uploaded</p>
              <p className="text-sm text-gray-500">
                Showing preview for large uploads is disabled to improve performance
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Start Processing Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartProcessing}
          disabled={isUploading || uploadedFiles.length === 0 || !apiKey}
          className={`px-6 py-3 rounded-md text-white font-medium ${
            isUploading || uploadedFiles.length === 0 || !apiKey
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Start Caption Generation
        </button>
      </div>
      
      {/* Help Text */}
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">How it works</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Upload your images (individual files or a folder)</li>
          <li>Enter your OpenAI API key (required for GPT-4 Turbo access)</li>
          <li>Add any global tags you want included in all captions (optional)</li>
          <li>Click "Start Caption Generation" to begin processing</li>
          <li>Wait for the AI to generate detailed captions for your images</li>
          <li>Download the resulting caption files for use in LoRA training</li>
        </ol>
      </div>
    </div>
  );
};

export default UploadPage;
