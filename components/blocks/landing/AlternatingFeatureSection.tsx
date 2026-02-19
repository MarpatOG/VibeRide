import {Locale} from '@/lib/locale';
import FeatureRow from '@/components/blocks/landing/FeatureRow';

type FeatureItem = {
  imageUrl: string;
  alt: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function AlternatingFeatureSection({
  title,
  items,
  locale
}: {
  title?: string;
  items: FeatureItem[];
  locale?: Locale;
}) {
  return (
    <section className="py-24 md:py-28">
      <div className="container-wide">
        {title && <h2 className="text-center text-[clamp(34px,3.1vw,52px)] font-extrabold">{title}</h2>}
        <div className="mt-12 space-y-16 md:mt-16 md:space-y-20">
          {items.slice(0, 3).map((item, index) => (
            <FeatureRow
              key={`${item.imageUrl}-${index}`}
              title={item.title}
              description={item.description}
              ctaLabel={item.ctaLabel}
              ctaHref={item.ctaHref}
              imageUrl={item.imageUrl}
              imageAlt={item.alt}
              reverse={index % 2 === 1}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
