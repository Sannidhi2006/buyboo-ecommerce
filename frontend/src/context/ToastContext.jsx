import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="fixed right-4 top-20 z-[70] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <button
            type="button"
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className={`rounded-xl border px-4 py-3 text-left text-sm shadow-2xl backdrop-blur ${toast.type === 'error' ? 'border-rose-500/40 bg-rose-950/90 text-rose-100' : toast.type === 'success' ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100' : 'border-blue-500/40 bg-slate-900/95 text-blue-100'}`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
};
