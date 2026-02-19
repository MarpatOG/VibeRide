import clsx from 'clsx';
import {Locale} from '@/lib/locale';

export type SessionLevel = 'beginner' | 'intermediate' | 'advanced';

export function getIntensityByLevel(level: SessionLevel): 1 | 2 | 3 | 4 | 5 {
  if (level === 'beginner') return 2;
  if (level === 'intermediate') return 3;
  return 4;
}

export function getIntensityColorByLevel(level: SessionLevel): string {
  if (level === 'beginner') return '#5DA9FF';
  if (level === 'intermediate') return '#14B8A6';
  return '#EF4444';
}

export function getIntensityLabel(locale: Locale) {
  return locale === 'ru' ? 'Интенсивность' : 'Intensity';
}

export function getIntensityOptionLabel(level: SessionLevel, locale: Locale) {
  return `${getIntensityLabel(locale)} ${getIntensityByLevel(level)}/5`;
}

export default function IntensityScale({
  value,
  color,
  compact = false,
  className
}: {
  value: number;
  color: string;
  compact?: boolean;
  className?: string;
}) {
  void color;

  return (
    <div className={clsx('flex items-center', compact ? 'gap-1' : 'gap-1.5', className)} aria-hidden="true">
      {Array.from({length: 5}, (_, index) => {
        const active = index < value;
        return (
          <span
            key={index}
            className={clsx('rounded-full', compact ? 'h-1.5 w-3.5' : 'h-1.5 w-4')}
            style={{
              backgroundColor: active ? 'var(--text-muted)' : 'var(--border)',
              opacity: active ? 0.85 : 0.35
            }}
          />
        );
      })}
    </div>
  );
}
