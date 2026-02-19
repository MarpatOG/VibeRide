import {FaqItem, Notification, Product, Promotion} from '@/lib/types/catalog';

export const products: Product[] = [
  {
    id: 'p-start-cycle',
    type: 'plan',
    name: {ru: 'Start Cycle', en: 'Start Cycle'},
    description: {ru: 'Стартовый пакет для первого знакомства со студией', en: 'Starter pack for your first rides in the studio'},
    price: 2400,
    credits: 3
  },
  {
    id: 'p-1',
    type: 'plan',
    name: {ru: '1 тренировка', en: '1 ride'},
    description: {ru: 'Разовое посещение любого занятия в расписании', en: 'Single access to any scheduled class'},
    price: 900,
    credits: 1
  },
  {
    id: 'p-4',
    type: 'plan',
    name: {ru: '4 тренировки', en: '4 rides'},
    description: {ru: 'Оптимальный пакет на 2-3 недели тренировок', en: 'Balanced package for 2-3 weeks of training'},
    price: 3400,
    credits: 4
  },
  {
    id: 'p-8',
    type: 'plan',
    name: {ru: '8 тренировок', en: '8 rides'},
    description: {ru: 'Основной месячный формат для регулярных райдов', en: 'Core monthly format for regular training'},
    price: 6400,
    credits: 8
  },
  {
    id: 'p-16',
    type: 'plan',
    name: {ru: '16 тренировок', en: '16 rides'},
    description: {ru: 'Интенсивный пакет для частого прогресса', en: 'Intensive package for fast progress'},
    price: 11200,
    credits: 16
  },
  {
    id: 'p-30',
    type: 'plan',
    name: {ru: '30 тренировок', en: '30 rides'},
    description: {ru: 'Максимальный пакет для дисциплины и результата', en: 'Maximum package for high-volume training'},
    price: 18000,
    credits: 30
  },
  {
    id: 'p-gift',
    type: 'certificate',
    name: {ru: 'Подарочный сертификат', en: 'Gift Certificate'},
    description: {ru: 'Подарок на любую сумму с гибким сроком активации', en: 'Gift card with a flexible activation period'},
    price: 3000
  }
];

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    title: {ru: 'Стартовый бустер', en: 'Starter Booster'},
    description: {ru: 'Пакет для быстрого старта: выгодная цена на первые тренировки.', en: 'Fast-start package with a discounted entry price.'},
    packageRides: 3,
    active: true
  },
  {
    id: 'promo-2',
    title: {ru: 'Ритм недели', en: 'Week Rhythm'},
    description: {ru: 'Пакет для стабильного графика без пропусков.', en: 'Package designed for a steady weekly routine.'},
    packageRides: 6,
    active: true
  },
  {
    id: 'promo-3',
    title: {ru: 'Power Pack', en: 'Power Pack'},
    description: {ru: 'Усиленный пакет для заметного прогресса за месяц.', en: 'Extended package for visible monthly progress.'},
    packageRides: 10,
    active: true
  },
  {
    id: 'promo-4',
    title: {ru: 'Командный спринт', en: 'Team Sprint'},
    description: {ru: 'Пакет для совместных тренировок с друзьями.', en: 'A shared package format for training with friends.'},
    packageRides: 12,
    active: true
  }
];

