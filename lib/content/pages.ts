import {ContentPageJson} from '@/lib/blocks/types';
import {defaultLocale, isLocale, Locale} from '@/lib/locale';

const baseLanding = {
  heroImageDesktopUrl: '/images/landing/VibeRideHero.jpg?v=20260209b',
  heroImageMobileUrl: '/images/landing/herobanner_new_vert.png?v=20260209'
};

const landingFeaturesRu = [
  {
    imageUrl: '/images/landing/banner1.png?v=20260216c',
    alt: 'Групповая тренировка в студии VibeRide',
    title: 'Вкатывайся в лучший заезд',
    description: 'Готов к старту? Забронируем байк и подберем первый класс под ваш темп и уровень.',
    ctaLabel: 'СТАРТОВЫЕ ПРЕДЛОЖЕНИЯ',
    ctaHref: '/pricing'
  },
  {
    imageUrl: '/images/landing/banner3.png?v=20260216e',
    alt: 'Тренировка в ритме под светом студии',
    title: 'Найди свой ритм',
    description: 'Разные форматы и мощные плейлисты помогают держать мотивацию и идти в стабильный прогресс.',
    ctaLabel: 'СМОТРЕТЬ ТРЕНЕРОВ',
    ctaHref: '/trainers'
  },
  {
    imageUrl: '/images/landing/banner4.png?v=20260216e',
    alt: 'Сайкл-зона с тренажерами и атмосферным светом',
    title: 'Атмосфера, которая заряжает',
    description: 'Премиальный звук, световые сцены и продуманная постановка делают каждый заезд цельным опытом.',
    ctaLabel: 'СМОТРЕТЬ РАСПИСАНИЕ',
    ctaHref: '/schedule'
  }
];

const landingFeaturesEn = [
  {
    imageUrl: '/images/landing/banner1.png?v=20260216c',
    alt: 'Group class in the VibeRide studio',
    title: 'Clip into your best ride',
    description: 'Ready to roll? We will lock your bike and match your first class to your level.',
    ctaLabel: 'FIRST-TIME OFFERS',
    ctaHref: '/pricing'
  },
  {
    imageUrl: '/images/landing/banner3.png?v=20260216e',
    alt: 'Rider pushing the pace under studio lights',
    title: 'Find your riding rhythm',
    description: 'Diverse coaching styles and playlists keep the energy high and progression consistent.',
    ctaLabel: 'BROWSE INSTRUCTORS',
    ctaHref: '/trainers'
  },
  {
    imageUrl: '/images/landing/banner4.png?v=20260216e',
    alt: 'Indoor cycling space with atmospheric setup',
    title: 'A studio built for momentum',
    description: 'Immersive lighting, premium sound and precise programming turn every class into an experience.',
    ctaLabel: 'VIEW SCHEDULE',
    ctaHref: '/schedule'
  }
];

