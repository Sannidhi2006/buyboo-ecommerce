import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="bg-slate-800/60 border border-rose-500/30 rounded-2xl p-10 backdrop-blur-md shadow-2xl text-center">
        <div className="inline-flex p-4 bg-rose-600/20 text-rose-400 rounded-2xl mb-4">
          <ShieldOff className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">403 — Forbidden</h1>
        <p className="text-slate-400 mb-6">
          You do not have permission to access this page.
          This area is restricted to administrators only.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
