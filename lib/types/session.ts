import {Localized} from '@/lib/types/localized';

export type SessionLevel = 'beginner' | 'intermediate' | 'advanced';

export type Session = {
  id: string;
  hallId: string;
  startsAt: string;
  durationMin: number;
  title: Localized;
  subtitle: Localized;
  description: Localized;
  isThematic: boolean;
  trainerId: string;
  trainerDetached?: boolean;
  capacity: number;
  bookedCount: number;
  level: SessionLevel;
};

