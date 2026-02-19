import {promotions} from '@/lib/constants/catalog';
import {t} from '@/lib/utils/localized';
import {Locale} from '@/lib/locale';
import Card from '@/components/ui/Card';

export default function PromotionsListBlock({
  title,
  showActiveOnly,
  locale
}: {
  title: string;
  showActiveOnly: boolean;
  locale: Locale;
}) {
  const list = showActiveOnly ? promotions.filter((item) => item.active) : promotions;

  return (
    <section className="container-wide">
      <h3>{title}</h3>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {list.map((promo) => (
          <Card key={promo.id} className="border border-[var(--accent)]/30">
            <h4 className="text-lg font-semibold">{t(promo.title, locale)}</h4>
            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              {locale === 'ru'
                ? `Пакет: ${promo.packageRides} тренировок`
                : `Package: ${promo.packageRides} rides`}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}



