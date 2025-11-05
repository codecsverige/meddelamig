'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-900'
                : toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-900'
                : toast.type === 'warning'
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                : 'bg-blue-50 border border-blue-200 text-blue-900'
            }`}
          >
            {/* Icon */}
            {toast.type === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
            {toast.type === 'error' && (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            {toast.type === 'warning' && (
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            )}
            {toast.type === 'info' && (
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
            
            {/* Message */}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            
            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
