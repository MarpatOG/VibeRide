import {HTMLAttributes} from 'react';
import clsx from 'clsx';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-bg-tertiary text-text',
  success: 'bg-[rgba(23,185,120,0.15)] text-[var(--state-success)]',
  warning: 'bg-[rgba(244,162,97,0.15)] text-[var(--state-warning)]',
  danger: 'bg-[rgba(230,57,70,0.15)] text-[var(--state-danger)]'
};

export default function Badge({
  className,
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {tone?: BadgeTone}) {
  return (
    <span className={clsx('badge', tones[tone], className)} {...props} />
  );
}
