'use client';

import {CSSProperties, useEffect, useMemo, useState} from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IntensityScale, {getIntensityByLevel, getIntensityColorByLevel, getIntensityLabel} from '@/components/ui/IntensityScale';
import {Locale} from '@/lib/locale';
import {scheduleSlotTimes, scheduleTemplates} from '@/lib/constants/schedule';
import {WORKOUT_TYPES} from '@/lib/data/workout-types';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {Localized} from '@/lib/types/localized';
import {Session} from '@/lib/types/session';
import {getTrainerFullName} from '@/lib/utils/trainer';
import {
  DEFAULT_HALL_ID,
  findPlacementIssueForSession,
  findFirstHallSlotIssue,
  getSlotSpanByDuration,
  SLOT_DURATION_MIN,
  type SlotValidationIssue
} from '@/lib/schedule/slot-rules';

const DEFAULT_CAPACITY = 20;
const EMPTY_SESSION_DURATION_MIN = 60;
const MIN_ADMIN_DAYS = 10;
const MATRIX_COLUMN_MIN_WIDTH = 300;
const MATRIX_GAP_PX = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const FREE_TIME_OPTION_TONE = {bg: 'rgba(34, 197, 94, 0.16)', text: '#166534'};
const BUSY_TIME_OPTION_TONE = {bg: 'rgba(239, 68, 68, 0.16)', text: '#991b1b'};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const TEMPLATE_TONES: Record<string, {bg: string; border: string}> = Object.fromEntries(
  WORKOUT_TYPES.map((workoutType) => [
    workoutType.scheduleTemplateId,
    {
      // Admin cards keep the same accent family as workout formats but with lighter fill.
      bg: hexToRgba(workoutType.color, 0.08),
      border: hexToRgba(workoutType.color, 0.22)
    }
  ])
);
const DETACHED_TONE = {bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.50)'};

type DraftSessionPatch = Partial<{
  dayNumber: number;
  time: string;
  timezoneOffset: string;
  durationMin: number;
  title: Session['title'];
  subtitle: Session['subtitle'];
  description: Session['description'];
  trainerId: string;
  trainerDetached: boolean;
  capacity: number;
  bookedCount: number;
  level: Session['level'];
}>;

function getDateKey(startsAt: string) {
  return startsAt.slice(0, 10);
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
  return Math.max(0, Math.floor((toUtc - fromUtc) / DAY_MS));
}

function getRelativeDayNumber(dateIso: string, baseDateIso: string) {
  return diffDaysIso(baseDateIso, dateIso) + 1;
}

function getTimeLabel(startsAt: string) {
  return startsAt.slice(11, 16);
}

function sortSessions(list: Session[]) {
  return [...list].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

function serializeSessions(list: Session[]) {
  return JSON.stringify(sortSessions(list));
}

function createDraftSessionId(list: Session[]) {
  const existing = new Set(list.map((item) => item.id));
  let seq = 1;
  let candidate = `s-custom-${seq}`;
  while (existing.has(candidate)) {
    seq += 1;
    candidate = `s-custom-${seq}`;
  }
  return candidate;
}

function applySessionPatch(session: Session, patch: DraftSessionPatch, baseDateIso: string): Session {
  const currentDateIso = session.startsAt.slice(0, 10);
  const currentTime = session.startsAt.slice(11, 16);
  const currentTimezoneOffset = session.startsAt.slice(19) || '+03:00';

  const nextDateIso = patch.dayNumber ? addDaysToIso(baseDateIso, patch.dayNumber - 1) : currentDateIso;
  const nextTime = patch.time ?? currentTime;
  const nextTimezoneOffset = patch.timezoneOffset ?? currentTimezoneOffset;
  const capacity = patch.capacity ?? session.capacity;
  const bookedCount = Math.min(patch.bookedCount ?? session.bookedCount, capacity);

  return {
    ...session,
    startsAt:
      patch.dayNumber || patch.time || patch.timezoneOffset
        ? `${nextDateIso}T${nextTime}:00${nextTimezoneOffset}`
        : session.startsAt,
    durationMin: patch.durationMin ?? session.durationMin,
    title: patch.title ?? session.title,
    subtitle: patch.subtitle ?? session.subtitle,
    description: patch.description ?? session.description,
    isThematic: false,
    trainerId: patch.trainerId ?? session.trainerId,
    trainerDetached: patch.trainerDetached ?? session.trainerDetached ?? false,
    capacity,
    bookedCount,
    level: patch.level ?? session.level
  };
}

function getTemplateIdBySession(session: Session) {
  return (
    scheduleTemplates.find(
      (template) =>
        template.title.ru === session.title.ru &&
        template.title.en === session.title.en &&
        template.subtitle.ru === session.subtitle.ru &&
        template.subtitle.en === session.subtitle.en
    )?.id ?? ''
  );
}

function getTemplateTone(templateId: string) {
  return TEMPLATE_TONES[templateId] ?? {bg: 'rgba(148, 163, 184, 0.10)', border: 'rgba(148, 163, 184, 0.30)'};
}

function getLocalizedDescription(description: Localized, locale: Locale) {
  return locale === 'ru' ? description.ru : description.en;
}

function toUtcDateFromIso(dateIso: string) {
  const [year, month, day] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function formatDayLabel(dateIso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  }).format(toUtcDateFromIso(dateIso));
}

