'use client';

import {ReactNode, useEffect} from 'react';
import clsx from 'clsx';

export default function Modal({
  open,
  onClose,
  title,
  className,
  children
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <div
        className={clsx(
          'absolute inset-0 bg-black/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative flex max-h-[calc(100dvh-2rem)] w-[90vw] max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl transition-transform',
          className,
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-muted hover:bg-bg-tertiary"
            aria-label="Close"
          >
            X
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">{children}</div>
      </div>
    </div>
  );
}
