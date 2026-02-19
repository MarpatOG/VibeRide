import {Locale} from '@/lib/locale';

export default function PricingHeroBlock({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
  locale?: Locale;
}) {
  return (
    <section className="w-full px-4 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h1 className="text-[clamp(34px,3.1vw,52px)] font-extrabold">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-[clamp(16px,1.3vw,20px)] leading-[1.45] text-text-muted">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

