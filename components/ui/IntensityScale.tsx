import clsx from 'clsx';
import {Locale} from '@/lib/locale';
import {getWorkoutTypeBySessionTitle} from '@/lib/data/workout-types';

export type SessionLevel = 'beginner' | 'intermediate' | 'advanced';
export type IntensityValue = 1 | 2 | 3 | 4 | 5;
export type SessionTitleInput = {ru: string; en: string} | string;

export const INTENSITY_VALUES: IntensityValue[] = [1, 2, 3, 4, 5];

export function getIntensityByLevel(level: SessionLevel): IntensityValue {
  if (level === 'beginner') return 2;
  if (level === 'intermediate') return 3;
  return 4;
}

export function getIntensityColorByValue(value: IntensityValue): string {
  if (value === 1) return '#93C5FD';
  if (value === 2) return '#5DA9FF';
  if (value === 3) return '#14B8A6';
  if (value === 4) return '#F59E0B';
  return '#EF4444';
}

export function getIntensityBySession(level: SessionLevel, title?: SessionTitleInput | null): IntensityValue {
  if (title) {
    const workoutType = getWorkoutTypeBySessionTitle(title);
    if (workoutType) return workoutType.intensity;
  }
  return getIntensityByLevel(level);
}

export function getIntensityColorByLevel(level: SessionLevel): string {
  return getIntensityColorByValue(getIntensityByLevel(level));
}

export function getIntensityColorBySession(level: SessionLevel, title?: SessionTitleInput | null): string {
  return getIntensityColorByValue(getIntensityBySession(level, title));
}

export function getIntensityLabel(locale: Locale) {
  return locale === 'ru' ? 'Интенсивность' : 'Intensity';
}

export function getIntensityOptionLabel(level: SessionLevel, locale: Locale) {
  return `${getIntensityLabel(locale)} ${getIntensityByLevel(level)}/5`;
}

export function getIntensityOptionLabelByValue(value: IntensityValue, locale: Locale) {
  return `${getIntensityLabel(locale)} ${value}/5`;
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
