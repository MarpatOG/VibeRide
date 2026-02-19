import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {Link} from '@/lib/navigation';
import {Locale} from '@/lib/locale';
import {Membership} from '@/lib/types/profile';
import {formatDate} from '@/components/profile/format';

export default function MembershipCard({
  membership,
  locale,
  buyHref
}: {
  membership: Membership | null;
  locale: Locale;
  buyHref: string;
}) {
  const activeMembership = membership && membership.active ? membership : null;

  return (
    <Card>
      <h4 className="text-xl font-semibold">{locale === 'ru' ? 'Мой абонемент' : 'My membership'}</h4>
      {activeMembership ? (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            {locale === 'ru'
              ? `Осталось тренировок: ${activeMembership.remainingSessions}`
              : `Sessions left: ${activeMembership.remainingSessions}`}
          </div>
          {activeMembership.validUntil ? (
            <div className="text-text-muted">
              {locale === 'ru'
                ? `Срок действия до: ${formatDate(activeMembership.validUntil, locale)}`
                : `Valid until: ${formatDate(activeMembership.validUntil, locale)}`}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 text-sm text-text-muted">
          {locale === 'ru' ? 'Абонемент не активен / 0 тренировок' : 'Membership is inactive / 0 sessions'}
        </div>
      )}
      <Link href={buyHref} locale={locale}>
        <Button className="mt-5 w-full">{locale === 'ru' ? 'Купить абонемент' : 'Buy membership'}</Button>
      </Link>
    </Card>
  );
}
