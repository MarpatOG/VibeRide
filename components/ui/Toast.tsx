'use client';

import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import clsx from 'clsx';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
};

type ToastContextValue = {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, {...toast, id}]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({addToast}), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-[320px] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto rounded-xl border border-border bg-bg-elevated p-4 shadow-xl',
              toast.tone === 'success' && 'border-[var(--state-success)]',
              toast.tone === 'warning' && 'border-[var(--state-warning)]',
              toast.tone === 'danger' && 'border-[var(--state-danger)]'
            )}
          >
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.description && (
              <div className="text-xs text-text-muted">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  return null;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
