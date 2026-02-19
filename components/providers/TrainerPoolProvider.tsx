'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {Localized} from '@/lib/types/localized';
import {Trainer} from '@/lib/types/trainer';

type NewTrainerInput = {
  name: string;
  lastName: string;
  photoUrl: string;
  tags: string[];
  bio: Localized;
};

type TrainerPoolContextValue = {
  trainers: Trainer[];
  addTrainer: (payload: NewTrainerInput) => Trainer | null;
  updateTrainer: (trainerId: string, payload: NewTrainerInput) => Trainer | null;
  removeTrainer: (trainerId: string) => void;
  resetTrainers: () => void;
};

const TrainerPoolContext = createContext<TrainerPoolContextValue | null>(null);

function normalizeTag(tag: string) {
  return tag.trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9Р°-СЏС‘]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function createTrainerId(name: string, list: Trainer[]) {
  const base = slugify(name) || 'trainer';
  const existing = new Set(list.map((item) => item.id));
  let seq = 1;
  let candidate = `t-${base}`;
  while (existing.has(candidate)) {
    seq += 1;
    candidate = `t-${base}-${seq}`;
  }
  return candidate;
}

function isTrainerArray(value: unknown): value is Trainer[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Trainer).id === 'string' &&
      typeof (item as Trainer).name === 'string' &&
      typeof (item as Trainer).lastName === 'string' &&
      typeof (item as Trainer).photoUrl === 'string' &&
      Array.isArray((item as Trainer).tags) &&
      typeof (item as Trainer).bio?.ru === 'string' &&
      typeof (item as Trainer).bio?.en === 'string'
  );
}

export function TrainerPoolProvider({children}: {children: React.ReactNode}) {
  const [trainerPool, setTrainerPool] = useState<Trainer[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/trainers', {cache: 'no-store'});
        if (!response.ok) {
          const details = await response.text().catch(() => '');
          console.error(
            `Unable to load trainers from DB API. HTTP ${response.status}${details ? `: ${details}` : ''}`
          );
          if (!cancelled) setTrainerPool([]);
          return;
        }
        const parsed = (await response.json()) as Trainer[];
        if (!cancelled && isTrainerArray(parsed)) {
          setTrainerPool(parsed);
        }
      } catch (error) {
        console.error('Unable to load trainers from DB API.', error);
        if (!cancelled) setTrainerPool([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<TrainerPoolContextValue>(
    () => ({
      trainers: trainerPool,
      addTrainer: (payload) => {
        const name = payload.name.trim();
        const lastName = payload.lastName.trim();
        const photoUrl = payload.photoUrl.trim();
        const tags = payload.tags.map(normalizeTag).filter(Boolean);
        const bioRu = payload.bio.ru.trim();
        const bioEn = payload.bio.en.trim();

        if (!name || !lastName || !photoUrl || !bioRu || !bioEn) {
          return null;
        }

        const next: Trainer = {
          id: createTrainerId(name, trainerPool),
          name,
          lastName,
          photoUrl,
          tags,
          bio: {ru: bioRu, en: bioEn}
        };

        setTrainerPool((prev) => [...prev, next]);
        void fetch('/api/trainers', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(next)
        }).catch((error) => {
          console.error('Unable to persist trainer creation to DB.', error);
        });
        return next;
      },
      updateTrainer: (trainerId, payload) => {
        const existing = trainerPool.find((item) => item.id === trainerId);
        if (!existing) return null;

        const name = payload.name.trim();
        const lastName = payload.lastName.trim();
        const photoUrl = payload.photoUrl.trim();
        const tags = payload.tags.map(normalizeTag).filter(Boolean);
        const bioRu = payload.bio.ru.trim();
        const bioEn = payload.bio.en.trim();

        if (!name || !lastName || !photoUrl || !bioRu || !bioEn) {
          return null;
        }

        const updated: Trainer = {
          ...existing,
          name,
          lastName,
          photoUrl,
          tags,
          bio: {ru: bioRu, en: bioEn}
        };

        setTrainerPool((prev) => prev.map((item) => (item.id === trainerId ? updated : item)));
        void fetch(`/api/trainers/${encodeURIComponent(trainerId)}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updated)
        }).catch((error) => {
          console.error('Unable to persist trainer update to DB.', error);
        });
        return updated;
      },
      removeTrainer: (trainerId) => {
        setTrainerPool((prev) => prev.filter((item) => item.id !== trainerId));
        void fetch(`/api/trainers/${encodeURIComponent(trainerId)}`, {method: 'DELETE'}).catch((error) => {
          console.error('Unable to persist trainer deletion to DB.', error);
        });
      },
      resetTrainers: () => {
        setTrainerPool([]);
        void fetch('/api/trainers', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify([])
        }).catch((error) => {
          console.error('Unable to reset trainers in DB.', error);
        });
      }
    }),
    [trainerPool]
  );

  return <TrainerPoolContext.Provider value={value}>{children}</TrainerPoolContext.Provider>;
}

export function useTrainerPool() {
  const context = useContext(TrainerPoolContext);
  if (!context) {
    throw new Error('useTrainerPool must be used within TrainerPoolProvider');
  }
  return context;
}
