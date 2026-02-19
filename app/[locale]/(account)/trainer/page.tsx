import Card from '@/components/ui/Card';
import {db} from '@/lib/db';
import {Locale} from '@/lib/locale';
import TrainerScheduleMatrix from '@/components/blocks/trainer/TrainerScheduleMatrix';

const TARGET_TRAINER_ID = 't-arseny';

function getDateKey(startsAt: string) {
  return startsAt.slice(0, 10);
}

export default async function TrainerPage({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const isRu = locale === 'ru';

  const [trainer, trainerUser] = await Promise.all([
    db.trainer.findUnique({where: {id: TARGET_TRAINER_ID}}),
    db.user.findFirst({
      where: {role: 'trainer'},
      orderBy: {createdAt: 'asc'},
      select: {email: true}
    })
  ]);

  if (!trainer) {
    return (
      <section className="container-wide">
        <h1>{isRu ? 'Кабинет тренера' : 'Trainer dashboard'}</h1>
        <p className="mt-3 text-sm text-text-muted">
          {isRu ? 'Тренер Андрей Титов не найден.' : 'Trainer Andrey Titov was not found.'}
        </p>
      </section>
    );
  }

  const sessions = await db.session.findMany({
    where: {
      trainerId: trainer.id,
      trainerDetached: false
    },
    orderBy: {startsAt: 'asc'},
    select: {
      id: true,
      startsAt: true,
      durationMin: true,
      titleRu: true,
      titleEn: true,
      subtitleRu: true,
      subtitleEn: true,
      capacity: true,
      bookedCount: true,
      level: true
    }
  });

  const uniqueDays = Array.from(new Set(sessions.map((session) => getDateKey(session.startsAt))));
  const sessionsByDay = new Map<string, typeof sessions>();
  uniqueDays.forEach((day) => sessionsByDay.set(day, sessions.filter((session) => getDateKey(session.startsAt) === day)));

  const dayGroups = uniqueDays.map((day) => ({
    day,
    sessions: sessionsByDay.get(day) ?? []
  }));

  const fullName = `${trainer.lastName} ${trainer.name}`.trim();
  const email = trainerUser?.email ?? 'trainer@viberide.demo';

  return (
    <section className="container-wide">
      <h1>{isRu ? 'Кабинет тренера' : 'Trainer dashboard'}</h1>
      <p className="mt-2 text-sm text-text-muted">
        {isRu ? 'Персональное расписание и матрица тренировок тренера.' : 'Personal schedule and training matrix for this trainer.'}
      </p>

      <Card className="mt-6 p-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-bg-tertiary">
            <img src={trainer.photoUrl} alt={fullName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{fullName}</div>
            <div className="truncate text-sm text-text-muted">{email}</div>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Card className="min-w-0 overflow-hidden p-5">
          <h4 className="text-lg font-semibold">{isRu ? 'Ваше расписание' : 'Your schedule'}</h4>
          <p className="mt-2 text-sm text-text-muted">
            {isRu ? 'Здесь отображаются только ваши занятия по дням.' : 'Only your sessions are shown here by day.'}
          </p>

          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
              {isRu ? 'У тренера пока нет занятий в расписании.' : 'No sessions scheduled for this trainer yet.'}
            </div>
          ) : (
            <div className="mt-4">
              <TrainerScheduleMatrix dayGroups={dayGroups} locale={locale} />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
