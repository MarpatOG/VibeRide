import {Link} from '@/lib/navigation';
import Button from '@/components/ui/Button';
import {Locale} from '@/lib/locale';

export default function AboutHeroBlock({
  title,
  subtitle,
  imageUrl,
  ctaLabel,
  ctaHref,
  locale
}: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  locale?: Locale;
}) {
  return (
    <section className="container-wide">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
          <Link href={ctaHref} locale={locale}>
            <Button className="mt-6">{ctaLabel}</Button>
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

