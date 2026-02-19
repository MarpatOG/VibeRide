import {z} from 'zod';

const ctaSchema = z.object({
  label: z.string(),
  href: z.string()
});

export const blockSchemas = {
  'landing.heroBanner.v1': z.object({
    heading: z.string(),
    subheading: z.string(),
    ctaPrimary: ctaSchema,
    ctaSecondary: ctaSchema.optional(),
    heroImageDesktopUrl: z.string(),
    heroImageMobileUrl: z.string(),
    focalPoint: z.enum(['left', 'center', 'right']).optional()
  }),
  'landing.workoutTypes.v1': z.object({
    title: z.string(),
    subtitle: z.string()
  }),
  'landing.upcomingClasses.v1': z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    maxItems: z.number(),
    showQuickSwitch: z.boolean().optional(),
    ctaAllLabel: z.string(),
    ctaAllHref: z.string()
  }),
  'landing.galleryMosaic.v1': z.object({
    title: z.string().optional(),
    items: z.array(
      z.object({
        imageUrl: z.string(),
        alt: z.string(),
        title: z.string(),
        description: z.string(),
        ctaLabel: z.string(),
        ctaHref: z.string()
      })
    )
  }),
  'landing.pricingTeaser.v1': z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    featuredProductIds: z.array(z.string()),
    ctaLabel: z.string(),
    ctaHref: z.string()
  }),
  'schedule.filtersBar.v1': z.object({
    showTrainerFilter: z.boolean(),
    showLevelFilter: z.boolean().optional(),
    defaultView: z.enum(['day', 'week'])
  }),
  'schedule.sessionsList.v1': z.object({
    emptyTitle: z.string(),
    emptyCtaLabel: z.string(),
    emptyCtaHref: z.string()
  }),
  'schedule.sessionDetailsDrawer.v1': z.object({
    cancelPolicyHours: z.number(),
    showWhatToBring: z.boolean().optional()
  }),
  'pricing.hero.v1': z.object({
    title: z.string(),
    subtitle: z.string().optional()
  }),
  'pricing.tabs.v1': z.object({
    tabs: z.array(
      z.object({
        key: z.enum(['plans', 'certs', 'promos']),
        label: z.string()
      })
    )
  }),
  'pricing.productGrid.v1': z.object({
    sectionTitle: z.string(),
    type: z.enum(['plan', 'certificate', 'single'])
  }),
  'pricing.promotionsList.v1': z.object({
    title: z.string(),
    showActiveOnly: z.boolean()
  }),
  'trainers.hero.v1': z.object({
    title: z.string(),
    subtitle: z.string().optional()
  }),
  'trainers.grid.v1': z.object({
    showTagsFilter: z.boolean().optional()
  }),
  'trainers.profileDrawer.v1': z.object({
    showUpcomingSessions: z.boolean(),
    maxUpcoming: z.number()
  }),
  'about.hero.v1': z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    imageUrl: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string()
  }),
  'about.howItWorksSteps.v1': z.object({
    title: z.string(),
    steps: z.array(
      z.object({
        title: z.string(),
        body: z.string(),
        icon: z.string().optional()
      })
    )
  }),
  'about.amenitiesGrid.v1': z.object({
    title: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        body: z.string().optional(),
        icon: z.string().optional()
      })
    )
  }),
  'about.contacts.v1': z.object({
    title: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    hours: z.string().optional(),
    socials: z
      .array(z.object({
        type: z.enum(['instagram', 'telegram', 'vk', 'youtube', 'tiktok']),
        url: z.string()
      }))
      .optional(),
    mapEmbedUrl: z.string().optional(),
    showContactForm: z.boolean()
  }),
  'faq.hero.v1': z.object({
    title: z.string(),
    subtitle: z.string().optional()
  }),
  'faq.search.v1': z.object({
    placeholder: z.string()
  }),
  'faq.accordion.v1': z.object({
    categories: z.array(z.string()).optional()
  }),
  'layout.footer.v1': z.object({
    menuLinks: z.array(z.object({label: z.string(), href: z.string()})),
    contacts: z.object({phone: z.string(), email: z.string().optional(), address: z.string()}),
    legalLinks: z.array(z.object({label: z.string(), href: z.string()})),
    companyLine: z.string()
  })
};

export type BlockType = keyof typeof blockSchemas;
