import {Link} from '@/lib/navigation';
import {products} from '@/lib/constants/catalog';
import {t} from '@/lib/utils/localized';
import {Locale} from '@/lib/locale';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PricingTeaserBlock({
  title,
  subtitle,
  featuredProductIds,
  ctaLabel,
  ctaHref,
  locale
}: {
  title: string;
  subtitle?: string;
  featuredProductIds: string[];
  ctaLabel: string;
  ctaHref: string;
  locale: Locale;
}) {
  const featured = products.filter((product) => featuredProductIds.includes(product.id));
  const normalizedCtaLabel = ctaLabel.replace(/\s*[→>-]+\s*$/, '').trim();

  return (
    <section className="container-wide">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-[clamp(34px,3.1vw,52px)] font-extrabold">{title}</h2>
        {subtitle ? (
          <p className="mt-3 text-[clamp(16px,1.3vw,20px)] leading-[1.45] text-text-muted">{subtitle}</p>
        ) : null}
        <Link
          href={ctaHref}
          locale={locale}
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:underline"
        >
          <span>{normalizedCtaLabel}</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {featured.map((product) => (
          <Card key={product.id} className="glow-card">
            <div className="text-sm text-text-muted">
              {product.type === 'plan'
                ? locale === 'ru'
                  ? 'Абонемент'
                  : 'Plan'
                : product.type === 'certificate'
                  ? locale === 'ru'
                    ? 'Сертификат'
                    : 'Certificate'
                  : locale === 'ru'
                    ? 'Разовое'
                    : 'Single'}
            </div>
            <h4 className="mt-2 text-lg font-semibold">{t(product.name, locale)}</h4>
            <p className="mt-2 text-sm text-text-muted">{t(product.description, locale)}</p>
            <div className="mt-6 flex items-end justify-between">
              <div className="text-xl font-semibold">
                {product.price.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')} ₽
              </div>
              <Button variant="ghost">{locale === 'ru' ? 'Купить' : 'Buy'}</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

