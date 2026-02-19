'use client';

import {CSSProperties, useEffect, useMemo, useRef, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {Link} from '@/lib/navigation';
import {getWorkoutTypeBySessionTitle} from '@/lib/data/workout-types';
import {Locale} from '@/lib/locale';
import Card from '@/components/ui/Card';
import {useSchedule} from '@/components/blocks/schedule/schedule-context';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {t} from '@/lib/utils/localized';
import {getTrainerShortName} from '@/lib/utils/trainer';

const MIN_SCHEDULE_DAYS = 10;
const SCHEDULE_DESCRIPTION_MAX_CHARS = 72;
const PAST_STATUS_REFRESH_MS = 30_000;

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function getTimeLabel(value: string) {
  return value.slice(11, 16);
}

function getTimeRangeLabel(startsAt: string, durationMin: number) {
  const startLabel = getTimeLabel(startsAt);
  const [hoursStr, minutesStr] = startLabel.split(':');
  const startTotalMin = Number(hoursStr) * 60 + Number(minutesStr);
  const endTotalMin = startTotalMin + durationMin;
  const endHours = Math.floor((endTotalMin % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const endMinutes = (endTotalMin % 60).toString().padStart(2, '0');
  return `${startLabel} - ${endHours}:${endMinutes}`;
}

function isPastSession(startsAt: string, durationMin: number, nowTimestamp: number) {
  const startsAtMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) {
    return false;
  }
  const endsAtMs = startsAtMs + durationMin * 60_000;
  return endsAtMs <= nowTimestamp;
}

function formatDayLabel(dateKey: string, locale: Locale) {
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

function addDaysToIso(dateIso: string, days: number) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const value = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + days));
  return value.toISOString().slice(0, 10);
}

function diffDaysIso(fromIso: string, toIso: string) {
  const [fromYear, fromMonth, fromDay] = fromIso.split('-').map(Number);
  const [toYear, toMonth, toDay] = toIso.split('-').map(Number);
  const fromUtc = Date.UTC(fromYear, (fromMonth || 1) - 1, fromDay || 1);
  const toUtc = Date.UTC(toYear, (toMonth || 1) - 1, toDay || 1);
  return Math.max(0, Math.floor((toUtc - fromUtc) / (24 * 60 * 60 * 1000)));
}

