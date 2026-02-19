'use client';

import {useMemo, useState} from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {Locale} from '@/lib/locale';
import {generateScheduleSessions, type GeneratedSession} from '@/lib/schedule/generator';
import {defaultScheduleGenerationConfig, scheduleTemplates, scheduleTrainerRules} from '@/lib/constants/schedule';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {Localized} from '@/lib/types/localized';
import {getTrainerFullName} from '@/lib/utils/trainer';

type FormState = {
  startDate: string;
  days: number;
  capacity: number;
  timezoneOffset: string;
  eveningShiftStartsAt: string;
  slotTimesRaw: string;
  closingTemplateId: string;
  sessionStartSeq: number;
};

function withEmptyDescriptions(sessions: GeneratedSession<Localized>[]) {
  return sessions.map((session) => ({
    ...session,
    description: {ru: '', en: ''}
  }));
}

function toSlotTimes(raw: string) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidHHmm(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function formatDateTime(startsAt: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
    .format(new Date(startsAt))
    .replace(',', '');
}

export default function AdminScheduleGeneratorForm({locale}: {locale: Locale}) {
  const {replaceSessions} = useSessionPool();
  const {trainers} = useTrainerPool();
  const isRu = locale === 'ru';
  const [error, setError] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'done' | 'failed'>('idle');

  const [form, setForm] = useState<FormState>({
    startDate: defaultScheduleGenerationConfig.startDate,
    days: defaultScheduleGenerationConfig.days,
    capacity: defaultScheduleGenerationConfig.capacity,
    timezoneOffset: defaultScheduleGenerationConfig.timezoneOffset,
    eveningShiftStartsAt: defaultScheduleGenerationConfig.eveningShiftStartsAt,
    slotTimesRaw: defaultScheduleGenerationConfig.slotTimes.join(', '),
    closingTemplateId: defaultScheduleGenerationConfig.closingTemplateId ?? '',
    sessionStartSeq: defaultScheduleGenerationConfig.sessionStartSeq
  });

  const [generated, setGenerated] = useState(() =>
    (() => {
      const result = generateScheduleSessions<Localized>({
        startDate: form.startDate,
        days: form.days,
        timezoneOffset: form.timezoneOffset,
        slotTimes: toSlotTimes(form.slotTimesRaw),
        capacity: form.capacity,
        templates: scheduleTemplates,
        trainerRules: scheduleTrainerRules,
        closingTemplateId: form.closingTemplateId || undefined,
        eveningShiftStartsAt: form.eveningShiftStartsAt,
        sessionIdPrefix: defaultScheduleGenerationConfig.sessionIdPrefix,
        sessionStartSeq: form.sessionStartSeq
      });
      return {...result, sessions: withEmptyDescriptions(result.sessions)};
    })()
  );

  const trainerNames = useMemo(
    () =>
      Object.fromEntries(
        trainers.map((trainer) => [trainer.id, getTrainerFullName(trainer)] as const)
      ) as Record<string, string>,
    [trainers]
  );

  const onGenerate = () => {
    setCopyStatus('idle');
    setApplyMessage(null);
    const slotTimes = toSlotTimes(form.slotTimesRaw);

    if (!form.startDate) {
      setError(isRu ? 'Укажите дату старта.' : 'Set a start date.');
      return;
    }
    if (form.days < 1 || form.days > 90) {
      setError(isRu ? 'Количество дней: от 1 до 90.' : 'Days must be between 1 and 90.');
      return;
    }
    if (!slotTimes.length || slotTimes.some((item) => !isValidHHmm(item))) {
      setError(isRu ? 'Слоты должны быть в формате HH:MM через запятую.' : 'Slots must be HH:MM values separated by comma.');
      return;
    }
    if (!/^[+-]\d{2}:\d{2}$/.test(form.timezoneOffset)) {
      setError(isRu ? 'Часовой пояс в формате +03:00.' : 'Timezone format must be like +03:00.');
      return;
    }

    setError(null);
    const result = generateScheduleSessions<Localized>({
      startDate: form.startDate,
      days: form.days,
      timezoneOffset: form.timezoneOffset,
      slotTimes,
      capacity: form.capacity,
      templates: scheduleTemplates,
      trainerRules: scheduleTrainerRules,
      closingTemplateId: form.closingTemplateId || undefined,
      eveningShiftStartsAt: form.eveningShiftStartsAt,
      sessionIdPrefix: defaultScheduleGenerationConfig.sessionIdPrefix,
      sessionStartSeq: form.sessionStartSeq
    });
    setGenerated({...result, sessions: withEmptyDescriptions(result.sessions)});
  };

  const onApplyToPool = async () => {
    setError(null);
    setApplyMessage(null);
    const saveResult = await replaceSessions(generated.sessions);
    if (!saveResult.ok) {
      setError(
        isRu
          ? `Не удалось применить расписание: ${saveResult.error}`
          : `Unable to apply schedule: ${saveResult.error}`
      );
      return;
    }
    setApplyMessage(isRu ? 'Расписание применено и сохранено.' : 'Schedule applied and saved.');
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(generated.sessions, null, 2));
      setCopyStatus('done');
    } catch {
      setCopyStatus('failed');
    }
  };

  const sessionPreview = generated.sessions.slice(0, 30) as GeneratedSession<Localized>[];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h4 className="text-lg font-semibold">{isRu ? 'Генератор расписания' : 'Schedule generator'}</h4>
        <p className="mt-2 text-sm text-text-muted">
          {isRu
            ? 'Форма запускает алгоритм и возвращает готовый набор тренировок.'
            : 'The form runs the algorithm and returns a generated set of sessions.'}
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold">
            {isRu ? 'Дата старта' : 'Start date'}
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({...prev, startDate: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Дней' : 'Days'}
            <input
              type="number"
              min={1}
              max={90}
              value={form.days}
              onChange={(event) => setForm((prev) => ({...prev, days: Number(event.target.value)}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Вместимость зала' : 'Capacity'}
            <input
              type="number"
              min={1}
              max={60}
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({...prev, capacity: Number(event.target.value)}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Слоты (через запятую)' : 'Slots (comma separated)'}
            <input
              type="text"
              value={form.slotTimesRaw}
              onChange={(event) => setForm((prev) => ({...prev, slotTimesRaw: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Вечерняя смена с' : 'Evening shift starts at'}
            <input
              type="text"
              value={form.eveningShiftStartsAt}
              onChange={(event) => setForm((prev) => ({...prev, eveningShiftStartsAt: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Часовой пояс' : 'Timezone offset'}
            <input
              type="text"
              value={form.timezoneOffset}
              onChange={(event) => setForm((prev) => ({...prev, timezoneOffset: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'ID стартового номера' : 'Start sequence'}
            <input
              type="number"
              min={1}
              value={form.sessionStartSeq}
              onChange={(event) => setForm((prev) => ({...prev, sessionStartSeq: Number(event.target.value)}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Финальный шаблон дня' : 'Closing template'}
            <select
              value={form.closingTemplateId}
              onChange={(event) => setForm((prev) => ({...prev, closingTemplateId: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            >
              <option value="">{isRu ? 'Без фиксации' : 'No fixed closing template'}</option>
              {scheduleTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.id}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-state-danger">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button onClick={onGenerate}>{isRu ? 'Сгенерировать' : 'Generate'}</Button>
          <Button variant="secondary" onClick={onApplyToPool}>
            {isRu ? 'Применить в пул' : 'Apply to pool'}
          </Button>
          <Button variant="secondary" onClick={onCopy}>
            {isRu ? 'Скопировать JSON' : 'Copy JSON'}
          </Button>
        </div>
        {applyMessage && <p className="mt-2 text-xs text-state-success">{applyMessage}</p>}
        {copyStatus === 'done' && (
          <p className="mt-2 text-xs text-state-success">{isRu ? 'JSON скопирован.' : 'JSON copied.'}</p>
        )}
        {copyStatus === 'failed' && (
          <p className="mt-2 text-xs text-state-danger">{isRu ? 'Не удалось скопировать JSON.' : 'Failed to copy JSON.'}</p>
        )}
      </Card>

      <Card className="overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-lg font-semibold">{isRu ? 'Предпросмотр сессий' : 'Session preview'}</h4>
          <div className="text-sm text-text-muted">
            {isRu
              ? `Сгенерировано: ${generated.sessions.length}`
              : `Generated: ${generated.sessions.length}`}
          </div>
        </div>

        {generated.issues.length > 0 && (
          <div className="mt-3 rounded-md border border-state-warning/40 bg-state-warning/10 p-3 text-xs text-state-warning">
            <div className="mb-1 font-semibold">{isRu ? 'Предупреждения генератора' : 'Generator warnings'}</div>
            <ul className="list-disc pl-4">
              {generated.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                <th className="py-2 pr-3">{isRu ? 'Старт' : 'Start'}</th>
                <th className="py-2 pr-3">{isRu ? 'Тренировка' : 'Class'}</th>
                <th className="py-2 pr-3">{isRu ? 'Тренер' : 'Trainer'}</th>
                <th className="py-2 pr-3">{isRu ? 'Мин' : 'Min'}</th>
                <th className="py-2 pr-3">{isRu ? 'Уровень' : 'Level'}</th>
                <th className="py-2 pr-3">{isRu ? 'Места' : 'Spots'}</th>
              </tr>
            </thead>
            <tbody>
              {sessionPreview.map((session) => (
                <tr key={session.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(session.startsAt, locale)}</td>
                  <td className="py-2 pr-3">{session.title[locale]}</td>
                  <td className="py-2 pr-3">{trainerNames[session.trainerId] ?? session.trainerId}</td>
                  <td className="py-2 pr-3">{session.durationMin}</td>
                  <td className="py-2 pr-3">{session.level}</td>
                  <td className="py-2 pr-3">
                    {session.bookedCount}/{session.capacity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {generated.sessions.length > sessionPreview.length && (
          <p className="mt-3 text-xs text-text-muted">
            {isRu
              ? `Показаны первые ${sessionPreview.length} записей.`
              : `Showing first ${sessionPreview.length} rows.`}
          </p>
        )}
      </Card>
    </div>
  );
}