function formatSlotIssue(issue: SlotValidationIssue, locale: Locale) {
  if (issue.type === 'invalid_duration') {
    return locale === 'ru'
      ? 'Длительность занятия должна быть от 1 до 120 минут.'
      : 'Session duration must be between 1 and 120 minutes.';
  }

  if (issue.type === 'invalid_start') {
    return locale === 'ru' ? 'Некорректное время начала занятия.' : 'Session start time is invalid.';
  }

  const slotLabel = `${issue.slotStartAt.slice(8, 10)}.${issue.slotStartAt.slice(5, 7)} ${issue.slotStartAt.slice(11, 16)}`;

  return locale === 'ru'
    ? `Слот уже занят (${slotLabel}).`
    : `This slot is already occupied (${slotLabel}).`;
}

function getSessionEndsAtMs(session: Session) {
  const startsAtMs = new Date(session.startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) return 0;
  const slotSpan = getSlotSpanByDuration(session.durationMin);
  if (slotSpan === 0) return 0;
  return startsAtMs + slotSpan * SLOT_DURATION_MIN * 60_000;
}

function formatMissingRequiredFieldsError(session: Session, locale: Locale) {
  const startsAtLabel = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
    .format(new Date(session.startsAt))
    .replace(',', '');

  if (!session.trainerId) {
    return locale === 'ru'
      ? `Заполните тренера для слота ${startsAtLabel}.`
      : `Select a trainer for slot ${startsAtLabel}.`;
  }

  return locale === 'ru'
    ? `Заполните тип тренировки для слота ${startsAtLabel}.`
    : `Select a training type for slot ${startsAtLabel}.`;
}

function isTimeOptionBusy(session: Session, time: string, baseDateIso: string, allSessions: Session[]) {
  const candidate = applySessionPatch(session, {time}, baseDateIso);
  return findPlacementIssueForSession(candidate, allSessions) !== null;
}

function buildTimeOptions() {
  const preset = new Set(scheduleSlotTimes);
  for (let hour = 9; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      preset.add(value);
    }
  }
  return [...preset].sort((left, right) => left.localeCompare(right));
}