function truncateDescription(value: string, maxChars: number) {
  const normalized = value.trim();
  if (!normalized) return '';
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

function getLocalDateIso(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SessionListBlock({
  emptyTitle,
  emptyCtaLabel,
  emptyCtaHref,
  locale
}: {
  emptyTitle: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
  locale: Locale;
}) {
  const {selected, setSelected, trainerFilter, difficultyFilter, trainingTypeFilter} = useSchedule();
  const {sessions} = useSessionPool();
  const {trainers} = useTrainerPool();
  const topScrollerRef = useRef<HTMLDivElement | null>(null);
  const contentTrackRef = useRef<HTMLDivElement | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const searchParams = useSearchParams();
  const autoOpenedSessionRef = useRef<string | null>(null);
  const sessionIdFromQuery = searchParams.get('session');
  const todayIso = useMemo(() => getLocalDateIso(nowTimestamp), [nowTimestamp]);
  const clientSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          !session.trainerDetached &&
          Boolean(session.trainerId) &&
          getDateKey(session.startsAt) >= todayIso
      ),
    [sessions, todayIso]
  );

  useEffect(() => {
    if (!sessionIdFromQuery) {
      autoOpenedSessionRef.current = null;
      return;
    }
    if (autoOpenedSessionRef.current === sessionIdFromQuery) {
      return;
    }
    const sessionFromQuery = clientSessions.find((session) => session.id === sessionIdFromQuery);
    if (!sessionFromQuery) {
      return;
    }
    setSelected(sessionFromQuery);
    autoOpenedSessionRef.current = sessionIdFromQuery;
  }, [clientSessions, sessionIdFromQuery, setSelected]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, PAST_STATUS_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const days = useMemo(() => {
    if (clientSessions.length === 0) return [];
    const uniqueSortedDates = Array.from(new Set(clientSessions.map((session) => getDateKey(session.startsAt)))).sort();
    const firstDate = uniqueSortedDates[0];
    const lastDate = uniqueSortedDates[uniqueSortedDates.length - 1];
    const spanDays = diffDaysIso(firstDate, lastDate) + 1;
    const totalDays = Math.max(MIN_SCHEDULE_DAYS, spanDays);
    return Array.from({length: totalDays}, (_, index) => addDaysToIso(firstDate, index));
  }, [clientSessions]);

  const byDay = useMemo(() => {
    return days.map((day) =>
      clientSessions
        .filter((session) => getDateKey(session.startsAt) === day)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    );
  }, [clientSessions, days]);

  const gridStyle = {
    gridTemplateColumns: `repeat(${days.length}, minmax(220px, 1fr))`
  } as CSSProperties;

  useEffect(() => {
    if (days.length === 0) return;
    const topScroller = topScrollerRef.current;
    const contentTrack = contentTrackRef.current;
    if (!topScroller || !contentTrack) return;

    const syncFromTop = () => {
      contentTrack.style.transform = `translateX(${-topScroller.scrollLeft}px)`;
    };

    topScroller.scrollLeft = 0;
    syncFromTop();
    topScroller.addEventListener('scroll', syncFromTop, {passive: true});
    return () => {
      topScroller.removeEventListener('scroll', syncFromTop);
    };
  }, [days.length]);

  if (days.length === 0) {
    return (
      <section className="container-wide pt-2">
        <Card>
          <h3>{emptyTitle}</h3>
          <Link href={emptyCtaHref} locale={locale} className="text-sm font-semibold text-[var(--accent)]">
            {emptyCtaLabel}
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="container-wide pt-0">
      <div
        ref={topScrollerRef}
        className="mt-[5px] mb-[5px] overflow-x-auto scrollbar-minimal touch-pan-x"
        aria-label={locale === 'ru' ? 'Верхняя прокрутка расписания' : 'Top schedule scroll'}
      >
        <div className="min-w-[980px]">
          <div className="grid gap-3" style={gridStyle}>
            {days.map((day) => (
              <div key={`${day}-top-scroll`} className="h-2 rounded-full bg-border/65" />
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-hidden pb-2">
        <div ref={contentTrackRef} className="min-w-[980px] will-change-transform">
          <div className="mb-1 grid gap-3" style={gridStyle}>
            {days.map((day) => (
              <div key={day} className="px-1 pb-1 text-sm font-semibold uppercase text-text-muted">
                {formatDayLabel(day, locale)}
              </div>
            ))}
          </div>

          <div className="grid gap-3" style={gridStyle}>
            {byDay.map((daySessions, dayIndex) => (
              <div key={days[dayIndex]} className="flex flex-col gap-2">
                {daySessions.map((session) => {
                  const trainer = trainers.find((item) => item.id === session.trainerId);
                  const isPast = isPastSession(session.startsAt, session.durationMin, nowTimestamp);
                  const available = !isPast && session.bookedCount < session.capacity;
                  const isSelected = selected?.id === session.id;
                  const workoutType = getWorkoutTypeBySessionTitle(session.title);
                  const sessionTrainingTypeId = workoutType?.scheduleTemplateId ?? '';
                  const matchesTrainer = !trainerFilter || trainerFilter === session.trainerId;
                  const matchesDifficulty = !difficultyFilter || difficultyFilter === session.level;
                  const matchesTrainingType = !trainingTypeFilter || trainingTypeFilter === sessionTrainingTypeId;
                  const hasActiveFilters = Boolean(trainerFilter || difficultyFilter || trainingTypeFilter);
                  const isFilterMatch = hasActiveFilters && matchesTrainer && matchesDifficulty && matchesTrainingType;
                  const trainerName = trainer ? getTrainerShortName(trainer) : '';
                  const timeAccentColor = workoutType?.color ?? '#CBD5E1';
                  const localizedTitle = t(session.title, locale);
                  const localizedDescription = t(session.description, locale);
                  const descriptionPreview = truncateDescription(localizedDescription, SCHEDULE_DESCRIPTION_MAX_CHARS);

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelected(session)}
                      className={`h-[80px] w-full transform-gpu overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ease-out active:scale-[0.99] ${
                        isSelected
                          ? '-translate-y-0.5 border-[var(--accent)]/40 bg-bg-tertiary/95 shadow-[0_14px_34px_rgba(255,47,88,0.24)]'
                          : isPast
                            ? 'border-border/70 bg-bg-tertiary/35 text-text-muted shadow-sm'
                            : 'border-border bg-bg-tertiary/95 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                      } ${isFilterMatch ? 'border-state-success shadow-[0_0_0_1px_rgba(23,185,120,0.4)]' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className={`whitespace-nowrap text-base leading-none font-semibold ${isPast ? 'text-text-muted' : ''}`}>
                          {getTimeRangeLabel(session.startsAt, session.durationMin)}
                        </div>
                        <div
                          className={
                            isPast
                              ? 'shrink-0 whitespace-nowrap text-xs font-semibold text-text-muted'
                              : available
                              ? 'shrink-0 whitespace-nowrap text-xs font-semibold text-state-success'
                              : 'shrink-0 whitespace-nowrap text-xs font-semibold text-state-warning'
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
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className={`inline-flex min-w-0 items-center gap-2 text-sm font-medium ${isPast ? 'text-text-muted' : ''}`}>
                          <span
                            aria-hidden="true"
                            className="h-[16px] w-[5px] shrink-0 rounded-full"
                            style={{backgroundColor: timeAccentColor}}
                          />
                          <span className="truncate">{localizedTitle}</span>
                        </div>
                        <div className={`max-w-[92px] shrink-0 truncate whitespace-nowrap text-right text-sm ${isPast ? 'text-text-muted/80' : 'text-text-muted'}`}>
                          {trainerName}
                        </div>
                      </div>
                      <div className={`mt-1 min-h-[1.25rem] truncate text-xs leading-snug ${isPast ? 'text-text-muted/80' : 'text-text-muted'}`}>
                        {descriptionPreview || '\u00A0'}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