export const faqs: FaqItem[] = [
  {
    id: 'f-1',
    question: {ru: 'Что взять с собой на тренировку?', en: 'What should I bring to class?'},
    answer: {
      ru: 'Удобную спортивную форму, бутылку воды и небольшое полотенце. Велотуфли и полотенца доступны в студии.',
      en: 'Bring comfortable sportswear, a bottle of water and a small towel. Cycling shoes and towels are available in the studio.'
    }
  },
  {
    id: 'f-2',
    question: {ru: 'Подойдет ли тренировка новичкам?', en: 'Are classes suitable for beginners?'},
    answer: {
      ru: 'Да. Большинство классов подходят новичкам: инструктор поможет настроить байк, объяснит базовую технику и подскажет, как выбирать комфортную нагрузку. Можно крутить в своём темпе — это нормально.',
      en: 'Yes. Most classes are beginner-friendly: the instructor helps you set up the bike, explains the basics and suggests a comfortable load. Riding at your own pace is completely fine.'
    }
  },
  {
    id: 'f-3',
    question: {ru: 'За сколько минут приходить до начала?', en: 'How early should I arrive before class?'},
    answer: {
      ru: 'Рекомендуем приходить за 10–15 минут до старта, особенно на первую тренировку: нужно пройти отметку, переодеться и настроить велосипед. Если вы опоздали, вас могут не пустить в зал после начала.',
      en: 'We recommend arriving 10-15 minutes before start, especially for your first class: check-in, changing and bike setup take time. If you are late, studio entry may be restricted after class begins.'
    }
  },
  {
    id: 'f-4',
    question: {ru: 'Сколько длится тренировка и как она проходит?', en: 'How long is a class and what is the format?'},
    answer: {
      ru: 'Обычно занятие длится 45–60 минут. Внутри — разминка, интервальные блоки по темпу/нагрузке, восстановление и заминка. Может добавляться короткий силовой блок для верхней части тела.',
      en: 'A class usually lasts 45-60 minutes. It includes warm-up, interval blocks by pace/load, recovery and cool-down. A short upper-body strength block may be included.'
    }
  },
  {
    id: 'f-5',
    question: {ru: 'Как работает отмена/перенос тренировки?', en: 'How do cancellation and rescheduling work?'},
    answer: {
      ru: 'Отменить или перенести тренировку можно в личном кабинете. Часто действует правило: бесплатная отмена до 24 часов до старта, позже тренировка может списаться. Если не пришли без отмены — занятие списывается.',
      en: 'You can cancel or reschedule in your profile. A common rule is free cancellation up to 24 hours before start; later, a session may be deducted. No-show without cancellation is deducted.'
    }
  },
  {
    id: 'f-6',
    question: {
      ru: 'Что если я никогда не занимался(ась) сайклом и боюсь "не вывезти"?',
      en: 'What if I have never done cycling and worry I will not keep up?'
    },
    answer: {
      ru: 'Это нормально. В сайкле главное — регулярность и свой темп. Вы сами регулируете нагрузку и можете отдыхать в любой момент. Инструктор подскажет упрощенные варианты и поможет не перегрузиться.',
      en: 'That is normal. In cycling, consistency and your own pace matter most. You control the load and can rest any time. The instructor can suggest easier options to avoid overload.'
    }
  },
  {
    id: 'f-7',
    question: {
      ru: 'Есть ли ограничения по здоровью и противопоказания?',
      en: 'Are there health limitations or contraindications?'
    },
    answer: {
      ru: 'Если есть хронические заболевания, травмы, беременность или сомнения по нагрузке — лучше проконсультироваться с врачом. На тренировке сообщите инструктору о нюансах: он поможет выбрать безопасный режим и альтернативные варианты движений.',
      en: 'If you have chronic conditions, injuries, pregnancy or doubts about load, consult your doctor first. Tell the instructor about your specifics so they can suggest a safe mode and alternatives.'
    }
  }
];

export const notifications: Notification[] = [
  {
    id: 'n-1',
    title: {ru: 'Spot available', en: 'Spot available'},
    body: {ru: 'You are promoted from waitlist to booking for Night Sprint.', en: 'You are promoted from waitlist to booking for Night Sprint.'},
    time: '2026-01-30T10:15:00+03:00',
    type: 'waitlist',
    isRead: false
  },
  {
    id: 'n-2',
    title: {ru: 'Reminder', en: 'Reminder'},
    body: {ru: 'Morning Flow ride starts tomorrow at 09:30.', en: 'Morning Flow ride starts tomorrow at 09:30.'},
    time: '2026-01-30T12:00:00+03:00',
    type: 'reminder',
    isRead: true
  }
];
