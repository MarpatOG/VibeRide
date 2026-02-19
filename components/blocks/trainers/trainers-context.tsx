'use client';

import {createContext, useContext, useState} from 'react';
import {Trainer} from '@/lib/types/trainer';

type TrainersContextValue = {
  selected: Trainer | null;
  setSelected: (trainer: Trainer | null) => void;
};

const TrainersContext = createContext<TrainersContextValue | null>(null);

export function TrainersProvider({children}: {children: React.ReactNode}) {
  const [selected, setSelected] = useState<Trainer | null>(null);

  return (
    <TrainersContext.Provider value={{selected, setSelected}}>
      {children}
    </TrainersContext.Provider>
  );
}

export function useTrainers() {
  const context = useContext(TrainersContext);
  if (!context) {
    throw new Error('useTrainers must be used within TrainersProvider');
  }
  return context;
}
