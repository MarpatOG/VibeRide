import {Trainer} from '@/lib/types/trainer';

export function getTrainerFullName(trainer: Trainer) {
  return `${trainer.name} ${trainer.lastName}`.trim();
}

export function getTrainerShortName(trainer: Trainer) {
  const initial = trainer.lastName.trim().charAt(0);
  if (!initial) return trainer.name;
  return `${trainer.name} ${initial}.`;
}

