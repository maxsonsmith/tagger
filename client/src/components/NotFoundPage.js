import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-24 w-24 text-gray-400 mx-auto" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-medium text-gray-700 mb-6">Page Not Found</h2>
      
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Go Back
        </button>
        
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 rounded-md text-white hover:bg-blue-700"
        >
          Return to Home
        </Link>
      </div>
      
      <div className="mt-12 text-sm text-gray-500">
        <p>
          Lost? You can upload images for LoRA caption generation from the home page.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
