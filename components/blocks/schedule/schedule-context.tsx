'use client';

import {createContext, useContext, useEffect, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {Session} from '@/lib/types/session';
import {resolveWorkoutTypeFilterValue} from '@/lib/data/workout-types';

type ScheduleContextValue = {
  selected: Session | null;
  setSelected: (session: Session | null) => void;
  trainerFilter: string;
  setTrainerFilter: (trainerId: string) => void;
  difficultyFilter: '' | Session['level'];
  setDifficultyFilter: (difficulty: '' | Session['level']) => void;
  trainingTypeFilter: string;
  setTrainingTypeFilter: (trainingType: string) => void;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({children}: {children: React.ReactNode}) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Session | null>(null);
  const [trainerFilter, setTrainerFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'' | Session['level']>('');
  const [trainingTypeFilter, setTrainingTypeFilter] = useState('');
  const requestedType = searchParams.get('type') ?? '';

  useEffect(() => {
    if (!requestedType) return;
    const resolved = resolveWorkoutTypeFilterValue(requestedType);
    if (resolved) {
      setTrainingTypeFilter(resolved);
    }
  }, [requestedType]);

  return (
    <ScheduleContext.Provider
      value={{
        selected,
        setSelected,
        trainerFilter,
        setTrainerFilter,
        difficultyFilter,
        setDifficultyFilter,
        trainingTypeFilter,
        setTrainingTypeFilter
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }
  return context;
}
