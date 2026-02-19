'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {dayNumberToDateIso} from '@/lib/schedule/static-day';
import {DEFAULT_HALL_ID} from '@/lib/schedule/slot-rules';
import {Session} from '@/lib/types/session';

type NewSessionInput = {
  hallId?: string;
  dayNumber: number;
  time: string;
  timezoneOffset?: string;
  durationMin: number;
  title: Session['title'];
  subtitle: Session['subtitle'];
  description: Session['description'];
  isThematic?: boolean;
  trainerId: string;
  trainerDetached?: boolean;
  capacity: number;
  bookedCount?: number;
  level: Session['level'];
};

type SessionPoolContextValue = {
  sessions: Session[];
  addSession: (payload: NewSessionInput) => Session | null;
  updateSession: (sessionId: string, payload: Partial<NewSessionInput>) => Session | null;
  removeSession: (sessionId: string) => void;
  replaceSessions: (next: Session[]) => Promise<{ok: true; sessions: Session[]} | {ok: false; error: string; status?: number}>;
  resetSessions: () => Promise<{ok: true} | {ok: false; error: string; status?: number}>;
};

const SessionPoolContext = createContext<SessionPoolContextValue | null>(null);

function sortSessions(list: Session[]) {
  return [...list].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

function createSessionId(list: Session[]) {
  const existing = new Set(list.map((item) => item.id));
  let seq = 1;
  let candidate = `s-custom-${seq}`;
  while (existing.has(candidate)) {
    seq += 1;
    candidate = `s-custom-${seq}`;
  }
  return candidate;
}

function normalizeSession(session: Session): Session {
  return {
    ...session,
    hallId: session.hallId || DEFAULT_HALL_ID,
    isThematic: Boolean(session.isThematic),
    trainerDetached: Boolean(session.trainerDetached)
  };
}

function isSessionArray(value: unknown): value is Session[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Session).id === 'string' &&
      typeof (item as Session).startsAt === 'string' &&
      typeof (item as Session).durationMin === 'number' &&
      typeof (item as Session).capacity === 'number' &&
      typeof (item as Session).bookedCount === 'number'
  );
}

async function parseApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as {message?: string; error?: string};
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore JSON parse failures
  }
  return fallback;
}

