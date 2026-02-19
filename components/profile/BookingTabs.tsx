'use client';

import clsx from 'clsx';
import {BookingStatus} from '@/lib/types/profile';
import {Locale} from '@/lib/locale';

export default function BookingTabs({
  locale,
  active,
  counts,
  onChange
}: {
  locale: Locale;
  active: BookingStatus;
  counts: Record<BookingStatus, number>;
  onChange: (value: BookingStatus) => void;
}) {
  const items: Array<{key: BookingStatus; titleRu: string; titleEn: string}> = [
    {key: 'upcoming', titleRu: 'Предстоящие', titleEn: 'Upcoming'},
    {key: 'past', titleRu: 'Прошедшие', titleEn: 'Past'}
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              isActive
                ? 'border-transparent bg-[var(--menu-active)] text-white'
                : 'border-border bg-bg-elevated text-text hover:bg-bg-tertiary'
            )}
          >
            <span>{locale === 'ru' ? item.titleRu : item.titleEn}</span>
            <span className={clsx('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-white/25' : 'bg-bg-tertiary')}>
              {counts[item.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
