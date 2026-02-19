'use client';

import {CSSProperties, useEffect, useMemo, useRef} from 'react';
import Badge from '@/components/ui/Badge';
import IntensityScale, {getIntensityByLevel, getIntensityColorByLevel, getIntensityLabel} from '@/components/ui/IntensityScale';
import {getWorkoutTypeBySessionTitle} from '@/lib/data/workout-types';
import {Locale} from '@/lib/locale';

const MATRIX_COLUMN_MIN_WIDTH = 300;
const MATRIX_GAP_PX = 12;

type TrainerMatrixSession = {
  id: string;
  startsAt: string;
  durationMin: number;
  titleRu: string;
  titleEn: string;
  subtitleRu: string;
  subtitleEn: string;
  capacity: number;
  bookedCount: number;
  level: 'beginner' | 'intermediate' | 'advanced';
};

type DayGroup = {
  day: string;
  sessions: TrainerMatrixSession[];
};

function getTimeLabel(startsAt: string) {
  return startsAt.slice(11, 16);
}

function formatDayLabel(dateIso: string, locale: Locale) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'short',
    timeZone: 'UTC'
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
  const dayMonth = `${dateIso.slice(8, 10)}.${dateIso.slice(5, 7)}`;
  return `${weekday} - ${dayMonth}`;
}

function formatTimeRange(startsAt: string, durationMin: number) {
  const start = getTimeLabel(startsAt);
  const [hour, minute] = start.split(':').map(Number);
  const endTotal = hour * 60 + minute + durationMin;
  const endHour = Math.floor((endTotal % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const endMinute = (endTotal % 60).toString().padStart(2, '0');
  return `${start} - ${endHour}:${endMinute}`;
}

function getStatusTone(bookedCount: number, capacity: number): 'success' | 'warning' {
  return bookedCount < capacity ? 'success' : 'warning';
}

function getStatusLabel(bookedCount: number, capacity: number, locale: Locale) {
  if (bookedCount < capacity) {
    return locale === 'ru' ? 'Есть места' : 'Spots available';
  }
  return locale === 'ru' ? 'Мест нет' : 'Sold out';
}

export default function TrainerScheduleMatrix({dayGroups, locale}: {dayGroups: DayGroup[]; locale: Locale}) {
  const topScrollerRef = useRef<HTMLDivElement | null>(null);
  const contentTrackRef = useRef<HTMLDivElement | null>(null);

  const matrixStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: `repeat(${Math.max(1, dayGroups.length)}, ${MATRIX_COLUMN_MIN_WIDTH}px)`,
        minWidth: `${Math.max(1, dayGroups.length) * MATRIX_COLUMN_MIN_WIDTH + Math.max(0, dayGroups.length - 1) * MATRIX_GAP_PX}px`
      }) as CSSProperties,
    [dayGroups.length]
  );

  useEffect(() => {
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
  }, [dayGroups.length]);

  return (
    <>
      <div
        ref={topScrollerRef}
        className="mt-[5px] mb-[5px] overflow-x-auto scrollbar-minimal touch-pan-x"
        aria-label={locale === 'ru' ? 'Верхняя прокрутка матрицы тренера' : 'Top trainer matrix scroll'}
      >
        <div className="grid w-max gap-3" style={matrixStyle}>
          {dayGroups.map((group) => (
            <div key={`${group.day}-top-scroll`} className="h-2 rounded-full bg-border/65" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-full min-w-0 overflow-x-hidden pb-1">
        <div ref={contentTrackRef} className="will-change-transform">
          <div className="grid w-max gap-3" style={matrixStyle}>
            {dayGroups.map((group) => (
              <div key={group.day} className="rounded-xl border border-border bg-bg-tertiary p-3">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                  {formatDayLabel(group.day, locale)}
                </div>

                <div className="flex flex-col gap-2">
                  {group.sessions.map((session) => {
                    const workoutType = getWorkoutTypeBySessionTitle({ru: session.titleRu, en: session.titleEn});
                    const accentColor = workoutType?.color ?? '#CBD5E1';
                    const sessionTitle = locale === 'ru' ? session.titleRu : session.titleEn;
                    const sessionSubtitle = locale === 'ru' ? session.subtitleRu : session.subtitleEn;
                    const intensityValue = getIntensityByLevel(session.level);
                    const intensityColor = getIntensityColorByLevel(session.level);

                    return (
                      <div key={session.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold text-text-muted">
                            {formatTimeRange(session.startsAt, session.durationMin)}
                          </div>
                          <Badge tone={getStatusTone(session.bookedCount, session.capacity)}>
                            {getStatusLabel(session.bookedCount, session.capacity, locale)}
                          </Badge>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span aria-hidden="true" className="h-4 w-[5px] rounded-full" style={{backgroundColor: accentColor}} />
                          <div className="truncate text-sm font-semibold">{sessionTitle}</div>
                        </div>
                        <div className="mt-1 truncate text-xs text-text-muted">{sessionSubtitle}</div>

                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                          <div className="inline-flex min-w-0 items-center gap-2">
                            <span className="text-[10px] tracking-[0.04em] uppercase text-text-muted">{getIntensityLabel(locale)}</span>
                            <IntensityScale value={intensityValue} color={intensityColor} compact />
                          </div>
                          <span aria-hidden="true">&nbsp;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
