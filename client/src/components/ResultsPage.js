import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../App';

const ResultsPage = () => {
  const { 
    sessionId, 
    globalTags, 
    setGlobalTags,
    resultFiles, 
    fetchResultFiles
  } = useContext(AppContext);
  
  const [selectedFormat, setSelectedFormat] = useState('separate');
  const [isAddingTags, setIsAddingTags] = useState(false);
  const [newGlobalTags, setNewGlobalTags] = useState(globalTags);
  const [selectedFile, setSelectedFile] = useState(null);
  const [captionContent, setCaptionContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch results when component mounts
  useEffect(() => {
    if (sessionId) {
      fetchResultFiles();
    } else {
      navigate('/');
    }
  }, [sessionId, fetchResultFiles, navigate]);

  // Handle download format change
  const handleFormatChange = (e) => {
    setSelectedFormat(e.target.value);
  };

  // Handle download all files
  const handleDownloadAll = () => {
    if (!sessionId) return;
    
    const downloadLink = resultFiles.downloadLinks[`allFiles${selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)}`];
    if (downloadLink) {
      window.location.href = downloadLink;
      toast.success('Download started');
    } else {
      toast.error('Download link not available');
    }
  };

  // Handle download all captions
  const handleDownloadAllCaptions = () => {
    if (!sessionId || !resultFiles.downloadLinks.allCaptions) return;
    
    window.location.href = resultFiles.downloadLinks.allCaptions;
    toast.success('Caption download started');
  };

  // Handle adding global tags
  const handleAddGlobalTags = async () => {
    if (!sessionId || !newGlobalTags || isAddingTags) return;
    
    setIsAddingTags(true);
    
    try {
      const response = await fetch('/api/caption/add-global-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          globalTags: newGlobalTags
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add global tags');
      }
      
      const data = await response.json();
      
      // Update global tags in context
      setGlobalTags(newGlobalTags);
      
      // Refresh results
      await fetchResultFiles();
      
      toast.success(`Global tags added to ${data.results.length} files`);
      
    } catch (error) {
      console.error('Error adding global tags:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsAddingTags(false);
    }
  };

  // Handle viewing caption content
  const handleViewCaption = async (captionFile) => {
    if (selectedFile === captionFile.name) {
      // Toggle off if already selected
      setSelectedFile(null);
      setCaptionContent('');
      return;
    }
    
    setSelectedFile(captionFile.name);
    setIsLoading(true);
    
    try {
      const response = await fetch(captionFile.path);
      
      if (!response.ok) {
        throw new Error('Failed to load caption content');
      }
      
      const content = await response.text();
      setCaptionContent(content);
      
    } catch (error) {
      console.error('Error loading caption content:', error);
      toast.error(`Error: ${error.message}`);
      setCaptionContent('Error loading caption content');
    } finally {
      setIsLoading(false);
    }
  };

  // Find matching image for a caption file
  const findMatchingImage = (captionFile) => {
    const baseName = captionFile.name.replace('.txt', '');
    return resultFiles.imageFiles.find(img => 
      img.name.startsWith(baseName) || 
      baseName.startsWith(img.name.replace(/\.[^/.]+$/, ''))
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Caption Generation Results</h1>
      
      {/* Results Summary */}
      <div className="mb-6 bg-white border border-gray-200 rounded-md p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-3">Results Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Images</p>
            <p className="text-xl font-medium">{resultFiles.imageFiles.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Generated Captions</p>
            <p className="text-xl font-medium">{resultFiles.captionFiles.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-xl font-medium">
              {resultFiles.imageFiles.length > 0 
                ? `${Math.round((resultFiles.captionFiles.length / resultFiles.imageFiles.length) * 100)}%` 
                : '0%'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Global Tags</p>
            <p className="text-sm font-mono truncate" title={globalTags}>
              {globalTags || 'None'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Download Options */}
      <div className="mb-6 bg-white border border-gray-200 rounded-md p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-3">Download Options</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Download Format
          </label>
          <select
            value={selectedFormat}
            onChange={handleFormatChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="separate">Separate Folders (images/ and captions/)</option>
            <option value="paired">Paired Folders (one folder per image/caption pair)</option>
            <option value="flat">Flat Structure (all files in root)</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={!resultFiles.downloadLinks || resultFiles.captionFiles.length === 0}
            className={`px-4 py-2 rounded-md text-white ${
              !resultFiles.downloadLinks || resultFiles.captionFiles.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Download All Files
          </button>
          
          <button
            onClick={handleDownloadAllCaptions}
            disabled={!resultFiles.downloadLinks || resultFiles.captionFiles.length === 0}
            className={`px-4 py-2 rounded-md ${
              !resultFiles.downloadLinks || resultFiles.captionFiles.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            Download Captions Only
          </button>
        </div>
      </div>
      
      {/* Global Tags Management */}
      <div className="mb-6 bg-white border border-gray-200 rounded-md p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-3">Manage Global Tags</h2>
        
        <div className="flex items-end gap-3 mb-2">
          <div className="flex-grow">
            <label htmlFor="globalTags" className="block text-sm font-medium text-gray-700 mb-1">
              Global Tags
            </label>
            <input
              type="text"
              id="globalTags"
              value={newGlobalTags}
              onChange={(e) => setNewGlobalTags(e.target.value)}
              placeholder="high quality, detailed, best quality"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleAddGlobalTags}
            disabled={isAddingTags || !newGlobalTags}
            className={`px-4 py-2 rounded-md text-white ${
              isAddingTags || !newGlobalTags
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isAddingTags ? 'Updating...' : 'Update Tags'}
          </button>
        </div>
        
        <p className="text-sm text-gray-500">
          Adding or updating global tags will modify all existing caption files.
        </p>
      </div>
      
      {/* File Listing */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-3">Generated Captions</h2>
        
        {resultFiles.captionFiles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
            <p className="text-gray-500">No caption files generated yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {resultFiles.captionFiles.map((captionFile, index) => {
              const matchingImage = findMatchingImage(captionFile);
              
              return (
                <div 
                  key={captionFile.name} 
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      {matchingImage && (
                        <img 
                          src={matchingImage.path}
                          alt={matchingImage.name}
                          className="w-12 h-12 object-cover rounded-md mr-3"
                        />
                      )}
                      
                      <div>
                        <p className="font-medium">{captionFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {matchingImage ? `Paired with ${matchingImage.name}` : 'No matching image found'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewCaption(captionFile)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {selectedFile === captionFile.name ? 'Hide' : 'View'}
                      </button>
                      
                      <a
                        href={captionFile.path}
                        download={captionFile.name}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  
                  {selectedFile === captionFile.name && (
                    <div className="px-3 pb-3">
                      {isLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="spinner"></div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 p-3 rounded-md">
                          <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-40">
                            {captionContent}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Missing Captions Warning */}
      {resultFiles.imageFiles.length > resultFiles.captionFiles.length && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            <div>
              <h3 className="text-yellow-800 font-medium">Missing Captions</h3>
              <p className="text-yellow-700 text-sm mt-1">
                {resultFiles.imageFiles.length - resultFiles.captionFiles.length} images do not have generated captions.
                This could be due to errors during processing or because processing was cancelled.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/processing')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Processing
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
        >
          Upload More Images
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
