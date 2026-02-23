'use client';

import {useMemo, useState} from 'react';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import {WORKOUT_TYPES, getWorkoutTypeBySessionTitle} from '@/lib/data/workout-types';
import {Locale} from '@/lib/locale';
import {useLocale} from '@/lib/locale-client';
import {useSchedule} from '@/components/blocks/schedule/schedule-context';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {
  INTENSITY_VALUES,
  IntensityValue,
  getIntensityBySession,
  getIntensityOptionLabelByValue
} from '@/components/ui/IntensityScale';
import {Session} from '@/lib/types/session';
import {getTrainerFullName} from '@/lib/utils/trainer';

type IntensityFilter = '' | `${IntensityValue}`;
const DAYS_IN_WEEK = 7;
const VISIBLE_WEEKS = 2;

type Filters = {
  trainerId: string;
  difficulty: IntensityFilter;
  trainingType: string;
};

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function getLocalDateIso(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function matchesFilters(session: Session, filters: Filters) {
  const workoutType = getWorkoutTypeBySessionTitle(session.title);
  const sessionTrainingTypeId = workoutType?.scheduleTemplateId ?? '';
  const sessionIntensity = getIntensityBySession(session.level, session.title);

  const trainerOk = !filters.trainerId || filters.trainerId === session.trainerId;
  const difficultyOk = !filters.difficulty || filters.difficulty === `${sessionIntensity}`;
  const trainingTypeOk = !filters.trainingType || filters.trainingType === sessionTrainingTypeId;

  return trainerOk && difficultyOk && trainingTypeOk;
}

export default function ScheduleFiltersBlock({
  showTrainerFilter,
  showLevelFilter,
  defaultView
}: {
  showTrainerFilter: boolean;
  showLevelFilter?: boolean;
  defaultView: 'day' | 'week';
  locale?: Locale;
}) {
  void defaultView;
  const locale = useLocale() as Locale;
  const {trainerFilter, setTrainerFilter, difficultyFilter, setDifficultyFilter, trainingTypeFilter, setTrainingTypeFilter} =
    useSchedule();
  const {trainers} = useTrainerPool();
  const {sessions} = useSessionPool();
  const [open, setOpen] = useState(false);

  const todayIso = useMemo(() => getLocalDateIso(new Date()), []);
  const nextWeekEndIso = useMemo(() => addDaysToIso(getStartOfWeekIso(todayIso), DAYS_IN_WEEK * VISIBLE_WEEKS - 1), [todayIso]);
  const availableSessions = useMemo(
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

  const intensityCounts = useMemo(() => {
    const counts: Record<IntensityFilter, number> = {'': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0};
    counts[''] = availableSessions.filter((session) =>
      matchesFilters(session, {trainerId: trainerFilter, difficulty: '', trainingType: trainingTypeFilter})
    ).length;
    for (const intensity of INTENSITY_VALUES) {
      const key = `${intensity}` as IntensityFilter;
      counts[key] = availableSessions.filter((session) =>
        matchesFilters(session, {trainerId: trainerFilter, difficulty: key, trainingType: trainingTypeFilter})
      ).length;
    }
    return counts;
  }, [availableSessions, trainerFilter, trainingTypeFilter]);

  const trainingTypeCounts = useMemo(() => {
    const map = new Map<string, number>();
    const anyCount = availableSessions.filter((session) =>
      matchesFilters(session, {
        trainerId: trainerFilter,
        difficulty: difficultyFilter,
        trainingType: ''
      })
    ).length;
    map.set('', anyCount);

    for (const type of WORKOUT_TYPES) {
      const count = availableSessions.filter((session) =>
        matchesFilters(session, {
          trainerId: trainerFilter,
          difficulty: difficultyFilter,
          trainingType: type.scheduleTemplateId
        })
      ).length;
      map.set(type.scheduleTemplateId, count);
    }

    return map;
  }, [availableSessions, trainerFilter, difficultyFilter]);

  const trainerCounts = useMemo(() => {
    const map = new Map<string, number>();
    const allCount = availableSessions.filter((session) =>
      matchesFilters(session, {
        trainerId: '',
        difficulty: difficultyFilter,
        trainingType: trainingTypeFilter
      })
    ).length;
    map.set('', allCount);

    for (const trainer of trainers) {
      const count = availableSessions.filter((session) =>
        matchesFilters(session, {
          trainerId: trainer.id,
          difficulty: difficultyFilter,
          trainingType: trainingTypeFilter
        })
      ).length;
      map.set(trainer.id, count);
    }

    return map;
  }, [availableSessions, trainers, difficultyFilter, trainingTypeFilter]);

  const FiltersContent = () => (
    <div className="flex flex-wrap items-end gap-3">
        {showLevelFilter && (
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
              {locale === 'ru' ? 'Интенсивность' : 'Intensity'}
            </span>
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as IntensityFilter)}
              className="h-11 rounded-lg border border-border/80 bg-bg px-3 text-sm text-text shadow-sm"
            >
              <option value="">{`${locale === 'ru' ? 'Любая' : 'Any'} (${intensityCounts['']})`}</option>
              {INTENSITY_VALUES.map((value) => {
                const key = `${value}` as IntensityFilter;
                const count = intensityCounts[key];
                return (
                  <option key={value} value={key} disabled={count === 0 && difficultyFilter !== key}>
                    {`${getIntensityOptionLabelByValue(value, locale)} (${count})`}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {locale === 'ru' ? 'Тип тренировки' : 'Training type'}
          </span>
          <select
            value={trainingTypeFilter}
            onChange={(event) => setTrainingTypeFilter(event.target.value)}
            className="h-11 rounded-lg border border-border/80 bg-bg px-3 text-sm text-text shadow-sm"
          >
            <option value="">{`${locale === 'ru' ? 'Любой' : 'Any'} (${trainingTypeCounts.get('') ?? 0})`}</option>
            {WORKOUT_TYPES.map((type) => {
              const count = trainingTypeCounts.get(type.scheduleTemplateId) ?? 0;
              return (
                <option
                  key={type.id}
                  value={type.scheduleTemplateId}
                  disabled={count === 0 && trainingTypeFilter !== type.scheduleTemplateId}
                >
                  {`${type.name} (${count})`}
                </option>
              );
            })}
          </select>
        </div>

        {showTrainerFilter && (
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
              {locale === 'ru' ? 'Тренер' : 'Trainer'}
            </span>
            <select
              value={trainerFilter}
              onChange={(event) => setTrainerFilter(event.target.value)}
              className="h-11 rounded-lg border border-border/80 bg-bg px-3 text-sm text-text shadow-sm"
            >
              <option value="">{`${locale === 'ru' ? 'Все' : 'All'} (${trainerCounts.get('') ?? 0})`}</option>
              {trainers.map((trainer) => {
                const count = trainerCounts.get(trainer.id) ?? 0;
                return (
                  <option key={trainer.id} value={trainer.id} disabled={count === 0 && trainerFilter !== trainer.id}>
                    {`${getTrainerFullName(trainer)} (${count})`}
                  </option>
                );
              })}
            </select>
          </div>
        )}
    </div>
  );

  return (
    <section className="container-schedule py-5 md:py-7">
      <div className="rounded-2xl border border-border/80 bg-bg-elevated p-3 shadow-sm md:p-4">
        <div className="hidden md:block">
          <FiltersContent />
        </div>

        <div className="md:hidden">
          <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
            {locale === 'ru' ? 'Фильтры' : 'Filters'}
          </Button>
        </div>

        <Drawer open={open} onClose={() => setOpen(false)} title={locale === 'ru' ? 'Фильтры' : 'Filters'}>
          <FiltersContent />
        </Drawer>
      </div>
    </section>
  );
}
