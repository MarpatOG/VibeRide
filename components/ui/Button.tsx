import {ButtonHTMLAttributes} from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const variantClass = {
    primary:
      'bg-btn-primary text-white shadow-lg shadow-[rgba(255,47,88,0.25)] hover:opacity-90',
    secondary:
      'border border-border text-text hover:bg-bg-tertiary',
    ghost: 'text-text hover:bg-bg-tertiary'
  }[variant];

  return (
    <button
      className={clsx(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:shadow-focus-ring disabled:opacity-50',
        variantClass,
        className
      )}
      type={type}
      {...props}
    />
  );
}
