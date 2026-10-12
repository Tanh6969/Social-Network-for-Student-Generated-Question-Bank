import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[300] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
        };

        const borderMap = {
          success: 'border-l-4 border-l-emerald-500',
          warning: 'border-l-4 border-l-amber-500',
          error: 'border-l-4 border-l-red-500',
          info: 'border-l-4 border-l-blue-500'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 ${borderMap[toast.type]} animate-in slide-in-from-right duration-200`}
          >
            {iconMap[toast.type]}
            <p className="text-xs font-medium flex-1 pt-0.5">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
