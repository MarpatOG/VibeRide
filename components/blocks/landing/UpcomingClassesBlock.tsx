'use client';

import {Link} from '@/lib/navigation';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {getWorkoutTypeBySessionTitle} from '@/lib/data/workout-types';
import {Locale} from '@/lib/locale';
import Button from '@/components/ui/Button';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {useClientBookings} from '@/components/providers/ClientBookingsProvider';
import IntensityScale, {getIntensityByLevel, getIntensityColorByLevel, getIntensityLabel} from '@/components/ui/IntensityScale';
import {t} from '@/lib/utils/localized';
import {getTrainerShortName} from '@/lib/utils/trainer';

const PAST_STATUS_REFRESH_MS = 30_000;
const SCHEDULE_DESCRIPTION_MAX_CHARS = 72;
const MOBILE_CAROUSEL_QUERY = '(max-width: 767px)';
const MOBILE_CAROUSEL_INTERVAL_MS = 5_000;
const UPCOMING_ITEMS_LIMIT = 12;

function formatSessionDayLabel(dateKey: string, locale: Locale) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'short',
    timeZone: 'UTC'
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
  const dayMonth = `${dateKey.slice(8, 10)}.${dateKey.slice(5, 7)}`;
  return `${weekday} - ${dayMonth}`;
}

function truncateDescription(value: string, maxChars: number) {
  const normalized = value.trim();
  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

function isPastSession(startsAt: string, durationMin: number, nowTimestamp: number) {
  const startsAtMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) {
    return false;
  }
  const endsAtMs = startsAtMs + durationMin * 60_000;
  return endsAtMs <= nowTimestamp;
}

function getSessionCategoryKey(title: {ru: string; en: string}) {
  const workoutType = getWorkoutTypeBySessionTitle(title);
  if (workoutType?.scheduleTemplateId) {
    return workoutType.scheduleTemplateId;
  }
  return `${title.ru}::${title.en}`;
}

