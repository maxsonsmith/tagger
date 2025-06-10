import React, { useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../App';

const SettingsPage = () => {
  const { apiKey, setApiKey, globalTags, setGlobalTags } = useContext(AppContext);
  
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localGlobalTags, setLocalGlobalTags] = useState(globalTags || '');
  const [maxTokens, setMaxTokens] = useState(localStorage.getItem('maxTokens') || '300');
  const [preferredDownloadFormat, setPreferredDownloadFormat] = useState(
    localStorage.getItem('preferredDownloadFormat') || 'separate'
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const storedMaxTokens = localStorage.getItem('maxTokens');
    if (storedMaxTokens) {
      setMaxTokens(storedMaxTokens);
    }
    
    const storedFormat = localStorage.getItem('preferredDownloadFormat');
    if (storedFormat) {
      setPreferredDownloadFormat(storedFormat);
    }
  }, []);

  // Handle API key change
  const handleApiKeyChange = (e) => {
    setLocalApiKey(e.target.value);
  };

  // Handle global tags change
  const handleGlobalTagsChange = (e) => {
    setLocalGlobalTags(e.target.value);
  };

  // Handle max tokens change
  const handleMaxTokensChange = (e) => {
    setMaxTokens(e.target.value);
  };

  // Handle download format change
  const handleFormatChange = (e) => {
    setPreferredDownloadFormat(e.target.value);
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Clear API key
  const handleClearApiKey = () => {
    setLocalApiKey('');
    setApiKey('');
    localStorage.removeItem('openaiApiKey');
    toast.success('API key cleared');
  };

  // Save settings
  const handleSaveSettings = () => {
    setIsSaving(true);

    try {
      // Save API key
      setApiKey(localApiKey);
      localStorage.setItem('openaiApiKey', localApiKey);

      // Save global tags
      setGlobalTags(localGlobalTags);
      localStorage.setItem('globalTags', localGlobalTags);

      // Save max tokens
      localStorage.setItem('maxTokens', maxTokens);

      // Save preferred download format
      localStorage.setItem('preferredDownloadFormat', preferredDownloadFormat);

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* API Key Settings */}
      <div className="mb-8 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4">OpenAI API Key</h2>
        
        <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="flex">
            <input
              type={showApiKey ? "text" : "password"}
              id="apiKey"
              value={localApiKey}
              onChange={handleApiKeyChange}
              placeholder="sk-..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={toggleApiKeyVisibility}
              className="px-4 py-2 bg-gray-100 border-t border-r border-b border-gray-300 text-gray-600 rounded-r-md hover:bg-gray-200"
              title={showApiKey ? "Hide API Key" : "Show API Key"}
            >
              {showApiKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Your API key is stored locally in your browser and is only sent to OpenAI when processing images.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleClearApiKey}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
          >
            Clear API Key
          </button>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Get API Key
          </a>
        </div>
      </div>

      {/* Global Tags Settings */}
      <div className="mb-8 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Global Tags</h2>
        
        <div className="mb-4">
          <label htmlFor="globalTags" className="block text-sm font-medium text-gray-700 mb-1">
            Default Global Tags
          </label>
          <input
            type="text"
            id="globalTags"
            value={localGlobalTags}
            onChange={handleGlobalTagsChange}
            placeholder="high quality, detailed, best quality"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            These tags will be automatically added to all generated captions. Separate multiple tags with commas.
          </p>
        </div>
      </div>

      {/* Caption Generation Settings */}
      <div className="mb-8 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Caption Generation</h2>
        
        <div className="mb-4">
          <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Tokens
          </label>
          <select
            id="maxTokens"
            value={maxTokens}
            onChange={handleMaxTokensChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="100">100 (Shorter captions)</option>
            <option value="200">200 (Brief captions)</option>
            <option value="300">300 (Standard captions)</option>
            <option value="400">400 (Detailed captions)</option>
            <option value="500">500 (Very detailed captions)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Controls the maximum length of generated captions. Higher values may result in more detailed descriptions but will use more API tokens.
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="downloadFormat" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Download Format
          </label>
          <select
            id="downloadFormat"
            value={preferredDownloadFormat}
            onChange={handleFormatChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="separate">Separate Folders (images/ and captions/)</option>
            <option value="paired">Paired Folders (one folder per image/caption pair)</option>
            <option value="flat">Flat Structure (all files in root)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Sets the default organization structure when downloading generated captions and images.
          </p>
        </div>
      </div>

      {/* About LoRA Training */}
      <div className="mb-8 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <h2 className="text-lg font-medium text-gray-800 mb-4">About LoRA Training</h2>
        
        <div className="mb-4 text-sm text-gray-600">
          <p className="mb-2">
            <strong>LoRA (Low-Rank Adaptation)</strong> is a technique for fine-tuning large AI models, particularly image generation models like Stable Diffusion.
          </p>
          <p className="mb-2">
            When training a LoRA model, each training image needs descriptive text captions (tags) that help the model learn the relationship between text descriptions and visual elements.
          </p>
          <p>
            This application uses GPT-4 Turbo to generate these captions automatically, following best practices for LoRA training.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <a
            href="https://huggingface.co/docs/diffusers/training/lora"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            LoRA Training Guide
          </a>
          <a
            href="https://platform.openai.com/docs/guides/vision"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            OpenAI Vision API Docs
          </a>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-6 py-3 rounded-md text-white font-medium ${
            isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
