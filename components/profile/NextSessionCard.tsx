import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {Link} from '@/lib/navigation';
import {Locale} from '@/lib/locale';
import {Booking} from '@/lib/types/profile';
import {formatDateTime} from '@/components/profile/format';
import IntensityScale, {getIntensityByLevel, getIntensityColorByLevel, getIntensityLabel} from '@/components/ui/IntensityScale';

export default function NextSessionCard({
  booking,
  locale,
  openHref,
  scheduleHref,
  onCancel
}: {
  booking: Booking | null;
  locale: Locale;
  openHref: string;
  scheduleHref: string;
  onCancel?: (booking: Booking) => void;
}) {
  const intensityValue = booking ? getIntensityByLevel(booking.level) : null;
  const intensityColor = booking ? getIntensityColorByLevel(booking.level) : null;

  if (!booking) {
    return (
      <Card>
        <h4 className="text-xl font-semibold">{locale === 'ru' ? 'Следующая тренировка' : 'Next class'}</h4>
        <p className="mt-2 text-sm text-text-muted">
          {locale === 'ru'
            ? 'Ближайших записей пока нет. Выберите занятие в расписании.'
            : 'No upcoming sessions yet. Pick a class from schedule.'}
        </p>
        <Link href={scheduleHref} locale={locale}>
          <Button className="mt-4">{locale === 'ru' ? 'Записаться' : 'Book class'}</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="text-xl font-semibold">{locale === 'ru' ? 'Следующая тренировка' : 'Next class'}</h4>
        <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-semibold text-text-muted">
          {booking.format}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div>{formatDateTime(booking.startsAt, locale)}</div>
        {booking.studio ? <div className="text-text-muted">{booking.studio}</div> : null}
        <div className="text-text-muted">{booking.trainerName}</div>
        <div className="inline-flex items-center gap-2 text-text-muted">
          <span className="text-[11px] tracking-[0.04em] uppercase">{getIntensityLabel(locale)}</span>
          <IntensityScale value={intensityValue ?? 2} color={intensityColor ?? '#5DA9FF'} compact />
        </div>
        {booking.status === 'past' && typeof booking.bikeNumber === 'number' ? (
          <div className="text-text-muted">
            {locale === 'ru' ? `Велостанок #${booking.bikeNumber}` : `Bike #${booking.bikeNumber}`}
          </div>
        ) : null}
      </div>
      <div className="mt-4 rounded-md border border-border bg-bg-tertiary/60 px-3 py-2 text-xs text-text-muted">
        {locale === 'ru'
          ? `Бесплатная отмена до: ${formatDateTime(booking.freeCancelUntil, locale)}`
          : `Free cancellation until: ${formatDateTime(booking.freeCancelUntil, locale)}`}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={openHref} locale={locale}>
          <Button variant="secondary">{locale === 'ru' ? 'Открыть запись' : 'Open booking'}</Button>
        </Link>
        <Button variant="ghost" onClick={() => onCancel?.(booking)}>
          {locale === 'ru' ? 'Отменить' : 'Cancel'}
        </Button>
      </div>
    </Card>
  );
}