export default function UpcomingClassesBlock({
  title,
  subtitle,
  maxItems,
  ctaAllLabel,
  ctaAllHref,
  locale
}: {
  title: string;
  subtitle?: string;
  maxItems: number;
  showQuickSwitch?: boolean;
  ctaAllLabel: string;
  ctaAllHref: string;
  locale: Locale;
}) {
  const router = useRouter();
  const {sessions} = useSessionPool();
  const {trainers} = useTrainerPool();
  const {isBooked} = useClientBookings();
  const topScrollerRef = useRef<HTMLDivElement | null>(null);
  const contentScrollerRef = useRef<HTMLDivElement | null>(null);
  const [topTrackWidth, setTopTrackWidth] = useState(0);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const ctaLabel = ctaAllLabel.replace(/\s*[→>-]+\s*$/, '').trim();
  const leadText =
    subtitle?.trim() ||
    (locale === 'ru'
      ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.'
      : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.');

  const items = useMemo(() => {
    void maxItems;
    const sorted = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const eligible = sorted.filter((session) => {
      if (session.trainerDetached || !session.trainerId) return false;
      if (isPastSession(session.startsAt, session.durationMin, nowTimestamp)) return false;
      if (session.bookedCount >= session.capacity) return false;
      return true;
    });

    const perTrainerCount = new Map<string, number>();
    const trainerCategorySet = new Set<string>();
    const result: typeof eligible = [];
    const targetSize = UPCOMING_ITEMS_LIMIT;

    for (const session of eligible) {
      const trainerId = session.trainerId;
      if (!trainerId) continue;

      const lastTrainerId = result[result.length - 1]?.trainerId ?? null;
      if (lastTrainerId && lastTrainerId === trainerId) continue;

      const trainerSessionsCount = perTrainerCount.get(trainerId) ?? 0;
      if (trainerSessionsCount >= 2) continue;

      const categoryKey = getSessionCategoryKey(session.title);
      const trainerCategoryKey = `${trainerId}::${categoryKey}`;
      if (trainerCategorySet.has(trainerCategoryKey)) continue;

      result.push(session);
      perTrainerCount.set(trainerId, trainerSessionsCount + 1);
      trainerCategorySet.add(trainerCategoryKey);

      if (result.length >= targetSize) break;
    }

    return result;
  }, [maxItems, nowTimestamp, sessions]);

  useEffect(() => {
    const topScroller = topScrollerRef.current;
    const contentScroller = contentScrollerRef.current;
    if (!topScroller || !contentScroller) return;

    let isSyncing = false;

    const updateTrackWidth = () => {
      setTopTrackWidth(contentScroller.scrollWidth);
    };

    const syncTopFromContent = () => {
      if (isSyncing) return;
      isSyncing = true;
      topScroller.scrollLeft = contentScroller.scrollLeft;
      isSyncing = false;
    };

    const syncContentFromTop = () => {
      if (isSyncing) return;
      isSyncing = true;
      contentScroller.scrollLeft = topScroller.scrollLeft;
      isSyncing = false;
    };

    updateTrackWidth();
    contentScroller.addEventListener('scroll', syncTopFromContent, {passive: true});
    topScroller.addEventListener('scroll', syncContentFromTop, {passive: true});
    window.addEventListener('resize', updateTrackWidth);

    const resizeObserver = new ResizeObserver(updateTrackWidth);
    resizeObserver.observe(contentScroller);

    return () => {
      contentScroller.removeEventListener('scroll', syncTopFromContent);
      topScroller.removeEventListener('scroll', syncContentFromTop);
      window.removeEventListener('resize', updateTrackWidth);
      resizeObserver.disconnect();
    };
  }, [items.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, PAST_STATUS_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const contentScroller = contentScrollerRef.current;
    if (!contentScroller || items.length < 2) return;

    const mediaQuery = window.matchMedia(MOBILE_CAROUSEL_QUERY);
    let intervalId: number | null = null;

    const getCards = () => Array.from(contentScroller.querySelectorAll<HTMLElement>('[data-upcoming-card="true"]'));

    const scrollToNextCard = () => {
      if (document.hidden) return;
      const cards = getCards();
      if (cards.length < 2) return;

      const currentLeft = contentScroller.scrollLeft;
      let nearestIndex = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - currentLeft);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      });

      const nextIndex = (nearestIndex + 1) % cards.length;
      const nextCard = cards[nextIndex];
      if (!nextCard) return;

      contentScroller.scrollTo({
        left: nextCard.offsetLeft,
        behavior: 'smooth'
      });
    };

    const startAutoCarousel = () => {
      if (!mediaQuery.matches) return;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(scrollToNextCard, MOBILE_CAROUSEL_INTERVAL_MS);
    };

    const stopAutoCarousel = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const handleViewportChange = () => {
      if (mediaQuery.matches) {
        startAutoCarousel();
      } else {
        stopAutoCarousel();
      }
    };

    handleViewportChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
    } else {
      mediaQuery.addListener(handleViewportChange);
    }

    return () => {
      stopAutoCarousel();
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleViewportChange);
      } else {
        mediaQuery.removeListener(handleViewportChange);
      }
    };
  }, [items.length]);

  const formatSessionDate = (startsAt: string) => {
    return formatSessionDayLabel(startsAt.slice(0, 10), locale);
  };

  const formatSessionTimeRange = (startsAt: string, durationMin: number) => {
    const startDate = new Date(startsAt);
    const endDate = new Date(startDate.getTime() + durationMin * 60_000);
    const timeLabel = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
      .format(startDate)
      .replace('.', ':');
    const endLabel = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
      .format(endDate)
      .replace('.', ':');
    return locale === 'ru' ? `${timeLabel}–${endLabel}` : `${timeLabel}-${endLabel}`;
  };

  const onReserve = (sessionId: string, bookedCount: number, capacity: number, isPast: boolean) => {
    if (isBooked(sessionId)) {
      router.push('/profile#my-bookings');
      return;
    }

    if (isPast || bookedCount >= capacity) {
      return;
    }

    router.push(`/schedule?session=${encodeURIComponent(sessionId)}`);
  };

  return (
    <section className="w-full bg-transparent px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h2 className="text-[clamp(34px,3.1vw,52px)] font-extrabold">{title}</h2>
        <p className="mt-3 text-[clamp(16px,1.3vw,20px)] leading-[1.45] text-text-muted">{leadText}</p>
        <Link
          href={ctaAllHref}
          locale={locale}
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:underline"
        >
          <span>{ctaLabel}</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
      <div className="mt-8 bg-transparent">
        <div className="relative bg-transparent">
          <div
            ref={topScrollerRef}
            className="mt-[5px] mb-[5px] overflow-x-auto scrollbar-minimal"
            aria-label={locale === 'ru' ? 'Верхняя прокрутка ближайших занятий' : 'Top upcoming classes scroll'}
          >
            <div className="h-px" style={{width: `${topTrackWidth}px`}} />
          </div>
          <div
            ref={contentScrollerRef}
            className="overflow-x-auto bg-transparent pb-4 scrollbar-hidden snap-x snap-mandatory touch-pan-x sm:snap-none"
          >
            <div className="flex gap-5 bg-transparent py-1 pl-0 pr-1 sm:px-1">
            {items.map((session) => {
              const trainer = trainers.find((item) => item.id === session.trainerId);
              const isPast = isPastSession(session.startsAt, session.durationMin, nowTimestamp);
              const available = !isPast && session.bookedCount < session.capacity;
              const alreadyBooked = isBooked(session.id);
              const descriptionPreview = truncateDescription(t(session.description, locale), SCHEDULE_DESCRIPTION_MAX_CHARS);
              const intensityValue = getIntensityByLevel(session.level);
              const intensityColor = getIntensityColorByLevel(session.level);
              const trainerShortName = trainer ? getTrainerShortName(trainer) : locale === 'ru' ? 'Тренер' : 'Trainer';
              const trainerLabel = trainerShortName.trim() || (locale === 'ru' ? 'Тренер' : 'Trainer');
              const workoutType = getWorkoutTypeBySessionTitle(session.title);
              const timeAccentColor = workoutType?.color ?? '#CBD5E1';
              const localizedTitle = t(session.title, locale);

              return (
                <div
                  key={session.id}
                  data-upcoming-card="true"
                  className="h-[248px] w-[calc(100vw-2rem)] max-w-full shrink-0 snap-start snap-always overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)] sm:w-[448px]"
                >
                  <div className="flex h-full">
                    <div className="relative h-full w-[132px] shrink-0 sm:w-[154px]">
                      <img src={trainer?.photoUrl} alt={trainerLabel} className="h-full w-full object-cover" />
                      <div className="pointer-events-none absolute right-0 bottom-[15px] left-0 flex justify-center">
                        <span className="inline-flex h-[24px] max-w-[calc(100%-18px)] items-center justify-center overflow-hidden rounded-[999px] bg-black/60 px-3 text-center text-[14px] font-semibold tracking-[0.01em] text-white backdrop-blur-[3px]">
                          <span className="truncate">{trainerLabel}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 px-[15px] pt-[15px] pb-[15px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`min-w-0 ${isPast ? 'text-text-muted' : ''}`}>
                          <div className="truncate text-[16px] leading-tight font-semibold">
                            {formatSessionDate(session.startsAt)}
                          </div>
                          <div className="mt-0.5 truncate text-[16px] leading-tight font-semibold">
                            {formatSessionTimeRange(session.startsAt, session.durationMin)}
                          </div>
                        </div>
                        <div
                          className={
                            isPast
                              ? 'shrink-0 whitespace-nowrap text-[13px] font-semibold text-text-muted'
                              : available
                              ? 'shrink-0 whitespace-nowrap text-[13px] font-semibold text-state-success'
                              : 'shrink-0 whitespace-nowrap text-[13px] font-semibold text-state-warning'
                          }
                        >
                          {isPast
                            ? locale === 'ru'
                              ? 'прошло'
                              : 'finished'
                            : available
                              ? locale === 'ru'
                                ? 'есть места'
                                : 'available'
                              : locale === 'ru'
                                ? 'мест нет'
                              : 'sold out'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex min-w-0 items-center gap-2 text-[17px] font-semibold ${isPast ? 'text-text-muted' : ''}`}>
                          <span
                            aria-hidden="true"
                            className="h-[16px] w-[5px] shrink-0 rounded-full"
                            style={{backgroundColor: timeAccentColor}}
                          />
                          <span className="truncate">{localizedTitle}</span>
                        </div>
                      </div>
                      <p
                        className={`min-h-[2.5rem] overflow-hidden text-[14px] leading-[1.25] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] ${isPast ? 'text-text-muted/80' : 'text-text-muted'}`}
                      >
                        {descriptionPreview || '\u00A0'}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold tracking-[0.06em] uppercase ${isPast ? 'text-text-muted/80' : 'text-text-muted'}`}
                          >
                            {getIntensityLabel(locale)}
                          </span>
                          <IntensityScale value={intensityValue} color={intensityColor} compact className={isPast ? 'opacity-70' : ''} />
                        </div>
                        <span aria-hidden="true">&nbsp;</span>
                      </div>
                      <Button
                        variant={alreadyBooked || available ? 'primary' : 'secondary'}
                        type="button"
                        disabled={!alreadyBooked && !available}
                        onClick={() => onReserve(session.id, session.bookedCount, session.capacity, isPast)}
                        className="mt-auto h-11 w-full px-4 text-[16px] font-semibold"
                      >
                        {alreadyBooked
                          ? locale === 'ru'
                            ? 'Открыть запись'
                            : 'Open booking'
                          : available
                            ? locale === 'ru'
                              ? 'Записаться'
                              : 'Reserve'
                          : locale === 'ru'
                            ? 'Мест нет'
                            : 'Sold out'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
