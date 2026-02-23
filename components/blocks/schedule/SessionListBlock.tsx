'use client';

import {CSSProperties, useCallback, useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {Link} from '@/lib/navigation';
import {getWorkoutTypeBySessionTitle} from '@/lib/data/workout-types';
import {Locale} from '@/lib/locale';
import {getIntensityBySession} from '@/components/ui/IntensityScale';
import Card from '@/components/ui/Card';
import {useSchedule} from '@/components/blocks/schedule/schedule-context';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {t} from '@/lib/utils/localized';
import {getTrainerShortName} from '@/lib/utils/trainer';

const DAYS_IN_WEEK = 7;
const VISIBLE_WEEKS = 2;
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

function formatWeekLabel(startIso: string, endIso: string, weekNumber: number, locale: Locale) {
  const startLabel = locale === 'ru' ? `${startIso.slice(8, 10)}.${startIso.slice(5, 7)}` : `${startIso.slice(5, 7)}/${startIso.slice(8, 10)}`;
  const endLabel = locale === 'ru' ? `${endIso.slice(8, 10)}.${endIso.slice(5, 7)}` : `${endIso.slice(5, 7)}/${endIso.slice(8, 10)}`;
  if (locale === 'ru') {
    const prefix = weekNumber === 1 ? 'Текущая неделя' : weekNumber === 2 ? 'Следующая неделя' : `Неделя ${weekNumber}`;
    return `${prefix} · ${startLabel}-${endLabel}`;
  }
  const prefix = weekNumber === 1 ? 'Current week' : weekNumber === 2 ? 'Next week' : `Week ${weekNumber}`;
  return `${prefix} · ${startLabel}-${endLabel}`;
}

function addDaysToIso(dateIso: string, days: number) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const value = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + days));
  return value.toISOString().slice(0, 10);
}