export function SessionPoolProvider({children}: {children: React.ReactNode}) {
  const [sessionPool, setSessionPool] = useState<Session[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/sessions', {cache: 'no-store'});
        if (!response.ok) {
          const details = await response.text().catch(() => '');
          console.error(
            `Unable to load sessions from DB API. HTTP ${response.status}${details ? `: ${details}` : ''}`
          );
          if (!cancelled) setSessionPool([]);
          return;
        }
        const parsed = (await response.json()) as Session[];
        if (!cancelled && isSessionArray(parsed)) {
          setSessionPool(sortSessions(parsed.map((item) => normalizeSession(item))));
        }
      } catch (error) {
        console.error('Unable to load sessions from DB API.', error);
        if (!cancelled) setSessionPool([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionPoolContextValue>(
    () => ({
      sessions: sessionPool,
      addSession: (payload) => {
        const tz = payload.timezoneOffset ?? '+03:00';
        if (!payload.dayNumber || !payload.time) return null;
        const dateIso = dayNumberToDateIso(payload.dayNumber);
        const startsAt = `${dateIso}T${payload.time}:00${tz}`;
        const next: Session = {
          id: createSessionId(sessionPool),
          hallId: payload.hallId ?? DEFAULT_HALL_ID,
          startsAt,
          durationMin: payload.durationMin,
          title: payload.title,
          subtitle: payload.subtitle,
          description: payload.description,
          isThematic: Boolean(payload.isThematic),
          trainerId: payload.trainerId,
          trainerDetached: Boolean(payload.trainerDetached),
          capacity: payload.capacity,
          bookedCount: Math.min(payload.bookedCount ?? 0, payload.capacity),
          level: payload.level
        };
        setSessionPool((prev) => sortSessions([...prev, next]));
        void fetch('/api/sessions', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(next)
        }).catch((error) => {
          console.error('Unable to persist session creation to DB.', error);
        });
        return next;
      },
      updateSession: (sessionId, payload) => {
        const existing = sessionPool.find((item) => item.id === sessionId);
        if (!existing) return null;

        const currentDateIso = existing.startsAt.slice(0, 10);
        const currentTime = existing.startsAt.slice(11, 16);
        const currentTimezoneOffset = existing.startsAt.slice(19) || '+03:00';

        const dateIso = payload.dayNumber ? dayNumberToDateIso(payload.dayNumber) : currentDateIso;
        const time = payload.time ?? currentTime;
        const timezoneOffset = payload.timezoneOffset ?? currentTimezoneOffset;
        const capacity = payload.capacity ?? existing.capacity;
        const bookedCount = Math.min(payload.bookedCount ?? existing.bookedCount, capacity);

        const updated: Session = {
          ...existing,
          hallId: payload.hallId ?? existing.hallId ?? DEFAULT_HALL_ID,
          startsAt: `${dateIso}T${time}:00${timezoneOffset}`,
          durationMin: payload.durationMin ?? existing.durationMin,
          title: payload.title ?? existing.title,
          subtitle: payload.subtitle ?? existing.subtitle,
          description: payload.description ?? existing.description,
          isThematic: payload.isThematic ?? existing.isThematic,
          trainerId: payload.trainerId ?? existing.trainerId,
          trainerDetached: payload.trainerDetached ?? existing.trainerDetached ?? false,
          capacity,
          bookedCount,
          level: payload.level ?? existing.level
        };

        setSessionPool((prev) => sortSessions(prev.map((item) => (item.id === sessionId ? updated : item))));
        void fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updated)
        }).catch((error) => {
          console.error('Unable to persist session update to DB.', error);
        });
        return updated;
      },
      removeSession: (sessionId) => {
        setSessionPool((prev) => prev.filter((item) => item.id !== sessionId));
        void fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {method: 'DELETE'}).catch((error) => {
          console.error('Unable to persist session deletion to DB.', error);
        });
      },
      replaceSessions: async (next) => {
        const previous = sessionPool;
        const normalized = sortSessions(next.map((item) => normalizeSession(item)));
        setSessionPool(normalized);

        try {
          const response = await fetch('/api/sessions', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(normalized)
          });

          if (!response.ok) {
            const error = await parseApiError(response, `HTTP ${response.status}`);
            setSessionPool(previous);
            return {ok: false as const, error, status: response.status};
          }

          const parsed = (await response.json()) as Session[];
          if (isSessionArray(parsed)) {
            const synced = sortSessions(parsed.map((item) => normalizeSession(item)));
            setSessionPool(synced);
            return {ok: true as const, sessions: synced};
          }

          return {ok: true as const, sessions: normalized};
        } catch (error) {
          setSessionPool(previous);
          console.error('Unable to persist sessions replace to DB.', error);
          return {
            ok: false as const,
            error: error instanceof Error ? error.message : 'Unable to save schedule changes.'
          };
        }
      },
      resetSessions: async () => {
        const previous = sessionPool;
        setSessionPool([]);

        try {
          const response = await fetch('/api/sessions', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify([])
          });

          if (!response.ok) {
            const error = await parseApiError(response, `HTTP ${response.status}`);
            setSessionPool(previous);
            return {ok: false as const, error, status: response.status};
          }

          return {ok: true as const};
        } catch (error) {
          setSessionPool(previous);
          console.error('Unable to reset sessions in DB.', error);
          return {
            ok: false as const,
            error: error instanceof Error ? error.message : 'Unable to reset schedule.'
          };
        }
      }
    }),
    [sessionPool]
  );

  return <SessionPoolContext.Provider value={value}>{children}</SessionPoolContext.Provider>;
}

export function useSessionPool() {
  const context = useContext(SessionPoolContext);
  if (!context) {
    throw new Error('useSessionPool must be used within SessionPoolProvider');
  }
  return context;
}
