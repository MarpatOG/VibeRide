import {Link} from '@/lib/navigation';
import {Locale} from '@/lib/locale';
import ThemeSwitch from '@/components/layout/ThemeSwitch';

export default function FooterBlock({
  menuLinks,
  contacts,
  legalLinks,
  companyLine,
  locale
}: {
  menuLinks: Array<{label: string; href: string}>;
  contacts: {phone: string; email?: string; address: string};
  legalLinks: Array<{label: string; href: string}>;
  companyLine: string;
  locale?: Locale;
}) {
  const isRu = locale === 'ru';
  return (
    <div className="container-wide py-14">
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="text-lg font-semibold uppercase tracking-[0.3em]">VibeRide</div>
          <p className="mt-3 text-sm text-white/70">{companyLine}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="text-sm font-semibold">{isRu ? '\u0422\u0435\u043C\u0430' : 'Theme'}</div>
            <ThemeSwitch className="rounded-md border border-white/30 p-2 text-white hover:bg-white/10" />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">{isRu ? '\u041C\u0435\u043D\u044E' : 'Menu'}</div>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {menuLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} locale={locale} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">{isRu ? '\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B' : 'Contacts'}</div>
          <div className="mt-3 space-y-2 text-sm text-white/70">
            <div>{contacts.address}</div>
            <div>{contacts.phone}</div>
            {contacts.email && <div>{contacts.email}</div>}
          </div>
          <div className="mt-4 text-sm font-semibold">
            {isRu ? '\u042E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F' : 'Legal'}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} locale={locale} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
