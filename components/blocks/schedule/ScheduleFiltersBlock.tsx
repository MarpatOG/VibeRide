'use client';

import {useState} from 'react';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import {WORKOUT_TYPES} from '@/lib/data/workout-types';
import {Locale} from '@/lib/locale';
import {useLocale} from '@/lib/locale-client';
import {useSchedule} from '@/components/blocks/schedule/schedule-context';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {getIntensityOptionLabel} from '@/components/ui/IntensityScale';
import {Session} from '@/lib/types/session';
import {getTrainerFullName} from '@/lib/utils/trainer';

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
  const [open, setOpen] = useState(false);

  const FiltersContent = () => (
    <div className="flex flex-wrap items-end gap-2">
      {showLevelFilter && (
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-xs text-text-muted">{locale === 'ru' ? 'Интенсивность' : 'Intensity'}</span>
          <select
            value={difficultyFilter}
            onChange={(event) => setDifficultyFilter(event.target.value as '' | Session['level'])}
            className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm text-text"
          >
            <option value="">{locale === 'ru' ? 'Любая' : 'Any'}</option>
            <option value="beginner">{getIntensityOptionLabel('beginner', locale)}</option>
            <option value="intermediate">{getIntensityOptionLabel('intermediate', locale)}</option>
            <option value="advanced">{getIntensityOptionLabel('advanced', locale)}</option>
          </select>
        </div>
      )}
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <span className="text-xs text-text-muted">{locale === 'ru' ? 'Тип тренировки' : 'Training type'}</span>
        <select
          value={trainingTypeFilter}
          onChange={(event) => setTrainingTypeFilter(event.target.value)}
          className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm text-text"
        >
          <option value="">{locale === 'ru' ? 'Любой' : 'Any'}</option>
          {WORKOUT_TYPES.map((type) => (
            <option key={type.id} value={type.scheduleTemplateId}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      {showTrainerFilter && (
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-xs text-text-muted">{locale === 'ru' ? 'Тренер' : 'Trainer'}</span>
          <select
            value={trainerFilter}
            onChange={(event) => setTrainerFilter(event.target.value)}
            className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm text-text"
          >
            <option value="">{locale === 'ru' ? 'Все' : 'All'}</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {getTrainerFullName(trainer)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <section className="container-wide py-6 md:py-8">
      <div>
        <div className="hidden md:block">
          <FiltersContent />
        </div>
        <div className="md:hidden">
          <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
            {locale === 'ru' ? 'Фильтр' : 'Filter'}
          </Button>
        </div>
        <Drawer open={open} onClose={() => setOpen(false)} title={locale === 'ru' ? 'Фильтры' : 'Filters'}>
          <FiltersContent />
        </Drawer>
      </div>
    </section>
  );
}
