import {ReactNode} from 'react';
import {blockSchemas} from '@/lib/blocks/schemas';
import {BlockBase} from '@/lib/blocks/types';
import {Locale} from '@/lib/locale';
import HeroBannerBlock from '@/components/blocks/landing/HeroBannerBlock';
import WorkoutTypesBlock from '@/components/blocks/landing/WorkoutTypesBlock';
import UpcomingClassesBlock from '@/components/blocks/landing/UpcomingClassesBlock';
import GalleryMosaicBlock from '@/components/blocks/landing/GalleryMosaicBlock';
import PricingTeaserBlock from '@/components/blocks/landing/PricingTeaserBlock';
import ScheduleFiltersBlock from '@/components/blocks/schedule/ScheduleFiltersBlock';
import SessionListBlock from '@/components/blocks/schedule/SessionListBlock';
import SessionDetailsDrawerBlock from '@/components/blocks/schedule/SessionDetailsDrawerBlock';
import PricingHeroBlock from '@/components/blocks/pricing/PricingHeroBlock';
import PricingTabsBlock from '@/components/blocks/pricing/PricingTabsBlock';
import ProductGridBlock from '@/components/blocks/pricing/ProductGridBlock';
import PromotionsListBlock from '@/components/blocks/pricing/PromotionsListBlock';
import TrainersHeroBlock from '@/components/blocks/trainers/TrainersHeroBlock';
import TrainerGridBlock from '@/components/blocks/trainers/TrainerGridBlock';
import TrainerProfileDrawerBlock from '@/components/blocks/trainers/TrainerProfileDrawerBlock';
import AboutHeroBlock from '@/components/blocks/about/AboutHeroBlock';
import HowItWorksStepsBlock from '@/components/blocks/about/HowItWorksStepsBlock';
import AmenitiesGridBlock from '@/components/blocks/about/AmenitiesGridBlock';
import ContactsBlock from '@/components/blocks/about/ContactsBlock';
import FaqHeroBlock from '@/components/blocks/faq/FaqHeroBlock';
import FaqSearchBlock from '@/components/blocks/faq/FaqSearchBlock';
import FaqAccordionBlock from '@/components/blocks/faq/FaqAccordionBlock';
import FooterBlock from '@/components/blocks/layout/FooterBlock';

const componentMap: Record<string, (props: any) => ReactNode> = {
  'landing.heroBanner.v1': HeroBannerBlock,
  'landing.workoutTypes.v1': WorkoutTypesBlock,
  'landing.upcomingClasses.v1': UpcomingClassesBlock,
  'landing.galleryMosaic.v1': GalleryMosaicBlock,
  'landing.pricingTeaser.v1': PricingTeaserBlock,
  'schedule.filtersBar.v1': ScheduleFiltersBlock,
  'schedule.sessionsList.v1': SessionListBlock,
  'schedule.sessionDetailsDrawer.v1': SessionDetailsDrawerBlock,
  'pricing.hero.v1': PricingHeroBlock,
  'pricing.tabs.v1': PricingTabsBlock,
  'pricing.productGrid.v1': ProductGridBlock,
  'pricing.promotionsList.v1': PromotionsListBlock,
  'trainers.hero.v1': TrainersHeroBlock,
  'trainers.grid.v1': TrainerGridBlock,
  'trainers.profileDrawer.v1': TrainerProfileDrawerBlock,
  'about.hero.v1': AboutHeroBlock,
  'about.howItWorksSteps.v1': HowItWorksStepsBlock,
  'about.amenitiesGrid.v1': AmenitiesGridBlock,
  'about.contacts.v1': ContactsBlock,
  'faq.hero.v1': FaqHeroBlock,
  'faq.search.v1': FaqSearchBlock,
  'faq.accordion.v1': FaqAccordionBlock,
  'layout.footer.v1': FooterBlock
};

export default function BlockRenderer({
  blocks,
  locale
}: {
  blocks: BlockBase[];
  locale: Locale;
}) {
  return (
    <>
      {blocks
        .filter((block) => block.enabled)
        .map((block) => {
          const Component = componentMap[block.type];
          if (!Component) {
            return null;
          }
          const schema = blockSchemas[block.type as keyof typeof blockSchemas];
          const parsed = schema?.safeParse(block.props);
          if (schema && !parsed?.success) {
            return (
              <section key={block.id} className="container-wide">
                <div className="surface p-6 text-sm text-state-danger">
                  Block "{block.type}" has invalid props.
                </div>
              </section>
            );
          }
          return <Component key={block.id} {...(parsed?.data ?? block.props)} locale={locale} />;
        })}
    </>
  );
}

