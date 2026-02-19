export type SessionLevel = 'beginner' | 'intermediate' | 'advanced';
export type TrainerShift = 'morning' | 'evening';

export type ScheduleTemplate<TLocalized> = {
  id: string;
  durationMin: number;
  level: SessionLevel;
  title: TLocalized;
  subtitle: TLocalized;
  description: TLocalized;
  isThematicDefault?: boolean;
  shifts?: TrainerShift[];
};

export type TrainerCycleRule = {
  trainerId: string;
  shift: TrainerShift;
  cycleOffset: number;
};

export type GeneratedSession<TLocalized> = {
  id: string;
  hallId: string;
  startsAt: string;
  durationMin: number;
  title: TLocalized;
  subtitle: TLocalized;
  description: TLocalized;
  isThematic: boolean;
  trainerId: string;
  capacity: number;
  bookedCount: number;
  level: SessionLevel;
};

export type ScheduleGenerationConfig<TLocalized> = {
  hallId?: string;
  startDate: string;
  days: number;
  timezoneOffset: string;
  slotTimes: string[];
  capacity: number;
  templates: ScheduleTemplate<TLocalized>[];
  trainerRules: TrainerCycleRule[];
  closingTemplateId?: string;
  eveningShiftStartsAt?: string;
  sessionIdPrefix?: string;
  sessionStartSeq?: number;
};

type GenerationResult<TLocalized> = {
  sessions: GeneratedSession<TLocalized>[];
  issues: string[];
};

function addDays(dateIso: string, days: number) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isTrainerWorking(dayIndex: number, cycleOffset: number) {
  const cycleDay = ((dayIndex - cycleOffset) % 4 + 4) % 4;
  return cycleDay < 2;
}

function resolveShift(time: string, eveningShiftStartsAt: string) {
  return time < eveningShiftStartsAt ? 'morning' : 'evening';
}

function pickTrainer(
  shift: TrainerShift,
  dayIndex: number,
  trainerRules: TrainerCycleRule[],
  trainerLoad: Map<string, number>,
  issues: string,
  problemCollector: string[]
) {
  const shiftRules = trainerRules.filter((rule) => rule.shift === shift);
  const activeRules = shiftRules.filter((rule) => isTrainerWorking(dayIndex, rule.cycleOffset));
  const pool = activeRules.length ? activeRules : shiftRules;

  if (pool.length === 0) {
    problemCollector.push(issues);
    return null;
  }
  if (activeRules.length === 0) {
    problemCollector.push(issues);
  }

  pool.sort((left, right) => {
    const leftLoad = trainerLoad.get(left.trainerId) ?? 0;
    const rightLoad = trainerLoad.get(right.trainerId) ?? 0;
    if (leftLoad !== rightLoad) return leftLoad - rightLoad;
    return left.trainerId.localeCompare(right.trainerId);
  });

  const picked = pool[0];
  trainerLoad.set(picked.trainerId, (trainerLoad.get(picked.trainerId) ?? 0) + 1);
  return picked.trainerId;
}

function pickTemplate<TLocalized>(
  templatePool: ScheduleTemplate<TLocalized>[],
  shift: TrainerShift,
  dayUsage: Map<string, number>,
  globalUsage: Map<string, number>,
  lastTemplateId: string | null,
  tieBreakSeed: string
) {
  const eligible = templatePool.filter((item) => !item.shifts || item.shifts.includes(shift));
  if (eligible.length === 0) return null;

  const noImmediateRepeat = eligible.filter((item) => item.id !== lastTemplateId);
  const source = noImmediateRepeat.length > 0 ? noImmediateRepeat : eligible;

  source.sort((left, right) => {
    const leftDay = dayUsage.get(left.id) ?? 0;
    const rightDay = dayUsage.get(right.id) ?? 0;
    if (leftDay !== rightDay) return leftDay - rightDay;

    const leftGlobal = globalUsage.get(left.id) ?? 0;
    const rightGlobal = globalUsage.get(right.id) ?? 0;
    if (leftGlobal !== rightGlobal) return leftGlobal - rightGlobal;

    const leftHash = hashString(`${tieBreakSeed}:${left.id}`);
    const rightHash = hashString(`${tieBreakSeed}:${right.id}`);
    return leftHash - rightHash;
  });

  return source[0];
}

export function generateScheduleSessions<TLocalized>(
  config: ScheduleGenerationConfig<TLocalized>
): GenerationResult<TLocalized> {
  const issues: string[] = [];
  const sessions: GeneratedSession<TLocalized>[] = [];

  const eveningShiftStartsAt = config.eveningShiftStartsAt ?? '16:00';
  const hallId = config.hallId ?? 'h-main';
  const idPrefix = config.sessionIdPrefix ?? 's-';
  let sequence = config.sessionStartSeq ?? 1;

  const closingTemplate = config.closingTemplateId
    ? config.templates.find((template) => template.id === config.closingTemplateId)
    : null;

  const rotatingPool = config.templates.filter((template) => template.id !== closingTemplate?.id);
  const globalUsage = new Map<string, number>();
  const trainerLoad = new Map<string, number>();

  for (let dayIndex = 0; dayIndex < config.days; dayIndex += 1) {
    const date = addDays(config.startDate, dayIndex);
    const dayUsage = new Map<string, number>();
    let previousTemplateId: string | null = null;

    config.slotTimes.forEach((slotTime, slotIndex) => {
      const shift = resolveShift(slotTime, eveningShiftStartsAt);
      const trainerId = pickTrainer(
        shift,
        dayIndex,
        config.trainerRules,
        trainerLoad,
        `No active trainer for ${shift} shift on ${date} ${slotTime}`,
        issues
      );
      if (!trainerId) return;

      const isClosingSlot = Boolean(closingTemplate) && slotIndex === config.slotTimes.length - 1;
      const template = isClosingSlot
        ? closingTemplate
        : pickTemplate(
            rotatingPool,
            shift,
            dayUsage,
            globalUsage,
            previousTemplateId,
            `${date}:${slotTime}:${slotIndex}`
          );

      if (!template) {
        issues.push(`No training template for ${date} ${slotTime} (${shift})`);
        return;
      }

      const demandSeed = hashString(`${date}|${slotTime}|${template.id}|${trainerId}`);
      const bookedCount = Math.min(config.capacity, 6 + (demandSeed % (config.capacity + 5)));

      dayUsage.set(template.id, (dayUsage.get(template.id) ?? 0) + 1);
      globalUsage.set(template.id, (globalUsage.get(template.id) ?? 0) + 1);
      previousTemplateId = template.id;

      sessions.push({
        id: `${idPrefix}${sequence++}`,
        hallId,
        startsAt: `${date}T${slotTime}:00${config.timezoneOffset}`,
        durationMin: template.durationMin,
        title: template.title,
        subtitle: template.subtitle,
        description: template.description,
        isThematic: Boolean(template.isThematicDefault),
        trainerId,
        capacity: config.capacity,
        bookedCount,
        level: template.level
      });
    });
  }

  return {sessions, issues};
}
