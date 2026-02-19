'use client';

import {Locale} from '@/lib/locale';
import {HistoryEventType} from '@/lib/types/profile';

type EventFilterType = 'all' | HistoryEventType;

export default function HistoryFilters({
  locale,
  periodDays,
  eventType,
  onPeriodDaysChange,
  onEventTypeChange
}: {
  locale: Locale;
  periodDays: number;
  eventType: EventFilterType;
  onPeriodDaysChange: (value: number) => void;
  onEventTypeChange: (value: EventFilterType) => void;
}) {
  return (
    <div className="surface grid gap-4 p-4 md:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          {locale === 'ru' ? 'Период' : 'Period'}
        </span>
        <select
          className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm focus-visible:outline-none focus-visible:shadow-focus-ring"
          value={periodDays}
          onChange={(event) => onPeriodDaysChange(Number(event.target.value))}
        >
          <option value={30}>{locale === 'ru' ? '30 дней' : '30 days'}</option>
          <option value={90}>{locale === 'ru' ? '90 дней' : '90 days'}</option>
          <option value={365}>{locale === 'ru' ? '365 дней' : '365 days'}</option>
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          {locale === 'ru' ? 'Тип события' : 'Event type'}
        </span>
        <select
          className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm focus-visible:outline-none focus-visible:shadow-focus-ring"
          value={eventType}
          onChange={(event) => onEventTypeChange(event.target.value as EventFilterType)}
        >
          <option value="all">{locale === 'ru' ? 'Все события' : 'All events'}</option>
          <option value="completed">{locale === 'ru' ? 'Посещения' : 'Completed'}</option>
          <option value="canceled">{locale === 'ru' ? 'Отмены' : 'Canceled'}</option>
          <option value="session_debited">{locale === 'ru' ? 'Списания' : 'Debits'}</option>
          <option value="membership_update">{locale === 'ru' ? 'Абонемент' : 'Membership'}</option>
        </select>
      </label>
    </div>
  );
}
