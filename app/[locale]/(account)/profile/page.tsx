'use client';

import {FormEvent, MouseEvent, useEffect, useMemo, useState} from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {useLocale} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';
import {useToast} from '@/components/ui/Toast';
import BookingTabs from '@/components/profile/BookingTabs';
import BookingCard from '@/components/profile/BookingCard';
import MembershipCard from '@/components/profile/MembershipCard';
import {formatDateTime} from '@/components/profile/format';
import {Booking, BookingStatus, Membership, UserProfile} from '@/lib/types/profile';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {useClientBookings} from '@/components/providers/ClientBookingsProvider';
import {t} from '@/lib/utils/localized';
import {getTrainerFullName} from '@/lib/utils/trainer';

const FREE_CANCEL_HOURS = 24;
const DEMO_USER_ID = 'u-client';
type SaveState = 'idle' | 'saving' | 'success' | 'error';

function buildFreeCancelUntilIso(startsAt: string) {
  const startMs = new Date(startsAt).getTime();
  return new Date(startMs - FREE_CANCEL_HOURS * 60 * 60 * 1000).toISOString();
}

export default function ProfileDashboardPage() {
  const locale = useLocale() as Locale;
  const {addToast} = useToast();
  const {sessions, updateSession} = useSessionPool();
  const {trainers} = useTrainerPool();
  const {bookings: clientBookings, cancelSession} = useClientBookings();

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  const [membership, setMembership] = useState<Membership>({
    remainingSessions: 0,
    validUntil: undefined,
    active: false
  });
  const [profile, setProfile] = useState<UserProfile>({
    firstName: 'Demo',
    lastName: 'Client',
    email: 'client@viberide.demo'
  });
  const [profileDraft, setProfileDraft] = useState<UserProfile>({
    firstName: 'Demo',
    lastName: 'Client',
    email: 'client@viberide.demo'
  });
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileSaveState, setProfileSaveState] = useState<SaveState>('idle');
  const [profileErrorMessage, setProfileErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/profile?userId=${encodeURIComponent(DEMO_USER_ID)}`, {cache: 'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as {profile: UserProfile; membership: Membership};
        if (cancelled) return;
        setProfile(payload.profile);
        setProfileDraft(payload.profile);
        setMembership(payload.membership);
      } catch (error) {
        console.error('Unable to load profile from DB API.', error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const bookings = useMemo(() => {
    const now = Date.now();
    const bySessionId = new Map(clientBookings.map((item) => [item.sessionId, item]));
    return sessions
      .filter((session) => bySessionId.has(session.id))
      .map((session) => {
        const trainer = trainers.find((item) => item.id === session.trainerId);
        const bookingMeta = bySessionId.get(session.id);
        const status = new Date(session.startsAt).getTime() > now ? 'upcoming' : 'past';
        return {
          id: session.id,
          status,
          title: t(session.title, locale),
          format: t(session.subtitle, locale),
          level: session.level,
          trainerName: trainer ? getTrainerFullName(trainer) : locale === 'ru' ? 'Тренер' : 'Trainer',
          startsAt: session.startsAt,
          durationMin: session.durationMin,
          studio: locale === 'ru' ? 'Студия VibeRide' : 'VibeRide Studio',
          bikeNumber: bookingMeta?.bikeNumber,
          freeCancelUntil: buildFreeCancelUntilIso(session.startsAt)
        } satisfies Booking;
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [clientBookings, locale, sessions, trainers]);

  const counts = useMemo(
    () =>
      ({
        upcoming: bookings.filter((item) => item.status === 'upcoming').length,
        past: bookings.filter((item) => item.status === 'past').length
      }) satisfies Record<BookingStatus, number>,
    [bookings]
  );
  const visibleBookings = useMemo(() => bookings.filter((item) => item.status === activeTab), [activeTab, bookings]);

  const closeActionModal = () => {
    setActiveBooking(null);
  };

  const confirmCancel = () => {
    if (!activeBooking) return;

    const session = sessions.find((item) => item.id === activeBooking.id);
    const canceled = cancelSession(activeBooking.id);
    if (canceled && session) {
      updateSession(session.id, {bookedCount: Math.max(0, session.bookedCount - 1)});
    }

    addToast({
      title: canceled
        ? locale === 'ru'
          ? 'Запись отменена'
          : 'Booking canceled'
        : locale === 'ru'
          ? 'Запись уже отменена'
          : 'Booking already canceled',
      tone: canceled ? 'success' : 'warning'
    });
    closeActionModal();
  };

  const startProfileEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setProfileDraft(profile);
    setIsProfileEditing(true);
    setProfileSaveState('idle');
    setProfileErrorMessage('');
  };

  const cancelProfileEdit = () => {
    setProfileDraft(profile);
    setIsProfileEditing(false);
    setProfileSaveState('idle');
    setProfileErrorMessage('');
  };

  const handleProfileDraftChange = (patch: Partial<UserProfile>) => {
    setProfileDraft((prev) => ({...prev, ...patch}));
    if (profileSaveState !== 'idle') {
      setProfileSaveState('idle');
    }
    if (profileErrorMessage) {
      setProfileErrorMessage('');
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileErrorMessage('');

    const firstName = profileDraft.firstName.trim();
    const lastName = profileDraft.lastName.trim();
    const email = profileDraft.email.trim();
    const isRu = locale === 'ru';

    if (!firstName || !lastName) {
      setProfileSaveState('error');
      setProfileErrorMessage(isRu ? 'Введите имя и фамилию.' : 'Please enter first and last name.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setProfileSaveState('error');
      setProfileErrorMessage(isRu ? 'Укажите корректный email.' : 'Please enter a valid email.');
      return;
    }

    setProfileSaveState('saving');
    window.setTimeout(() => {
      if (email.toLowerCase().includes('error')) {
        setProfileSaveState('error');
        setProfileErrorMessage(isRu ? 'Не удалось сохранить профиль. Повторите позже.' : 'Unable to save profile now.');
        return;
      }

      const nextProfile = {firstName, lastName, email};
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      setProfileSaveState('success');
      setIsProfileEditing(false);
    }, 550);
  };

  const fullName = `${profile.lastName} ${profile.firstName}`.trim();
  const initials = `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || 'VR';

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form className="space-y-4" onSubmit={saveProfile}>
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-tertiary text-base font-semibold text-text">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              {isProfileEditing ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-text-muted">{locale === 'ru' ? 'Имя' : 'First name'}</span>
                    <Input
                      value={profileDraft.firstName}
                      onChange={(event) => handleProfileDraftChange({firstName: event.target.value})}
                      required
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-text-muted">{locale === 'ru' ? 'Фамилия' : 'Last name'}</span>
                    <Input
                      value={profileDraft.lastName}
                      onChange={(event) => handleProfileDraftChange({lastName: event.target.value})}
                      required
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="mb-1 block text-text-muted">Email</span>
                    <Input
                      type="email"
                      value={profileDraft.email}
                      onChange={(event) => handleProfileDraftChange({email: event.target.value})}
                      required
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="truncate text-base font-semibold">{fullName}</div>
                  <div className="truncate text-sm text-text-muted">{profile.email}</div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isProfileEditing ? (
              <>
                <Button type="submit" disabled={profileSaveState === 'saving'}>
                  {profileSaveState === 'saving'
                    ? locale === 'ru'
                      ? 'Сохранение...'
                      : 'Saving...'
                    : locale === 'ru'
                      ? 'Сохранить'
                      : 'Save'}
                </Button>
                <Button type="button" variant="ghost" onClick={cancelProfileEdit} disabled={profileSaveState === 'saving'}>
                  {locale === 'ru' ? 'Отмена' : 'Cancel'}
                </Button>
              </>
            ) : (
              <Button type="button" variant="secondary" onClick={startProfileEdit}>
                {locale === 'ru' ? 'Изменить данные' : 'Edit details'}
              </Button>
            )}
          </div>

          {profileSaveState === 'error' ? (
            <div className="rounded-md border border-state-danger/50 bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
              {profileErrorMessage}
            </div>
          ) : null}
          {profileSaveState === 'success' && !isProfileEditing ? (
            <div className="rounded-md border border-state-success/50 bg-state-success/10 px-3 py-2 text-sm text-state-success">
              {locale === 'ru' ? 'Профиль сохранен.' : 'Profile saved.'}
            </div>
          ) : null}
        </form>
      </Card>

      <MembershipCard membership={membership} locale={locale} buyHref="/pricing" />

      <Card id="my-bookings">
        <h4 className="text-xl font-semibold">{locale === 'ru' ? 'Мои записи' : 'My bookings'}</h4>
        <div className="mt-4">
          <BookingTabs locale={locale} active={activeTab} counts={counts} onChange={setActiveTab} />
        </div>
        {visibleBookings.length === 0 ? (
          <div className="mt-4 rounded-md border border-border bg-bg-tertiary/60 px-4 py-3 text-sm text-text-muted">
            {locale === 'ru' ? 'В выбранном разделе пока нет тренировок.' : 'No sessions in this section yet.'}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                locale={locale}
                onCancel={(value) => setActiveBooking(value)}
              />
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(activeBooking)}
        onClose={closeActionModal}
        title={locale === 'ru' ? 'Подтверждение' : 'Confirmation'}
      >
        {activeBooking ? (
          <div className="space-y-4 text-sm">
            <p>{locale === 'ru' ? 'Отменить эту запись?' : 'Cancel this booking?'}</p>
            <div className="rounded-md border border-border bg-bg-tertiary/60 px-3 py-2 text-text-muted">
              {locale === 'ru'
                ? `Бесплатная отмена до: ${formatDateTime(activeBooking.freeCancelUntil, locale)}`
                : `Free cancellation until: ${formatDateTime(activeBooking.freeCancelUntil, locale)}`}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={confirmCancel}>{locale === 'ru' ? 'Подтвердить' : 'Confirm'}</Button>
              <Button variant="ghost" onClick={closeActionModal}>
                {locale === 'ru' ? 'Закрыть' : 'Close'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
