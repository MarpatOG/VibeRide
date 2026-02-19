'use client';

import {t} from '@/lib/utils/localized';
import {getTrainerFullName} from '@/lib/utils/trainer';
import {Locale} from '@/lib/locale';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {useTrainers} from '@/components/blocks/trainers/trainers-context';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';

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
  Sprint: 'Спринт'
};

function localizeTag(tag: string, locale: Locale) {
  if (locale !== 'ru') return tag;
  return tagRuMap[tag] ?? tag;
}

export default function TrainerGridBlock({
  showTagsFilter,
  locale
}: {
  showTagsFilter?: boolean;
  locale: Locale;
}) {
  void showTagsFilter;
  const {setSelected} = useTrainers();
  const {trainers} = useTrainerPool();

  return (
    <section className="container-wide">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trainers.map((trainer) => {
          const fullName = getTrainerFullName(trainer);
          return (
            <Card
              key={trainer.id}
              className="mx-auto flex h-full w-full max-w-[340px] cursor-pointer flex-col transition-transform hover:-translate-y-0.5"
              role="button"
              tabIndex={0}
              onClick={() => setSelected(trainer)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelected(trainer);
                }
              }}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-xl">
                <img src={trainer.photoUrl} alt={fullName} className="h-full w-full object-cover" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">{fullName}</h4>
              <p className="line-clamp-3 text-sm text-text-muted">{t(trainer.bio, locale)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {trainer.tags.map((tag) => (
                  <Badge key={tag}>{localizeTag(tag, locale)}</Badge>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
