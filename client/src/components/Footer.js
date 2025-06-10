import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              &copy; {currentYear} LoRA Caption Generator. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center space-x-4">
            <Link to="/settings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Settings
            </Link>
            <a 
              href="https://github.com/your-username/lora-caption-generator" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              GitHub
            </a>
            <a 
              href="https://platform.openai.com/docs/api-reference" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              OpenAI API Docs
            </a>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Powered by GPT-4 Turbo | Built for LoRA training workflows</p>
          <p className="mt-1">
            This tool helps generate detailed captions for image datasets used in LoRA model training.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
