import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-10 backdrop-blur-md shadow-2xl text-center">
        <div className="inline-flex p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">404 — Page Not Found</h1>
        <p className="text-slate-400 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