export const contentPages: Record<string, Record<string, ContentPageJson>> = {
  landing: {
    ru: {
      pageKey: 'landing',
      locale: 'ru',
      blocks: [
        {
          id: 'landing-hero',
          type: 'landing.heroBanner.v1',
          version: 1,
          enabled: true,
          props: {
            heading: 'VibeRide — сайклинг-клуб в центре города.',
            subheading: 'Музыка, свет и продуманные тренировки для любого уровня.',
            ctaPrimary: {label: 'Расписание тренировок', href: '/schedule'},
            heroImageDesktopUrl: baseLanding.heroImageDesktopUrl,
            heroImageMobileUrl: baseLanding.heroImageMobileUrl,
            focalPoint: 'center'
          }
        },
        {
          id: 'landing-upcoming',
          type: 'landing.upcomingClasses.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Ближайшие занятия',
            subtitle: 'Новичок? Начни с VibeStart — покажем всё на первой тренировке.',
            maxItems: 6,
            showQuickSwitch: true,
            ctaAllLabel: 'Все расписание →',
            ctaAllHref: '/schedule'
          }
        },
        {
          id: 'landing-gallery',
          type: 'landing.galleryMosaic.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Атмосфера VibeRide',
            items: landingFeaturesRu
          }
        }
      ]
    },
    en: {
      pageKey: 'landing',
      locale: 'en',
      blocks: [
        {
          id: 'landing-hero',
          type: 'landing.heroBanner.v1',
          version: 1,
          enabled: true,
          props: {
            heading: 'VibeRide — urban cycle studio',
            subheading: 'Music-driven rides, bold lighting and smart training for every level.',
            ctaPrimary: {label: 'Book a ride', href: '/schedule'},
            ctaSecondary: {label: 'Pricing', href: '/pricing'},
            heroImageDesktopUrl: baseLanding.heroImageDesktopUrl,
            heroImageMobileUrl: baseLanding.heroImageMobileUrl,
            focalPoint: 'center'
          }
        },
        {
          id: 'landing-upcoming',
          type: 'landing.upcomingClasses.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Upcoming classes',
            subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
            maxItems: 6,
            showQuickSwitch: true,
            ctaAllLabel: 'Full schedule →',
            ctaAllHref: '/schedule'
          }
        },
        {
          id: 'landing-gallery',
          type: 'landing.galleryMosaic.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Inside VibeRide',
            items: landingFeaturesEn
          }
        }
      ]
    }
  },
  schedule: {
    ru: {
      pageKey: 'schedule',
      locale: 'ru',
      blocks: [
        {
          id: 'schedule-workout-types',
          type: 'landing.workoutTypes.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Форматы тренировок',
            subtitle: '6 форматов — от первого старта до максимальной мощности.'
          }
        },
        {
          id: 'schedule-filters',
          type: 'schedule.filtersBar.v1',
          version: 1,
          enabled: true,
          props: {showTrainerFilter: true, showLevelFilter: true, defaultView: 'week'}
        },
        {
          id: 'schedule-list',
          type: 'schedule.sessionsList.v1',
          version: 1,
          enabled: true,
          props: {
            emptyTitle: 'Нет занятий на выбранную дату',
            emptyCtaLabel: 'Вернуться к расписанию',
            emptyCtaHref: '/schedule'
          }
        },
        {
          id: 'schedule-drawer',
          type: 'schedule.sessionDetailsDrawer.v1',
          version: 1,
          enabled: true,
          props: {cancelPolicyHours: 24, showWhatToBring: true}
        }
      ]
    },
    en: {
      pageKey: 'schedule',
      locale: 'en',
      blocks: [
        {
          id: 'schedule-workout-types',
          type: 'landing.workoutTypes.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Training formats',
            subtitle: '6 formats from your first ride to maximum power.'
          }
        },
        {
          id: 'schedule-filters',
          type: 'schedule.filtersBar.v1',
          version: 1,
          enabled: true,
          props: {showTrainerFilter: true, showLevelFilter: true, defaultView: 'week'}
        },
        {
          id: 'schedule-list',
          type: 'schedule.sessionsList.v1',
          version: 1,
          enabled: true,
          props: {
            emptyTitle: 'No sessions for the selected date',
            emptyCtaLabel: 'Back to schedule',
            emptyCtaHref: '/schedule'
          }
        },
        {
          id: 'schedule-drawer',
          type: 'schedule.sessionDetailsDrawer.v1',
          version: 1,
          enabled: true,
          props: {cancelPolicyHours: 24, showWhatToBring: true}
        }
      ]
    }
  },
  pricing: {
    ru: {
      pageKey: 'pricing',
      locale: 'ru',
      blocks: [
        {
          id: 'pricing-hero',
          type: 'pricing.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Цены и акции',
            subtitle: 'Гибкие форматы посещения и специальные предложения.'
          }
        },
        {
          id: 'pricing-products',
          type: 'pricing.productGrid.v1',
          version: 1,
          enabled: true,
          props: {sectionTitle: 'Популярные продукты', type: 'plan'}
        },
        
      ]
    },
    en: {
      pageKey: 'pricing',
      locale: 'en',
      blocks: [
        {
          id: 'pricing-hero',
          type: 'pricing.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Pricing & Deals',
            subtitle: 'Flexible ride formats and special offers.'
          }
        },
        {
          id: 'pricing-products',
          type: 'pricing.productGrid.v1',
          version: 1,
          enabled: true,
          props: {sectionTitle: 'Featured products', type: 'plan'}
        },
        
      ]
    }
  },
  trainers: {
    ru: {
      pageKey: 'trainers',
      locale: 'ru',
      blocks: [
        {
          id: 'trainers-hero',
          type: 'trainers.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Команда тренеров',
            subtitle: 'Профессионалы, которые ведут вас по маршруту.'
          }
        },
        {
          id: 'trainers-grid',
          type: 'trainers.grid.v1',
          version: 1,
          enabled: true,
          props: {showTagsFilter: false}
        },
        {
          id: 'trainers-drawer',
          type: 'trainers.profileDrawer.v1',
          version: 1,
          enabled: true,
          props: {showUpcomingSessions: true, maxUpcoming: 2}
        }
      ]
    },
    en: {
      pageKey: 'trainers',
      locale: 'en',
      blocks: [
        {
          id: 'trainers-hero',
          type: 'trainers.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Meet the coaches',
            subtitle: 'Pros who guide you through every ride.'
          }
        },
        {
          id: 'trainers-grid',
          type: 'trainers.grid.v1',
          version: 1,
          enabled: true,
          props: {showTagsFilter: false}
        },
        {
          id: 'trainers-drawer',
          type: 'trainers.profileDrawer.v1',
          version: 1,
          enabled: true,
          props: {showUpcomingSessions: true, maxUpcoming: 2}
        }
      ]
    }
  },
  about: {
    ru: {
      pageKey: 'about',
      locale: 'ru',
      blocks: [
        {
          id: 'about-hero',
          type: 'about.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'О VibeRide',
            subtitle: 'Мы соединяем спорт, музыку и городскую культуру.',
            imageUrl: '/images/about/Vibe_about.png?v=20260209',
            ctaLabel: 'Выбрать занятие',
            ctaHref: '/schedule'
          }
        },
        {
          id: 'about-steps',
          type: 'about.howItWorksSteps.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Как всё устроено',
            steps: [
              {title: 'Выберите слот', body: 'Откройте расписание и найдите свой темп.'},
              {title: 'Записаться', body: 'Оплатите или используйте абонемент.'},
              {title: 'Приезжайте', body: 'Велосипед и настрой уже ждут вас.'}
            ]
          }
        },
        {
          id: 'about-amenities',
          type: 'about.amenitiesGrid.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Что внутри',
            items: [
              {title: 'Лаунж-зона', body: 'Уютное место для общения до и после ride.'},
              {title: 'Премиум звук', body: 'Система, которая качает на каждом спринте.'},
              {title: 'Снаряжение', body: 'Велотуфли и аксессуары включены.'}
            ]
          }
        },
        {
          id: 'about-contacts',
          type: 'about.contacts.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Контакты',
            address: 'Москва, Космодамианская набережная, 46-50с1',
            phone: '+7 (999) 123-45-67',
            email: 'hello@viberide.hexlet',
            hours: 'Ежедневно 7:00–23:00',
            mapEmbedUrl: 'https://yandex.ru/map-widget/v1/?ll=37.644773%2C55.735829&z=17&l=map&pt=37.644773,55.735829,pm2rdm',
            showContactForm: true
          }
        }
      ]
    },
    en: {
      pageKey: 'about',
      locale: 'en',
      blocks: [
        {
          id: 'about-hero',
          type: 'about.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'About VibeRide',
            subtitle: 'We blend training, music and urban culture.',
            imageUrl: '/images/about/Vibe_about.png?v=20260209',
            ctaLabel: 'Pick a class',
            ctaHref: '/schedule'
          }
        },
        {
          id: 'about-steps',
          type: 'about.howItWorksSteps.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'How it works',
            steps: [
              {title: 'Choose a slot', body: 'Open the schedule and find your pace.'},
              {title: 'Book it', body: 'Pay or use your membership credits.'},
              {title: 'Show up', body: 'Bike and energy are ready for you.'}
            ]
          }
        },
        {
          id: 'about-amenities',
          type: 'about.amenitiesGrid.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Amenities',
            items: [
              {title: 'Lounge area', body: 'Warm community space before and after rides.'},
              {title: 'Premium sound', body: 'Audio system that drives every sprint.'},
              {title: 'Gear included', body: 'Cycling shoes and accessories are provided.'}
            ]
          }
        },
        {
          id: 'about-contacts',
          type: 'about.contacts.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'Contacts',
            address: 'Москва, Космодамианская набережная, 46-50с1',
            phone: '+7 (999) 123-45-67',
            email: 'hello@viberide.hexlet',
            hours: 'Daily 7:00–23:00',
            mapEmbedUrl: 'https://yandex.ru/map-widget/v1/?ll=37.644773%2C55.735829&z=17&l=map&pt=37.644773,55.735829,pm2rdm',
            showContactForm: true
          }
        }
      ]
    }
  },
  faq: {
    ru: {
      pageKey: 'faq',
      locale: 'ru',
      blocks: [
        {
          id: 'faq-hero',
          type: 'faq.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'FAQ',
            subtitle: 'Ответы на частые вопросы о студии.'
          }
        },
        {
          id: 'faq-accordion',
          type: 'faq.accordion.v1',
          version: 1,
          enabled: true,
          props: {categories: []}
        }
      ]
    },
    en: {
      pageKey: 'faq',
      locale: 'en',
      blocks: [
        {
          id: 'faq-hero',
          type: 'faq.hero.v1',
          version: 1,
          enabled: true,
          props: {
            title: 'FAQ',
            subtitle: 'Quick answers about the studio.'
          }
        },
        {
          id: 'faq-accordion',
          type: 'faq.accordion.v1',
          version: 1,
          enabled: true,
          props: {categories: []}
        }
      ]
    }
  },
  footer: {
    ru: {
      pageKey: 'footer',
      locale: 'ru',
      blocks: [
        {
          id: 'footer-main',
          type: 'layout.footer.v1',
          version: 1,
          enabled: true,
          props: {
            menuLinks: [
              {label: 'Расписание', href: '/schedule'},
              {label: 'Цены', href: '/pricing'},
              {label: 'Тренеры', href: '/trainers'},
              {label: 'О нас', href: '/about'},
              {label: 'FAQ', href: '/faq'}
            ],
            contacts: {
              phone: '+7 (999) 123-45-67',
              email: 'hello@viberide.hexlet',
              address: 'Москва, Космодамианская набережная, 46-50с1'
            },
            legalLinks: [
              {label: 'Политика', href: '/legal/privacy'},
              {label: 'Пользовательское соглашение', href: '/legal/terms'},
              {label: 'Оферта', href: '/legal/offer'}
            ],
            companyLine: '© 2026 VibeRide Studio'
          }
        }
      ]
    },
    en: {
      pageKey: 'footer',
      locale: 'en',
      blocks: [
        {
          id: 'footer-main',
          type: 'layout.footer.v1',
          version: 1,
          enabled: true,
          props: {
            menuLinks: [
              {label: 'Schedule', href: '/schedule'},
              {label: 'Pricing', href: '/pricing'},
              {label: 'Trainers', href: '/trainers'},
              {label: 'About', href: '/about'},
              {label: 'FAQ', href: '/faq'}
            ],
            contacts: {
              phone: '+7 (999) 123-45-67',
              email: 'hello@viberide.hexlet',
              address: 'Москва, Космодамианская набережная, 46-50с1'
            },
            legalLinks: [
              {label: 'Privacy', href: '/legal/privacy'},
              {label: 'Terms', href: '/legal/terms'},
              {label: 'Offer', href: '/legal/offer'}
            ],
            companyLine: '© 2026 VibeRide Studio'
          }
        }
      ]
    }
  }
};

export function getContentPage(pageKey: keyof typeof contentPages, locale: Locale | string) {
  const page = contentPages[pageKey];
  if (!page) {
    throw new Error(`Missing content page: ${pageKey}`);
  }
  const resolvedLocale = typeof locale === 'string' && isLocale(locale) ? locale : defaultLocale;
  const content = page[resolvedLocale] ?? page[defaultLocale];
  if (!content) {
    throw new Error(`Missing content for page "${pageKey}" and locale "${resolvedLocale}"`);
  }
  return content;
}



