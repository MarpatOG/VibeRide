import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {Locale} from '@/lib/locale';
import {Booking} from '@/lib/types/profile';
import {formatDateTime} from '@/components/profile/format';
import IntensityScale, {getIntensityByLevel, getIntensityColorByLevel, getIntensityLabel} from '@/components/ui/IntensityScale';

export default function BookingCard({
  booking,
  locale,
  onCancel
}: {
  booking: Booking;
  locale: Locale;
  onCancel: (booking: Booking) => void;
}) {
  const isPast = booking.status === 'past';
  const intensityValue = getIntensityByLevel(booking.level);
  const intensityColor = getIntensityColorByLevel(booking.level);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="mb-1 text-lg font-semibold">{booking.title}</h4>
          <p className="mb-0 text-sm text-text-muted">{booking.format}</p>
          <div className="mt-1 inline-flex items-center gap-2 text-text-muted">
            <span className="text-[11px] tracking-[0.04em] uppercase">{getIntensityLabel(locale)}</span>
            <IntensityScale value={intensityValue} color={intensityColor} compact />
          </div>
        </div>
        <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-semibold text-text-muted">
          {booking.status === 'upcoming'
            ? locale === 'ru'
              ? 'Предстоящая'
              : 'Upcoming'
            : locale === 'ru'
              ? 'Прошедшая'
              : 'Past'}
        </span>
      </div>

      <div className="mt-3 grid gap-1 text-sm text-text-muted">
        <div>{booking.trainerName}</div>
        <div>{formatDateTime(booking.startsAt, locale)}</div>
        {booking.studio ? <div>{booking.studio}</div> : null}
        {isPast && typeof booking.bikeNumber === 'number' ? (
          <div>{locale === 'ru' ? `Велостанок #${booking.bikeNumber}` : `Bike #${booking.bikeNumber}`}</div>
        ) : null}
      </div>

      <div className="mt-3 rounded-md border border-border bg-bg-tertiary/60 px-3 py-2 text-xs text-text-muted">
        {locale === 'ru'
          ? `Бесплатная отмена до: ${formatDateTime(booking.freeCancelUntil, locale)}`
          : `Free cancellation until: ${formatDateTime(booking.freeCancelUntil, locale)}`}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => onCancel(booking)} disabled={isPast}>
          {locale === 'ru' ? 'Отменить' : 'Cancel'}
        </Button>
      </div>
    </Card>
  );
}
