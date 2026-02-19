import {InputHTMLAttributes} from 'react';
import clsx from 'clsx';

export default function Input({className, ...props}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'h-11 w-full rounded-md border border-border bg-bg-elevated px-4 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:shadow-focus-ring',
        className
      )}
      {...props}
    />
  );
}
