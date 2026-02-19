export const SLOT_DURATION_MIN = 30;
export const MAX_SESSION_DURATION_MIN = 120;
export const DEFAULT_HALL_ID = 'h-main';

export type SlotSessionLike = {
  id: string;
  hallId: string;
  startsAt: string;
  durationMin: number;
};

export type SlotValidationIssue =
  | {
      type: 'invalid_duration';
      sessionId: string;
      durationMin: number;
    }
  | {
      type: 'invalid_start';
      sessionId: string;
      startsAt: string;
    }
  | {
      type: 'slot_conflict';
      hallId: string;
      sessionId: string;
      conflictingSessionId: string;
      slotStartAt: string;
      slotStartMs: number;
    };

type SessionRange = {
  startMs: number;
  endMs: number;
};

function getSessionRange(session: SlotSessionLike): SessionRange | null {
  const slotSpan = getSlotSpanByDuration(session.durationMin);
  if (slotSpan === 0) return null;

  const startMs = new Date(session.startsAt).getTime();
  if (!Number.isFinite(startMs)) return null;

  return {
    startMs,
    endMs: startMs + slotSpan * SLOT_DURATION_MIN * 60_000
  };
}

export function getSlotSpanByDuration(durationMin: number) {
  const roundedDurationMin = getRoundedSessionDurationMin(durationMin);
  if (roundedDurationMin === 0) {
    return 0;
  }
  return roundedDurationMin / SLOT_DURATION_MIN;
}

export function getRoundedSessionDurationMin(durationMin: number) {
  if (!Number.isFinite(durationMin) || durationMin < 1 || durationMin > MAX_SESSION_DURATION_MIN) {
    return 0;
  }
  if (durationMin <= 30) return 30;
  if (durationMin <= 60) return 60;
  if (durationMin <= 90) return 90;
  return 120;
}

export function getOccupiedSlotStartsMs(session: SlotSessionLike) {
  const slotSpan = getSlotSpanByDuration(session.durationMin);
  if (slotSpan === 0) return [];

  const startsAtMs = new Date(session.startsAt).getTime();
  if (!Number.isFinite(startsAtMs)) return [];

  return Array.from({length: slotSpan}, (_, index) => startsAtMs + index * SLOT_DURATION_MIN * 60_000);
}

export function findPlacementIssueForSession(
  session: SlotSessionLike,
  sessions: SlotSessionLike[]
): SlotValidationIssue | null {
  const currentRange = getSessionRange(session);
  if (!currentRange) {
    const slotSpan = getSlotSpanByDuration(session.durationMin);
    if (slotSpan === 0) {
      return {type: 'invalid_duration', sessionId: session.id, durationMin: session.durationMin};
    }
    return {type: 'invalid_start', sessionId: session.id, startsAt: session.startsAt};
  }

  for (const other of sessions) {
    if (other.id === session.id) continue;
    if (other.hallId !== session.hallId) continue;

    const otherRange = getSessionRange(other);
    if (!otherRange) continue;

    if (currentRange.startMs < otherRange.endMs && otherRange.startMs < currentRange.endMs) {
      const slotStartAt = currentRange.startMs >= otherRange.startMs ? session.startsAt : other.startsAt;
      return {
        type: 'slot_conflict',
        hallId: session.hallId,
        sessionId: session.id,
        conflictingSessionId: other.id,
        slotStartAt,
        slotStartMs: Math.max(currentRange.startMs, otherRange.startMs)
      };
    }
  }

  return null;
}

export function findFirstHallSlotIssue(sessions: SlotSessionLike[]): SlotValidationIssue | null {
  const byHall = new Map<string, Array<{id: string; startsAt: string; startMs: number; endMs: number}>>();
  const sorted = [...sessions].sort((left, right) => left.startsAt.localeCompare(right.startsAt));

  for (const session of sorted) {
    const slotSpan = getSlotSpanByDuration(session.durationMin);
    if (slotSpan === 0) {
      return {type: 'invalid_duration', sessionId: session.id, durationMin: session.durationMin};
    }

    const startsAtMs = new Date(session.startsAt).getTime();
    if (!Number.isFinite(startsAtMs)) {
      return {type: 'invalid_start', sessionId: session.id, startsAt: session.startsAt};
    }

    const endMs = startsAtMs + slotSpan * SLOT_DURATION_MIN * 60_000;
    if (!byHall.has(session.hallId)) {
      byHall.set(session.hallId, []);
    }
    byHall.get(session.hallId)?.push({id: session.id, startsAt: session.startsAt, startMs: startsAtMs, endMs});
  }

  for (const [hallId, items] of byHall.entries()) {
    items.sort((left, right) => left.startMs - right.startMs);

    for (let index = 0; index < items.length; index += 1) {
      const current = items[index];
      for (let nextIndex = index + 1; nextIndex < items.length; nextIndex += 1) {
        const next = items[nextIndex];
        if (next.startMs >= current.endMs) break;
        if (current.id === next.id) continue;

        if (current.startMs < next.endMs && next.startMs < current.endMs) {
          const overlapStartMs = Math.max(current.startMs, next.startMs);
          return {
            type: 'slot_conflict',
            hallId,
            sessionId: next.id,
            conflictingSessionId: current.id,
            slotStartAt: next.startsAt,
            slotStartMs: overlapStartMs
          };
        }
      }
    }
  }

  return null;
}
