import {Link} from '@/lib/navigation';
import {Locale} from '@/lib/locale';

export default function FeatureRow({
  title,
  description,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  reverse,
  locale
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  reverse?: boolean;
  locale?: Locale;
}) {
  return (
    <article className="grid items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
      <div className={reverse ? 'md:order-2 md:col-span-5' : 'md:col-span-5'}>
        <h3 className="max-w-[16ch] text-[clamp(32px,3.2vw,64px)] font-extrabold leading-[0.98]">{title}</h3>
        <p className="mt-4 max-w-[34ch] text-[clamp(18px,1.45vw,30px)] leading-[1.4] text-text-muted">{description}</p>
        <Link
          href={ctaHref}
          locale={locale}
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:underline"
        >
          <span>{ctaLabel}</span>
          <span aria-hidden>›</span>
        </Link>
      </div>
      <div className={reverse ? 'md:order-1 md:col-span-7' : 'md:col-span-7'}>
        <div className="h-[260px] overflow-hidden rounded-2xl sm:h-[320px] md:h-[360px] lg:h-[400px]">
          <img src={imageUrl} alt={imageAlt} className="h-full w-full rounded-2xl object-cover" />
        </div>
      </div>
    </article>
  );
}
