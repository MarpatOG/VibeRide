'use client';

import {ReactNode, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import clsx from 'clsx';

export default function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  titleClassName,
  closeButtonClassName,
  contentClassName,
  children
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  titleClassName?: string;
  closeButtonClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const isRight = side === 'right';
  const isLeft = side === 'left';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 transition',
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
          isLeft
            ? 'absolute inset-y-0 left-0 w-[88vw] max-w-[360px] border-r border-border bg-bg-elevated p-6 shadow-2xl transition-transform duration-300 ease-out'
            : 'absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl bg-bg-elevated p-6 shadow-2xl transition-transform duration-300 ease-out md:top-0 md:max-h-none md:w-[420px] md:rounded-none md:border-border',
          isRight ? 'md:left-auto md:right-0 md:border-l' : 'md:right-auto md:left-0 md:border-r',
          isLeft
            ? open
              ? 'translate-x-0'
              : '-translate-x-full'
            : open
              ? 'translate-y-0 md:translate-x-0'
              : isRight
                ? 'translate-y-full md:translate-x-full'
                : 'translate-y-full md:-translate-x-full'
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h4 className={clsx('text-lg font-semibold', titleClassName)}>{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className={clsx('rounded-full p-2 text-[20px] leading-none text-text-muted hover:bg-bg-tertiary', closeButtonClassName)}
            aria-label="Close"
          >
            X
          </button>
        </div>
        <div className={clsx('overflow-y-auto pr-1', contentClassName)}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
