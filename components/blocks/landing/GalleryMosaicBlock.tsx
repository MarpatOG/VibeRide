import {Locale} from '@/lib/locale';
import AlternatingFeatureSection from '@/components/blocks/landing/AlternatingFeatureSection';

export default function GalleryMosaicBlock({
  title,
  items,
  locale
}: {
  title?: string;
  items: Array<{
    imageUrl: string;
    alt: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  }>;
  locale?: Locale;
}) {
  return <AlternatingFeatureSection title={title} items={items} locale={locale} />;
}
