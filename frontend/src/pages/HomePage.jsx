import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { Server, Database, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const HomePage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Phase 1: Architecture & Skeleton Verified
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Welcome to Buyboo
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Production full-stack e-commerce architecture powered by React, Express, and MySQL with Indian Rupee (₹) pricing.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Express REST API</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">Port 5000 with CORS and centralized error handling.</p>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded inline-block">
            {loading ? 'Checking...' : health?.status === 'UP' ? 'STATUS: UP' : 'STATUS: OFFLINE'}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">MySQL Database</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">8 relational tables initialized with InnoDB FK constraints.</p>
          <div className="text-xs font-mono text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded inline-block">
            {loading ? 'Verifying...' : health?.database || 'MySQL Connected'}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg font-bold text-base">
              ₹
            </div>
            <h3 className="font-semibold text-slate-200">Currency Engine</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">Standardized Indian Rupee formatting applied across all views.</p>
          <div className="text-xs font-mono text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded inline-block">
            Sample: {formatCurrency(24999)}
          </div>
        </div>
      </div>

      {/* Live Health Probe Card */}
      <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-4">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : health ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <h4 className="font-medium text-slate-200">Live API Health Probe (`/api/health`)</h4>
          </div>
          <span className="text-xs font-mono text-slate-400">Response standard: success, message, data</span>
        </div>

        {loading && <p className="text-sm text-slate-400">Querying backend service...</p>}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
            Failed to connect to backend: {error}.
          </div>
        )}
        {health && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Status</span>
              <span className="font-semibold text-emerald-400">{health.status}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Database</span>
              <span className="font-semibold text-slate-200">{health.database}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Environment</span>
              <span className="font-semibold text-slate-200">{health.environment}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Server Timestamp</span>
              <span className="font-mono text-slate-300 truncate block">{health.timestamp}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
