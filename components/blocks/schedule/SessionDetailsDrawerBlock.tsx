'use client';

import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {useRouter} from 'next/navigation';
import {useToast} from '@/components/ui/Toast';
import {useSchedule} from '@/components/blocks/schedule/schedule-context';
import {Locale} from '@/lib/locale';
import {useClientBookings} from '@/components/providers/ClientBookingsProvider';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {t} from '@/lib/utils/localized';
import {getTrainerFullName, getTrainerShortName} from '@/lib/utils/trainer';

function isPastSession(startsAt: string, durationMin: number) {
  const startsAtMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) {
    return false;
  }
  return startsAtMs + durationMin * 60_000 <= Date.now();
}

export default function SessionDetailsDrawerBlock({
  cancelPolicyHours,
  showWhatToBring,
  locale
}: {
  cancelPolicyHours: number;
  showWhatToBring?: boolean;
  locale: Locale;
}) {
  const {selected, setSelected} = useSchedule();
  const router = useRouter();
  const {sessions, updateSession} = useSessionPool();
  const {trainers} = useTrainerPool();
  const {isBooked, bookSession, cancelSession} = useClientBookings();
  const {addToast} = useToast();

  if (!selected) {
    return null;
  }

  const activeSession = sessions.find((item) => item.id === selected.id) ?? selected;
  const trainer = trainers.find((item) => item.id === activeSession.trainerId);
  const isPast = isPastSession(activeSession.startsAt, activeSession.durationMin);
  const available = !isPast && activeSession.bookedCount < activeSession.capacity;
  const placesLeft = Math.max(0, activeSession.capacity - activeSession.bookedCount);
  const trainerShortName = trainer ? getTrainerShortName(trainer) : '';
  const trainerFullName = trainer ? getTrainerFullName(trainer) : '';
  const sessionTitle = t(activeSession.title, locale);
  const sessionSubtitle = t(activeSession.subtitle, locale);
  const sessionDescription = t(activeSession.description, locale);
  const alreadyBooked = isBooked(activeSession.id);

  const handleBook = () => {
    if (alreadyBooked) {
      setSelected(null);
      router.push('/profile#my-bookings');
      return;
    }

    if (isPast) {
      addToast({
        title: locale === 'ru' ? 'Занятие уже завершено' : 'Session already finished',
        description: locale === 'ru' ? 'Выберите актуальный слот в расписании.' : 'Please choose an active session.',
        tone: 'info'
      });
      return;
    }

    if (!available) {
      addToast({
        title: locale === 'ru' ? 'Свободных мест нет' : 'No spots available',
        description: locale === 'ru' ? 'Выберите другое занятие в расписании.' : 'Please choose another session.',
        tone: 'warning'
      });
      return;
    }

    const plannedBike = Math.min(activeSession.capacity, activeSession.bookedCount + 1);
    const bookingCreated = bookSession({sessionId: activeSession.id, bikeNumber: plannedBike});
    if (!bookingCreated) {
      addToast({
        title: locale === 'ru' ? 'Вы уже записаны' : 'Already booked',
        description: locale === 'ru' ? 'Проверьте запись в личном кабинете.' : 'Check your profile bookings.',
        tone: 'info'
      });
      setSelected(null);
      router.push('/profile#my-bookings');
      return;
    }

    const updated = updateSession(activeSession.id, {
      bookedCount: Math.min(activeSession.capacity, activeSession.bookedCount + 1)
    });

    if (!updated) {
      cancelSession(activeSession.id);
      addToast({
        title: locale === 'ru' ? 'Не удалось записаться' : 'Unable to reserve',
        description: locale === 'ru' ? 'Попробуйте еще раз.' : 'Please try again.',
        tone: 'danger'
      });
      return;
    }

    addToast({
      title: locale === 'ru' ? 'Вы записаны' : 'Reservation confirmed',
      description: locale === 'ru' ? 'Ждем вас на тренировке.' : 'See you in class.',
      tone: 'success'
    });
    setSelected(null);
  };

  return (
    <Drawer
      open={Boolean(selected)}
      onClose={() => setSelected(null)}
      title={locale === 'ru' ? 'Детали занятия' : 'Session details'}
      side="right"
      titleClassName="text-[22px] leading-[1.15]"
      closeButtonClassName="text-[20px]"
    >
      <div className="space-y-4">
        <Badge tone={isPast ? 'neutral' : available ? 'success' : 'warning'} className="text-[13px]">
          {isPast
            ? locale === 'ru'
              ? 'Прошло'
              : 'Finished'
            : available
              ? locale === 'ru'
                ? 'Есть места'
                : 'Available'
              : locale === 'ru'
                ? 'Нет мест'
                : 'Sold out'}
        </Badge>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[22px] font-semibold leading-[1.15]">{sessionTitle}</h3>
            <p className="text-[15px] text-text-muted">{sessionSubtitle}</p>
            <p className="text-[16px] text-text-muted">{trainerShortName}</p>
            <p className="text-[14px] text-text-muted">
              {locale === 'ru'
                ? `Места: ${placesLeft}/${activeSession.capacity}`
                : `Spots: ${placesLeft}/${activeSession.capacity}`}
            </p>
          </div>
          {trainer?.photoUrl && (
            <img
              src={trainer.photoUrl}
              alt={trainerFullName}
              className="h-24 w-24 shrink-0 rounded-full border border-border object-cover"
            />
          )}
        </div>
        <p className="text-[15px]">{sessionDescription}</p>
        <div className="text-[14px] text-text-muted">
          {locale === 'ru'
            ? `Отмена доступна за ${cancelPolicyHours} часа до старта.`
            : `Cancel up to ${cancelPolicyHours} hours before start.`}
        </div>
        {showWhatToBring && (
          <div className="rounded-xl border border-border bg-bg-tertiary p-4 text-[15px]">
            {locale === 'ru'
              ? 'Возьмите воду и спортивную форму. Велотуфли выдаём в студии.'
              : 'Bring water and sportswear. Cycling shoes are provided.'}
          </div>
        )}
        <Button className="w-full text-[17px]" onClick={handleBook} disabled={isPast || (!available && !alreadyBooked)}>
          {alreadyBooked
            ? locale === 'ru'
              ? 'Открыть запись'
              : 'Open booking'
            : locale === 'ru'
              ? 'Записаться'
              : 'Reserve'}
        </Button>
      </div>
    </Drawer>
  );
}