function getStartOfWeekIso(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  const weekDay = date.getUTCDay() || 7;
  return addDaysToIso(dateIso, -(weekDay - 1));
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
  const contentScrollerRef = useRef<HTMLDivElement | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const [topTrackWidth, setTopTrackWidth] = useState(0);
  const [isPendingWeekSwitch, startWeekSwitchTransition] = useTransition();
  const searchParams = useSearchParams();
  const autoOpenedSessionRef = useRef<string | null>(null);
  const sessionIdFromQuery = searchParams.get('session');
  const todayIso = useMemo(() => getLocalDateIso(nowTimestamp), [nowTimestamp]);
  const currentWeekStartIso = useMemo(() => getStartOfWeekIso(todayIso), [todayIso]);
  const currentWeekEndIso = useMemo(() => addDaysToIso(currentWeekStartIso, DAYS_IN_WEEK - 1), [currentWeekStartIso]);
  const nextWeekEndIso = useMemo(
    () => addDaysToIso(currentWeekStartIso, DAYS_IN_WEEK * VISIBLE_WEEKS - 1),
    [currentWeekStartIso]
  );
  const clientSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          !session.trainerDetached &&
          Boolean(session.trainerId) &&
          getDateKey(session.startsAt) >= todayIso &&
          getDateKey(session.startsAt) <= nextWeekEndIso
      ),
    [sessions, todayIso, nextWeekEndIso]
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
    const totalDays = diffDaysIso(todayIso, nextWeekEndIso) + 1;
    return Array.from({length: totalDays}, (_, index) => addDaysToIso(todayIso, index));
  }, [clientSessions.length, todayIso, nextWeekEndIso]);

  const byDay = useMemo(() => {
    const sessionsByDate = new Map<string, typeof clientSessions>();
    for (const session of clientSessions) {
      const day = getDateKey(session.startsAt);
      const existing = sessionsByDate.get(day);
      if (existing) {
        existing.push(session);
      } else {
        sessionsByDate.set(day, [session]);
      }
    }

    return days.map((day) => [...(sessionsByDate.get(day) ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  }, [clientSessions, days]);

  const weekRanges = useMemo(() => {
    if (days.length === 0) return [];
    const currentWeekLastIndex = Math.min(days.length - 1, diffDaysIso(todayIso, currentWeekEndIso));
    const ranges = [
      {
        startIndex: 0,
        endIndex: currentWeekLastIndex,
        startIso: days[0],
        endIso: days[currentWeekLastIndex]
      }
    ];
    if (currentWeekLastIndex + 1 <= days.length - 1) {
      ranges.push({
        startIndex: currentWeekLastIndex + 1,
        endIndex: days.length - 1,
        startIso: days[currentWeekLastIndex + 1],
        endIso: days[days.length - 1]
      });
    }
    return ranges;
  }, [days, todayIso, currentWeekEndIso]);

  const [activeWeekStartIndex, setActiveWeekStartIndex] = useState(0);
  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState(0);

  useEffect(() => {
    if (weekRanges.length === 0) {
      if (activeWeekStartIndex !== 0) setActiveWeekStartIndex(0);
      return;
    }
    const hasActiveWeek = weekRanges.some((range) => range.startIndex === activeWeekStartIndex);
    if (!hasActiveWeek) {
      setActiveWeekStartIndex(weekRanges[0].startIndex);
    }
  }, [weekRanges, activeWeekStartIndex]);

  useEffect(() => {
    if (days.length === 0) {
      if (activeMobileDayIndex !== 0) setActiveMobileDayIndex(0);
      return;
    }
    if (activeMobileDayIndex > days.length - 1) {
      setActiveMobileDayIndex(days.length - 1);
    }
  }, [days.length, activeMobileDayIndex]);

  useEffect(() => {
    if (!selected || weekRanges.length === 0) return;
    const selectedDay = getDateKey(selected.startsAt);
    const targetWeek = weekRanges.find((range) => selectedDay >= range.startIso && selectedDay <= range.endIso);
    if (targetWeek && targetWeek.startIndex !== activeWeekStartIndex) {
      startWeekSwitchTransition(() => {
        setActiveWeekStartIndex(targetWeek.startIndex);
      });
    }
  }, [selected, weekRanges, activeWeekStartIndex, startWeekSwitchTransition]);

  useEffect(() => {
    if (!selected || days.length === 0) return;
    const selectedDay = getDateKey(selected.startsAt);
    const selectedDayIndex = days.findIndex((day) => day === selectedDay);
    if (selectedDayIndex >= 0 && selectedDayIndex !== activeMobileDayIndex) {
      setActiveMobileDayIndex(selectedDayIndex);
    }
  }, [selected, days, activeMobileDayIndex]);

  const visibleDays = useMemo(
    () => days.slice(activeWeekStartIndex, activeWeekStartIndex + DAYS_IN_WEEK),
    [days, activeWeekStartIndex]
  );

  const visibleByDay = useMemo(
    () => byDay.slice(activeWeekStartIndex, activeWeekStartIndex + DAYS_IN_WEEK),
    [byDay, activeWeekStartIndex]
  );
  const activeMobileDayIso = days[activeMobileDayIndex] ?? '';
  const activeMobileDaySessions = byDay[activeMobileDayIndex] ?? [];
  const canGoMobilePrev = activeMobileDayIndex > 0;
  const canGoMobileNext = activeMobileDayIndex < days.length - 1;
  const trainerById = useMemo(() => {
    return new Map(trainers.map((trainer) => [trainer.id, trainer] as const));
  }, [trainers]);
  const handleWeekClick = useCallback(
    (startIndex: number) => {
      if (startIndex === activeWeekStartIndex || isPendingWeekSwitch) return;
      startWeekSwitchTransition(() => {
        setActiveWeekStartIndex(startIndex);
      });
    },
    [activeWeekStartIndex, isPendingWeekSwitch, startWeekSwitchTransition]
  );
  const goMobilePrevDay = useCallback(() => {
    if (!canGoMobilePrev) return;
    setActiveMobileDayIndex((prev) => Math.max(0, prev - 1));
  }, [canGoMobilePrev]);
  const goMobileNextDay = useCallback(() => {
    if (!canGoMobileNext) return;
    setActiveMobileDayIndex((prev) => Math.min(days.length - 1, prev + 1));
  }, [canGoMobileNext, days.length]);

  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.max(1, visibleDays.length)}, minmax(220px, 1fr))`
  } as CSSProperties;

  useEffect(() => {
    if (visibleDays.length === 0) return;
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
    contentScroller.scrollLeft = 0;
    topScroller.scrollLeft = 0;
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
  }, [visibleDays.length]);

  if (days.length === 0) {
    return (
      <section className="container-schedule pt-2">
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
    <section className="container-schedule pt-0">
      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-3 py-2">
          <button
            type="button"
            onClick={goMobilePrevDay}
            disabled={!canGoMobilePrev}
            className="h-9 w-9 rounded-full border border-border text-xl leading-none text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={locale === 'ru' ? 'Предыдущий день' : 'Previous day'}
          >
            ←
          </button>
          <div className="min-w-0 text-center">
            <div className="text-sm font-semibold uppercase text-text">
              {activeMobileDayIso ? formatDayLabel(activeMobileDayIso, locale) : ''}
            </div>
            <div className="text-[11px] text-text-muted">{activeMobileDayIso}</div>
          </div>
          <button
            type="button"
            onClick={goMobileNextDay}
            disabled={!canGoMobileNext}
            className="h-9 w-9 rounded-full border border-border text-xl leading-none text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={locale === 'ru' ? 'Следующий день' : 'Next day'}
          >
            →
          </button>
        </div>

        <div className="flex flex-col gap-2 rounded-lg bg-bg-elevated/80 p-2">
          {activeMobileDaySessions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-bg-tertiary/60 px-3 py-5 text-center text-sm text-text-muted">
              {locale === 'ru' ? 'На выбранный день занятий нет' : 'No sessions for selected day'}
            </div>
          )}
          {activeMobileDaySessions.map((session) => {
            const trainer = trainerById.get(session.trainerId);
            const isPast = isPastSession(session.startsAt, session.durationMin, nowTimestamp);
            const available = !isPast && session.bookedCount < session.capacity;
            const isSelected = selected?.id === session.id;
            const workoutType = getWorkoutTypeBySessionTitle(session.title);
            const sessionTrainingTypeId = workoutType?.scheduleTemplateId ?? '';
            const sessionIntensity = getIntensityBySession(session.level, session.title);
            const matchesTrainer = !trainerFilter || trainerFilter === session.trainerId;
            const matchesDifficulty = !difficultyFilter || difficultyFilter === `${sessionIntensity}`;
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
                className={`h-[88px] w-full transform-gpu overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ease-out active:scale-[0.99] ${
                  isSelected
                    ? '-translate-y-0.5 border-[var(--accent)]/40 bg-bg-tertiary/95 shadow-[0_14px_34px_rgba(255,47,88,0.24)]'
                    : isPast
                      ? 'border-border/70 bg-bg-tertiary/35 text-text-muted shadow-sm'
                      : 'border-border bg-bg-tertiary/95 shadow-sm'
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
      </div>

      <div className="hidden md:block">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
          {weekRanges.map((range, index) => {
            const active = range.startIndex === activeWeekStartIndex;
            return (
              <button
                key={`${range.startIso}-${range.endIso}`}
                type="button"
                onClick={() => handleWeekClick(range.startIndex)}
                disabled={isPendingWeekSwitch}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[var(--accent)]/60 bg-[var(--accent)]/12 text-[var(--accent)]'
                    : 'border-border bg-bg-elevated text-text-muted hover:text-text'
                }`}
              >
                {formatWeekLabel(range.startIso, range.endIso, index + 1, locale)}
              </button>
            );
          })}
        </div>

        <div
          ref={topScrollerRef}
          className="mt-[5px] mb-[5px] overflow-x-auto scrollbar-minimal touch-pan-x"
          aria-label={locale === 'ru' ? 'Верхняя прокрутка расписания' : 'Top schedule scroll'}
        >
          <div style={{width: `${topTrackWidth}px`}}>
            <div className="grid gap-3" style={gridStyle}>
              {visibleDays.map((day) => (
                <div key={`${day}-top-scroll`} className="h-2 rounded-full bg-border/65" />
              ))}
            </div>
          </div>
        </div>

        <div
          ref={contentScrollerRef}
          className="overflow-x-auto pb-2 scrollbar-hidden touch-auto overscroll-x-contain"
          style={{touchAction: 'manipulation'}}
        >
          <div style={{minWidth: `${Math.max(980, visibleDays.length * 220)}px`}}>
            <div className="mb-1 grid gap-3" style={gridStyle}>
              {visibleDays.map((day, dayIndex) => (
                <div
                  key={day}
                  className={`rounded-lg px-2 pb-1 pt-2 text-sm font-semibold uppercase text-text-muted ${
                    dayIndex % 2 === 0 ? 'bg-bg-elevated/80' : 'bg-bg-tertiary/60'
                  }`}
                >
                  {formatDayLabel(day, locale)}
                </div>
              ))}
            </div>

            <div className="grid gap-3" style={gridStyle}>
              {visibleByDay.map((daySessions, dayIndex) => (
                <div
                  key={visibleDays[dayIndex]}
                  className={`flex flex-col gap-2 rounded-lg p-2 ${
                    dayIndex % 2 === 0 ? 'bg-bg-elevated/80' : 'bg-bg-tertiary/60'
                  }`}
                >
                  {daySessions.map((session) => {
                    const trainer = trainerById.get(session.trainerId);
                    const isPast = isPastSession(session.startsAt, session.durationMin, nowTimestamp);
                    const available = !isPast && session.bookedCount < session.capacity;
                    const isSelected = selected?.id === session.id;
                    const workoutType = getWorkoutTypeBySessionTitle(session.title);
                    const sessionTrainingTypeId = workoutType?.scheduleTemplateId ?? '';
                    const sessionIntensity = getIntensityBySession(session.level, session.title);
                    const matchesTrainer = !trainerFilter || trainerFilter === session.trainerId;
                    const matchesDifficulty = !difficultyFilter || difficultyFilter === `${sessionIntensity}`;
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
      </div>
    </section>
  );
}
