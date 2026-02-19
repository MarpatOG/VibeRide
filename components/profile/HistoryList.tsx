import Card from '@/components/ui/Card';
import {Locale} from '@/lib/locale';
import {HistoryEvent} from '@/lib/types/profile';
import {formatDateTime, getHistoryTypeLabel} from '@/components/profile/format';

export default function HistoryList({
  locale,
  events
}: {
  locale: Locale;
  events: HistoryEvent[];
}) {
  return (
    <div className="space-y-3">
      {events.map((eventItem) => (
        <Card key={eventItem.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="mb-1 text-base font-semibold">{eventItem.title}</h4>
              {eventItem.note ? <p className="mb-0 text-sm text-text-muted">{eventItem.note}</p> : null}
            </div>
            <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-semibold text-text-muted">
              {getHistoryTypeLabel(eventItem.type, locale)}
            </span>
          </div>
          <div className="mt-3 text-sm text-text-muted">{formatDateTime(eventItem.occurredAt, locale)}</div>
        </Card>
      ))}
    </div>
  );
}
