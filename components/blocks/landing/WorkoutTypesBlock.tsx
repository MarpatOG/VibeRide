'use client';

import {useState} from 'react';
import Modal from '@/components/ui/Modal';
import IntensityScale from '@/components/ui/IntensityScale';
import {Locale} from '@/lib/locale';
import {WORKOUT_TYPES, WorkoutTypeId, getWorkoutTypeDescription} from '@/lib/data/workout-types';

type WorkoutTypePopupContent = {
  lead: string;
  paragraphs: string[];
  focus: string[];
  closing: string;
};

const WORKOUT_TYPE_POPUP_CONTENT_RU: Record<WorkoutTypeId, WorkoutTypePopupContent> = {
  start: {
    lead: 'Твоя первая поездка. Без стресса — только поток.',
    paragraphs: [
      'Идеальная тренировка для новичков и тех, кто хочет мягко войти в ритм студии.',
      'Мы знакомим тебя с форматом VibeRide: как настроить байк, как работать с сопротивлением, как держать ритм и правильно распределять силы.',
      'Темп умеренный, движения простые и понятные.',
      'Инструктор подробно объясняет технику и поддерживает на каждом этапе.'
    ],
    focus: ['базовая техника', 'комфортный темп', 'уверенность в себе', 'знакомство с атмосферой студии'],
    closing: 'После VibeStart ты уже не новичок.'
  },
  core: {
    lead: 'Основа. Баланс. Настоящий сайклинг.',
    paragraphs: [
      'Это базовая тренировка студии — тот самый фирменный VibeRide.',
      'Сочетание ритмичной езды, работы с сопротивлением и элементов координации под мощный саундтрек.',
      'Средняя и выше средней интенсивность.',
      'Чёткая структура: разгон -> подъёмы -> ускорения -> финальный драйв.'
    ],
    focus: ['выносливость', 'техника', 'контроль дыхания', 'музыкальный ритм'],
    closing: 'Если хочешь прочувствовать формат студии на 100% — выбирай VibeCore.'
  },
  intervals: {
    lead: 'Музыка. Пульс. Взрыв.',
    paragraphs: [
      'Интервальная тренировка высокой интенсивности.',
      'Короткие мощные отрезки чередуются с активным восстановлением — всё строго в такт музыке.',
      'Это про адреналин, пиковые усилия и чувство полного включения.',
      'Каждый дроп — ускорение. Каждый бит — движение.'
    ],
    focus: ['жиросжигание', 'развитие мощности', 'рост VO2max', 'максимум энергии за 85 минут'],
    closing: 'Если хочешь выйти за пределы — это твой формат.'
  },
  power: {
    lead: 'Сила ног. Контроль. Тяжёлый ритм.',
    paragraphs: [
      'Тренировка с акцентом на сопротивление и мощность.',
      'Больше подъёмов, тяжёлых участков и силовой работы в седле и стоя.',
      'Темп ниже, нагрузка выше.',
      'Работаем на развитие силы и устойчивости.'
    ],
    focus: ['силовая выносливость', 'мощность педалирования', 'устойчивость корпуса'],
    closing: 'Это не про скорость. Это про контроль и силу.'
  },
  endurance: {
    lead: 'Длинная дистанция. Чистый поток.',
    paragraphs: [
      'Ровная, продолжительная тренировка на развитие аэробной выносливости.',
      'Минимум резких скачков, больше стабильной работы в пульсовой зоне 2-3.',
      'Идеально для тех, кто хочет прокачать базу, подготовиться к более интенсивным форматам или просто погрузиться в медитативный ритм.'
    ],
    focus: ['кардиобаза', 'жиросжигание', 'устойчивость к длительной нагрузке', 'дыхание и ритм'],
    closing: 'Ты не спешишь. Ты едешь далеко.'
  },
  cinema: {
    lead: 'Крутим педали. Смотрим кино.',
    paragraphs: [
      'Особый формат VibeRide с просмотром фильма или концерта на большом экране.',
      'Свет приглушён, атмосфера камерная, нагрузка адаптирована под длительный формат.',
      'Интенсивность умеренная или переменная — в зависимости от сцены и сюжета.'
    ],
    focus: ['удовольствие', 'длинный формат', 'эмоциональное погружение', 'комьюнити-эффект'],
    closing: 'Это не просто тренировка. Это experience.'
  }
};

export default function WorkoutTypesBlock({
  title,
  subtitle,
  locale
}: {
  title: string;
  subtitle: string;
  locale: Locale;
}) {
  void title;
  const spoilerLabel = locale === 'ru' ? 'О форматах тренировок' : 'About workout formats';
  const [activeTypeId, setActiveTypeId] = useState<WorkoutTypeId | null>(null);

  const activeType = WORKOUT_TYPES.find((item) => item.id === activeTypeId) ?? null;
  const activeContent = activeTypeId ? WORKOUT_TYPE_POPUP_CONTENT_RU[activeTypeId] : null;

  return (
    <section className="container-wide py-6 md:py-7">
      <details className="group rounded-2xl border border-border bg-bg-elevated/70 p-2 md:p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-bg-tertiary/60 md:text-base [&::-webkit-details-marker]:hidden">
          <span>{spoilerLabel}</span>
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-bg-tertiary text-base transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          >
            ˅
          </span>
        </summary>

        <div className="mt-2 border-t border-border pt-3">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mt-0 text-sm leading-tight text-text-muted md:text-base">{subtitle}</p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {WORKOUT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveTypeId(type.id)}
                className="group relative overflow-hidden rounded-[16px] border border-border bg-bg-elevated px-4 pt-3 pb-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md md:px-5 md:pt-3 md:pb-4"
              >
                <span
                  className="absolute top-0 left-0 h-full w-1 rounded-l-[16px] transition-opacity duration-200 group-hover:opacity-100"
                  style={{backgroundColor: type.color, opacity: 0.85}}
                  aria-hidden="true"
                />

                <div className="pl-3">
                  <h3 className="text-lg font-semibold">{type.name}</h3>
                  <p className="mt-0.5 min-h-[2.1rem] overflow-hidden text-sm leading-[1.1rem] text-text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {getWorkoutTypeDescription(type, locale)}
                  </p>

                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-[0.06em] uppercase text-text-muted">
                      {locale === 'ru' ? 'Длительность' : 'Duration'}
                    </span>
                    <span className="text-xs font-semibold text-text-muted">
                      {type.durationMin} {locale === 'ru' ? 'мин' : 'min'}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-[0.06em] uppercase text-text-muted">
                      {locale === 'ru' ? 'Интенсивность' : 'Intensity'}
                    </span>
                    <IntensityScale value={type.intensity} color={type.color} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </details>

      <Modal
        open={Boolean(activeType && activeContent)}
        onClose={() => setActiveTypeId(null)}
        title={activeType?.name}
        className="max-w-2xl"
      >
        {activeContent ? (
          <div className="space-y-3 text-sm leading-relaxed">
            <p className="text-base font-semibold">{activeContent.lead}</p>
            {activeContent.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-text-muted">
                {paragraph}
              </p>
            ))}
            <div className="rounded-xl border border-border bg-bg-tertiary/55 p-3">
              <div className="mb-2 text-xs font-semibold tracking-[0.06em] uppercase text-text-muted">
                {locale === 'ru' ? 'Фокус' : 'Focus'}
              </div>
              <ul className="space-y-1 text-sm">
                {activeContent.focus.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-text-muted">
                    <span aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="font-semibold">{activeContent.closing}</p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