function getLocalDateIso(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdminSessionPoolManager({locale}: {locale: Locale}) {
  const {sessions, replaceSessions} = useSessionPool();
  const {trainers} = useTrainerPool();
  const isRu = locale === 'ru';
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseSessions, setBaseSessions] = useState<Session[]>(() => sortSessions(sessions));
  const [draftSessions, setDraftSessions] = useState<Session[]>(() => sortSessions(sessions));

  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const addSlotTimeOptions = useMemo(
    () => timeOptions.filter((value) => value >= '09:00' && value <= '22:30'),
    [timeOptions]
  );

  useEffect(() => {
    const sorted = sortSessions(sessions);
    setBaseSessions(sorted);
    setDraftSessions(sorted);
  }, [sessions]);

  const isDirty = useMemo(
    () => serializeSessions(draftSessions) !== serializeSessions(baseSessions),
    [draftSessions, baseSessions]
  );
  const todayIso = useMemo(() => getLocalDateIso(new Date()), []);
  const visibleDraftSessions = useMemo(
    () => draftSessions.filter((session) => getDateKey(session.startsAt) >= todayIso),
    [draftSessions, todayIso]
  );

  const baseDateIso = useMemo(() => {
    const firstDate = sortSessions(visibleDraftSessions)[0]?.startsAt.slice(0, 10);
    return firstDate ?? todayIso;
  }, [todayIso, visibleDraftSessions]);

  const dayNumbers = useMemo(() => {
    const maxDay = visibleDraftSessions.reduce(
      (max, session) => Math.max(max, getRelativeDayNumber(getDateKey(session.startsAt), baseDateIso)),
      1
    );
    const totalDays = Math.max(MIN_ADMIN_DAYS, maxDay);
    return Array.from({length: totalDays}, (_, index) => index + 1);
  }, [visibleDraftSessions, baseDateIso]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<number, Session[]>();
    for (const dayNumber of dayNumbers) {
      map.set(dayNumber, []);
    }
    for (const session of visibleDraftSessions) {
      const dayNumber = getRelativeDayNumber(getDateKey(session.startsAt), baseDateIso);
      if (!map.has(dayNumber)) {
        map.set(dayNumber, []);
      }
      map.get(dayNumber)?.push(session);
    }
    for (const dayNumber of map.keys()) {
      map.get(dayNumber)?.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
    }
    return map;
  }, [dayNumbers, visibleDraftSessions, baseDateIso]);

  const matrixStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: `repeat(${dayNumbers.length}, ${MATRIX_COLUMN_MIN_WIDTH}px)`,
        minWidth: `${dayNumbers.length * MATRIX_COLUMN_MIN_WIDTH + Math.max(0, dayNumbers.length - 1) * MATRIX_GAP_PX}px`
      }) as CSSProperties,
    [dayNumbers.length]
  );
  const matrixScrollerStyle = useMemo(
    () =>
      ({
        WebkitOverflowScrolling: 'touch'
      }) as CSSProperties,
    []
  );

  const addSlot = (dayNumber: number) => {
    setMessage(null);
    setError(null);

    const dayIso = addDaysToIso(baseDateIso, dayNumber - 1);
    const daySessions = sessionsByDay.get(dayNumber) ?? [];
    const latestSessionStartsAtMs = daySessions.reduce((max, session) => {
      const startsAtMs = new Date(session.startsAt).getTime();
      return Number.isFinite(startsAtMs) ? Math.max(max, startsAtMs) : max;
    }, 0);
    const latestSessionEndMs = daySessions.reduce((max, session) => Math.max(max, getSessionEndsAtMs(session)), 0);

    const availableTimes = addSlotTimeOptions.filter((value) => {
        const candidate: Session = {
          id: createDraftSessionId(draftSessions),
          hallId: DEFAULT_HALL_ID,
          startsAt: `${dayIso}T${value}:00+03:00`,
          durationMin: EMPTY_SESSION_DURATION_MIN,
          title: {ru: '', en: ''},
          subtitle: {ru: '', en: ''},
          description: {ru: '', en: ''},
          isThematic: false,
          trainerId: '',
          trainerDetached: false,
          capacity: DEFAULT_CAPACITY,
          bookedCount: 0,
          level: 'beginner'
        };
        return findPlacementIssueForSession(candidate, draftSessions) === null;
      });

    let fallbackTime: string | null = null;
    if (daySessions.length === 0) {
      fallbackTime = availableTimes[0] ?? null;
    } else {
      const latestAvailableBeforeTail =
        [...availableTimes]
          .reverse()
          .find((value) => {
            const startsAtMs = new Date(`${dayIso}T${value}:00+03:00`).getTime();
            return Number.isFinite(startsAtMs) && startsAtMs <= latestSessionStartsAtMs;
          }) ?? null;

      fallbackTime =
        latestAvailableBeforeTail ??
        availableTimes.find((value) => {
          const startsAtMs = new Date(`${dayIso}T${value}:00+03:00`).getTime();
          return Number.isFinite(startsAtMs) && startsAtMs >= latestSessionEndMs;
        }) ??
        availableTimes[availableTimes.length - 1] ??
        null;
    }

    if (!fallbackTime) {
      setError(isRu ? 'В выбранный день нет свободных слотов.' : 'No free slots for this day.');
      return;
    }

    const next: Session = {
      id: createDraftSessionId(draftSessions),
      hallId: DEFAULT_HALL_ID,
      startsAt: `${dayIso}T${fallbackTime}:00+03:00`,
      durationMin: EMPTY_SESSION_DURATION_MIN,
      title: {ru: '', en: ''},
      subtitle: {ru: '', en: ''},
      description: {ru: '', en: ''},
      isThematic: false,
      trainerId: '',
      trainerDetached: false,
      capacity: DEFAULT_CAPACITY,
      bookedCount: 0,
      level: 'beginner'
    };

    setDraftSessions((prev) => sortSessions([...prev, next]));
    const dayLabel = formatDayLabel(dayIso, locale);
    setMessage(
      isRu
        ? `Слот добавлен в черновик: ${dayLabel}, ${fallbackTime}`
        : `Slot added to draft: ${dayLabel}, ${fallbackTime}`
    );
  };

  const updateDraftSession = (sessionId: string, patch: DraftSessionPatch) => {
    setMessage(null);
    setError(null);

    setDraftSessions((prev) => {
      const next = sortSessions(prev.map((item) => (item.id === sessionId ? applySessionPatch(item, patch, baseDateIso) : item)));
      const changed = next.find((item) => item.id === sessionId);
      const issue = changed ? findPlacementIssueForSession(changed, next) : null;
      if (issue) {
        setError(formatSlotIssue(issue, locale));
        return prev;
      }
      return next;
    });
  };

  const removeDraftSession = (sessionId: string) => {
    setDraftSessions((prev) => prev.filter((item) => item.id !== sessionId));
  };

  const updateSlotTemplate = (sessionId: string, templateId: string) => {
    const targetSession = draftSessions.find((item) => item.id === sessionId);
    if (!targetSession) return;

    if (!templateId) {
      updateDraftSession(sessionId, {
        durationMin: EMPTY_SESSION_DURATION_MIN,
        title: {ru: '', en: ''},
        subtitle: {ru: '', en: ''},
        level: 'beginner'
      });
      return;
    }

    const template = scheduleTemplates.find((item) => item.id === templateId);
    if (!template) return;

    updateDraftSession(sessionId, {
      durationMin: template.durationMin,
      title: template.title as Localized,
      subtitle: template.subtitle as Localized,
      level: template.level
    });
  };

  const onSaveMatrix = async () => {
    if (!isDirty) return;
    setError(null);
    setMessage(null);
    const next = sortSessions(draftSessions);
    const missingRequired = next.find((session) => {
      const templateId = getTemplateIdBySession(session);
      return !session.trainerId || !templateId;
    });
    if (missingRequired) {
      setError(formatMissingRequiredFieldsError(missingRequired, locale));
      return;
    }
    const issue = findFirstHallSlotIssue(next);
    if (issue) {
      setError(formatSlotIssue(issue, locale));
      return;
    }
    const saveResult = await replaceSessions(next);
    if (!saveResult.ok) {
      setError(
        isRu
          ? `Не удалось сохранить изменения: ${saveResult.error}`
          : `Unable to save changes: ${saveResult.error}`
      );
      return;
    }

    setBaseSessions(saveResult.sessions);
    setDraftSessions(saveResult.sessions);
    setMessage(isRu ? 'Изменения матрицы сохранены.' : 'Matrix changes saved.');
  };

  return (
    <div className="mt-6 grid max-w-full gap-6">
      <Card className="min-w-0 overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-lg font-semibold">{isRu ? 'Матрица расписания' : 'Schedule matrix'}</h4>
          <div className="flex items-center gap-3">
            <div className="text-sm text-text-muted">
              {isRu
                ? `Сессий в черновике: ${visibleDraftSessions.length}`
                : `Draft sessions: ${visibleDraftSessions.length}`}
            </div>
            <Button onClick={onSaveMatrix} disabled={!isDirty} className="h-9 px-4 text-sm">
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </div>

        <p className="mt-2 text-sm text-text-muted">
          {isRu
            ? 'В каждом слоте выберите время, тренера и тип тренировки. Длительность округляется: до 30 -> 30, 31-60 -> 60, 61-90 -> 90, 91-120 -> 120. Слоты по 30 минут.'
            : 'Inside each slot pick time, trainer and training type. Duration rounding is: up to 30 -> 30, 31-60 -> 60, 61-90 -> 90, 91-120 -> 120. Slot size is 30 minutes.'}
        </p>

        {isDirty && (
          <p className="mt-2 text-xs font-semibold text-state-warning">
            {isRu ? 'Есть несохраненные изменения в матрице.' : 'There are unsaved matrix changes.'}
          </p>
        )}

        {error && <p className="mt-3 text-xs font-semibold text-state-danger">{error}</p>}
        {message && <p className="mt-3 text-xs font-semibold text-state-success">{message}</p>}

        <div
          className="mt-4 w-full max-w-full min-w-0 touch-pan-x overflow-x-scroll overflow-y-hidden overscroll-x-contain scrollbar-hidden"
          style={matrixScrollerStyle}
        >
          <div className="grid w-max gap-3 pb-1" style={matrixStyle}>
              {dayNumbers.map((dayNumber) => {
                const daySessions = sessionsByDay.get(dayNumber) ?? [];
                const dayDateIso = addDaysToIso(baseDateIso, dayNumber - 1);
                const dayLabel = formatDayLabel(dayDateIso, locale);

                return (
                  <div key={dayNumber} className="rounded-xl border border-border bg-bg-tertiary p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{dayLabel}</div>
                        <div className="text-[10px] text-text-muted/80">{dayDateIso}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSlot(dayNumber)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-bg-tertiary"
                      >
                        + {isRu ? 'слот' : 'slot'}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {daySessions.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border bg-bg-elevated p-3 text-xs text-text-muted">
                          {isRu ? 'Слотов пока нет' : 'No slots yet'}
                        </div>
                      )}

                      {daySessions.map((session) => {
                        const templateId = getTemplateIdBySession(session);
                        const hasCurrentTrainer = session.trainerId ? trainers.some((trainer) => trainer.id === session.trainerId) : true;
                        const hasUnknownTrainer = Boolean(session.trainerId) && !hasCurrentTrainer;
                        const isDetached = Boolean(session.trainerDetached);
                        const tone = isDetached ? DETACHED_TONE : getTemplateTone(templateId);
                        const intensityValue = getIntensityByLevel(session.level);
                        const intensityColor = getIntensityColorByLevel(session.level);

                        return (
                          <div
                            key={session.id}
                            className="rounded-lg border p-2"
                            style={{backgroundColor: tone.bg, borderColor: tone.border}}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="text-xs font-semibold text-text-muted">{getTimeLabel(session.startsAt)}</div>
                              <button
                                type="button"
                                onClick={() => removeDraftSession(session.id)}
                                className="rounded px-1.5 text-sm leading-none text-state-danger hover:bg-state-danger/10"
                                aria-label={isRu ? 'Удалить слот' : 'Remove slot'}
                              >
                                x
                              </button>
                            </div>

                            <div className="space-y-2">
                              <select
                                value={getTimeLabel(session.startsAt)}
                                onChange={(event) => updateDraftSession(session.id, {time: event.target.value})}
                                className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs"
                              >
                                {timeOptions.map((value) => {
                                  const isBusy = isTimeOptionBusy(session, value, baseDateIso, draftSessions);
                                  const tone = isBusy ? BUSY_TIME_OPTION_TONE : FREE_TIME_OPTION_TONE;
                                  return (
                                    <option key={value} value={value} style={{backgroundColor: tone.bg, color: tone.text}}>
                                      {isBusy
                                        ? `${value} · ${isRu ? 'занято' : 'occupied'}`
                                        : `${value} · ${isRu ? 'свободно' : 'free'}`}
                                    </option>
                                  );
                                })}
                              </select>

                              <select
                                value={session.trainerId}
                                onChange={(event) =>
                                  updateDraftSession(session.id, {
                                    trainerId: event.target.value,
                                    trainerDetached: false
                                  })
                                }
                                className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs"
                              >
                                <option value="">{isRu ? 'Выберите тренера' : 'Select trainer'}</option>
                                {isDetached && (
                                  <option value="">
                                    {isRu ? 'Отвязано от тренера' : 'Detached from trainer'}
                                  </option>
                                )}
                                {hasUnknownTrainer && (
                                  <option value={session.trainerId}>
                                    {isRu ? `Неизвестный (${session.trainerId})` : `Unknown (${session.trainerId})`}
                                  </option>
                                )}
                                {trainers.map((trainer) => (
                                  <option key={trainer.id} value={trainer.id}>
                                    {getTrainerFullName(trainer)}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={templateId}
                                onChange={(event) => updateSlotTemplate(session.id, event.target.value)}
                                className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs"
                              >
                                <option value="">{isRu ? 'Выберите тип тренировки' : 'Select training type'}</option>
                                {scheduleTemplates.map((template) => (
                                  <option key={template.id} value={template.id}>
                                    {template.title[locale]}
                                  </option>
                                ))}
                              </select>

                              <textarea
                                value={getLocalizedDescription(session.description, locale)}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  const nextDescription: Localized =
                                    locale === 'ru'
                                      ? {...session.description, ru: nextValue}
                                      : {...session.description, en: nextValue};
                                  updateDraftSession(session.id, {description: nextDescription});
                                }}
                                placeholder={locale === 'ru' ? 'Описание тренировки' : 'Session description'}
                                className="min-h-[56px] w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs"
                              />
                            </div>

                            <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                              {isDetached && (
                                <span className="rounded bg-state-danger/15 px-2 py-0.5 text-state-danger">
                                  {isRu ? 'Отвязано' : 'Detached'}
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-3">
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="text-[10px] tracking-[0.04em] uppercase">{getIntensityLabel(locale)}</span>
                                  <IntensityScale value={intensityValue} color={intensityColor} compact />
                                </div>
                                <span>{isRu ? `${session.durationMin} мин` : `${session.durationMin} min`}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>
    </div>
  );
}
