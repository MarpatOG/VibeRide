'use client';

import {useMemo} from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {Locale} from '@/lib/locale';
import {useTrainers} from '@/components/blocks/trainers/trainers-context';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {t} from '@/lib/utils/localized';
import {getTrainerFullName} from '@/lib/utils/trainer';

const tagRuMap: Record<string, string> = {
  HIIT: 'HIIT',
  Performance: 'Performance',
  Beginner: 'Новичок',
  Groove: 'Ритм',
  Endurance: 'Выносливость',
  Power: 'Сила',
  Rhythm: 'Ритм',
  Technique: 'Техника',
  Tempo: 'Темп',
  Recovery: 'Восстановление',
  Sprint: 'Спринт',
  Flow: 'Поток',
  Strength: 'Сила'
};

function localizeTag(tag: string, locale: Locale) {
  if (locale !== 'ru') return tag;
  return tagRuMap[tag] ?? tag;
}

function formatSessionDateTime(startsAt: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
    .format(new Date(startsAt))
    .replace(',', ' ·');
}

export default function TrainerProfileDrawerBlock({
  showUpcomingSessions,
  maxUpcoming,
  locale
}: {
  showUpcomingSessions: boolean;
  maxUpcoming: number;
  locale: Locale;
}) {
  const {selected, setSelected} = useTrainers();
  const {sessions} = useSessionPool();

  const trainerSessions = useMemo(
    () =>
      selected
        ? sessions
            .filter((session) => session.trainerId === selected.id)
            .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
        : [],
    [selected, sessions]
  );

  const upcoming = useMemo(
    () =>
      trainerSessions
        .filter((session) => new Date(session.startsAt).getTime() > Date.now())
        .slice(0, maxUpcoming),
    [maxUpcoming, trainerSessions]
  );

  const specializationTitles = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const session of trainerSessions) {
      const key = `${session.title.ru}|${session.title.en}`;
      if (byKey.has(key)) continue;
      byKey.set(key, t(session.title, locale));
    }
    return [...byKey.values()];
  }, [locale, trainerSessions]);

  if (!selected) {
    return null;
  }

  const fullName = getTrainerFullName(selected);

  return (
    <Modal
      open={Boolean(selected)}
      onClose={() => setSelected(null)}
      title={locale === 'ru' ? 'Профиль тренера' : 'Trainer profile'}
      className="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-bg-tertiary">
            <img src={selected.photoUrl} alt={fullName} className="h-full min-h-[320px] w-full object-cover" />
          </div>

          <div className="min-w-0 space-y-5">
            <div className="space-y-2">
              <h3 className="text-2xl leading-tight font-semibold">{fullName}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{t(selected.bio, locale)}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                {locale === 'ru' ? 'Специализация тренировок' : 'Training specializations'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {specializationTitles.length === 0 && (
                  <div className="rounded-xl border border-border p-3 text-xs text-text-muted">
                    {locale === 'ru' ? 'Специализации пока не указаны.' : 'No specialization data yet.'}
                  </div>
                )}
                {specializationTitles.map((title) => (
                  <Badge key={title}>{title}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{locale === 'ru' ? 'Теги' : 'Tags'}</h4>
              <div className="flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <Badge key={tag}>{localizeTag(tag, locale)}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showUpcomingSessions && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{locale === 'ru' ? 'Ближайшие занятия тренера' : 'Trainer upcoming sessions'}</h4>
            <div className="space-y-2">
              {upcoming.length === 0 && (
                <div className="rounded-xl border border-border p-3 text-xs text-text-muted">
                  {locale === 'ru' ? 'У этого тренера пока нет занятий в расписании.' : 'No sessions scheduled for this trainer yet.'}
                </div>
              )}
              {upcoming.map((session) => (
                <div key={session.id} className="rounded-xl border border-border bg-bg-tertiary/70 p-3">
                  <div className="text-sm font-semibold">{t(session.title, locale)}</div>
                  <div className="text-xs text-text-muted">
                    {formatSessionDateTime(session.startsAt, locale)} · {session.durationMin} {locale === 'ru' ? 'мин' : 'min'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
