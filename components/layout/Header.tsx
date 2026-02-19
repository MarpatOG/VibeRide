'use client';

import {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {usePathname, useRouter} from 'next/navigation';
import {Link} from '@/lib/navigation';
import {useLocale, useT} from '@/lib/locale-client';
import {Locale} from '@/lib/locale';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import {clearMockSession, getMockSession, mockAuthChangeEvent, mockAuthStorageKey, MockSession} from '@/lib/mock-auth';

const navLinks = [
  {key: 'about', href: '/about'},
  {key: 'schedule', href: '/schedule'},
  {key: 'trainers', href: '/trainers'},
  {key: 'pricing', href: '/pricing'},
  {key: 'faq', href: '/faq'}
];

export default function Header() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [session, setSession] = useState<MockSession | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{x: number; width: number; visible: boolean}>({
    x: 0,
    width: 0,
    visible: false
  });
  const navRef = useRef<HTMLElement | null>(null);
  const mobileMenuCloseGuardUntilRef = useRef(0);

  const profileHref = session?.role === 'admin' ? '/admin' : session?.role === 'trainer' ? '/trainer' : '/profile';
  const authLabel = session
    ? session.name.trim() || (locale === 'ru' ? 'Профиль' : 'Profile')
    : locale === 'ru'
      ? 'Войти'
      : 'Sign in';
  const authHref = session ? profileHref : '/login';
  const isLanding = pathname === `/${locale}` || pathname === '/';
  const isLightTheme = theme === 'light';

  const closeMobileMenu = () => {
    mobileMenuCloseGuardUntilRef.current = Date.now() + 220;
    setOpen(false);
  };

  const openMobileMenu = () => {
    if (Date.now() < mobileMenuCloseGuardUntilRef.current) return;
    setOpen(true);
  };

  const handleLogout = () => {
    clearMockSession();
    setOpen(false);
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => {
      if (mq.matches) {
        setOpen(false);
      }
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const syncTheme = () => {
      const raw = root.getAttribute('data-theme');
      setTheme(raw === 'dark' ? 'dark' : 'light');
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {attributes: true, attributeFilter: ['data-theme']});

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const portraitMq = window.matchMedia('(orientation: portrait)');
    const handleOrientationChange = () => {
      if (portraitMq.matches) {
        setOpen(false);
      }
    };
    handleOrientationChange();
    portraitMq.addEventListener('change', handleOrientationChange);
    return () => portraitMq.removeEventListener('change', handleOrientationChange);
  }, []);

  const showIndicatorFor = (element: HTMLElement) => {
    setIndicatorStyle({
      x: element.offsetLeft,
      width: element.offsetWidth,
      visible: true
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncSession = () => setSession(getMockSession());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === mockAuthStorageKey) {
        syncSession();
      }
    };
    syncSession();
    window.addEventListener('storage', onStorage);
    window.addEventListener(mockAuthChangeEvent, syncSession);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(mockAuthChangeEvent, syncSession);
    };
  }, []);

  return (
    <header
      className={clsx(
        'group/header z-50 transition-colors',
        isLanding
          ? clsx(
              'absolute inset-x-0 top-0',
              isLightTheme
                ? 'border-b border-border bg-white/95 backdrop-blur-md lg:border-transparent lg:bg-transparent lg:backdrop-blur-0'
                : 'border-b border-white/15 bg-black/25 backdrop-blur-md lg:border-transparent lg:bg-transparent lg:backdrop-blur-0',
              isLightTheme
                ? 'lg:hover:border-border lg:hover:bg-white/95 lg:hover:backdrop-blur-md'
                : 'lg:hover:border-white/15 lg:hover:bg-black/25 lg:hover:backdrop-blur-md',
              isLightTheme
                ? 'lg:focus-within:border-border lg:focus-within:bg-white/95 lg:focus-within:backdrop-blur-md'
                : 'lg:focus-within:border-white/15 lg:focus-within:bg-black/25 lg:focus-within:backdrop-blur-md',
              open && (isLightTheme ? 'border-border bg-white/95 backdrop-blur-md' : 'border-white/15 bg-black/25 backdrop-blur-md')
            )
          : 'sticky top-0 border-b border-border bg-bg backdrop-blur'
      )}
    >
      <div className="container-wide relative flex h-20 items-center justify-between gap-0 lg:gap-4">
        <div className="flex items-center justify-start lg:hidden">
          <button
            type="button"
            onClick={openMobileMenu}
            className={clsx(
              'inline-flex items-center justify-center p-2 transition-opacity hover:opacity-80',
              isLanding
                ? isLightTheme
                  ? 'text-black'
                  : 'text-white'
                : 'text-text'
            )}
            aria-label="Open menu"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
        <Link
          href="/"
          locale={locale}
          className={clsx(
            'ml-0 mr-auto text-lg font-semibold uppercase tracking-[0.3em] lg:ml-0 lg:mr-0',
            isLanding &&
              (isLightTheme
                ? 'text-black lg:text-white lg:group-hover/header:text-black lg:group-focus-within/header:text-black'
                : 'text-white')
          )}
        >
          VibeRide
        </Link>
        <nav
          ref={navRef}
          className="relative hidden items-center gap-6 lg:flex"
          onMouseLeave={() => setIndicatorStyle((prev) => ({...prev, visible: false}))}
        >
          {navLinks.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              locale={locale}
              onMouseEnter={(event) => showIndicatorFor(event.currentTarget)}
              onFocus={(event) => showIndicatorFor(event.currentTarget)}
              onBlur={() => setIndicatorStyle((prev) => ({...prev, visible: false}))}
              className={clsx(
                'relative pb-2 text-sm font-semibold transition-colors',
                isLanding
                  ? clsx(
                      'text-white/80',
                      isLightTheme
                        ? 'hover:text-black group-hover/header:text-black group-focus-within/header:text-black'
                        : 'hover:text-white'
                    )
                  : 'text-text-muted hover:text-text'
              )}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
          <span
            className={clsx(
              'pointer-events-none absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out',
              isLanding ? (isLightTheme ? 'bg-black' : 'bg-white') : 'bg-black',
              indicatorStyle.visible ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              width: `${indicatorStyle.width}px`,
              transform: `translateX(${indicatorStyle.x}px)`
            }}
          />
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/schedule" locale={locale}>
            <Button
              variant="secondary"
              className={clsx(
                isLanding &&
                  (isLightTheme
                    ? 'border-transparent text-white hover:bg-white/10 group-hover/header:border-border group-focus-within/header:border-border group-hover/header:text-black group-focus-within/header:text-black'
                    : 'border-transparent text-white hover:bg-white/10 group-hover/header:border-white/35 group-focus-within/header:border-white/35')
              )}
            >
              {t('nav.ctaBook')}
            </Button>
          </Link>
          {session ? (
            <div className="group/profile relative">
              <Link href={authHref} locale={locale}>
                <Button
                  variant="ghost"
                  className={clsx(
                    'relative z-10 w-full border border-transparent group-hover/profile:rounded-b-none group-focus-within/profile:rounded-b-none',
                    'group-hover/profile:border-border group-focus-within/profile:border-border',
                    'group-hover/profile:bg-bg-elevated group-focus-within/profile:bg-bg-elevated',
                    isLanding &&
                      (isLightTheme
                        ? 'text-white hover:bg-white/10 group-hover/header:text-black group-focus-within/header:text-black'
                        : 'text-white hover:bg-white/10')
                  )}
                >
                  {authLabel}
                </Button>
              </Link>
              <div
                className={clsx(
                  'pointer-events-none absolute left-0 top-[calc(100%-1px)] z-20 w-full overflow-hidden rounded-b-md border border-t-0 border-border bg-bg-elevated opacity-0 shadow-lg transition',
                  'group-hover/profile:pointer-events-auto group-hover/profile:opacity-100',
                  'group-focus-within/profile:pointer-events-auto group-focus-within/profile:opacity-100'
                )}
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className={clsx(
                    'w-full px-3 py-2 text-center text-sm font-semibold transition',
                    isLanding
                      ? isLightTheme
                        ? 'text-black hover:bg-bg-tertiary'
                        : 'text-white hover:bg-white/10'
                      : 'text-text hover:bg-bg-tertiary'
                  )}
                >
                  {locale === 'ru' ? 'Выйти' : 'Log out'}
                </button>
              </div>
            </div>
          ) : (
            <Link href={authHref} locale={locale}>
              <Button
                variant="ghost"
                className={clsx(
                  isLanding &&
                    (isLightTheme
                      ? 'text-white hover:bg-white/10 group-hover/header:text-black group-focus-within/header:text-black'
                      : 'text-white hover:bg-white/10')
                )}
              >
                {authLabel}
              </Button>
            </Link>
          )}
        </div>
        <div className="flex w-11 items-center justify-end lg:hidden" />
      </div>
      <div className="lg:hidden">
        <Drawer open={open} onClose={closeMobileMenu} title={t('nav.menu')} side="left">
          <div className="flex flex-col gap-4">
            <Link href="/" locale={locale} onClick={closeMobileMenu} className="text-base font-semibold">
              {locale === 'ru' ? 'Главная' : 'Home'}
            </Link>
            {navLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                locale={locale}
                onClick={closeMobileMenu}
                className="text-base font-semibold"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/schedule" locale={locale} onClick={closeMobileMenu}>
              <Button className="w-full">{t('nav.ctaBook')}</Button>
            </Link>
            {session ? (
              <>
                <Link href={authHref} locale={locale} onClick={closeMobileMenu}>
                  <Button variant="secondary" className="w-full">
                    {authLabel}
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  {locale === 'ru' ? 'Выйти' : 'Log out'}
                </Button>
              </>
            ) : (
              <Link href={authHref} locale={locale} onClick={closeMobileMenu}>
                <Button variant="secondary" className="w-full">
                  {authLabel}
                </Button>
              </Link>
            )}
          </div>
        </Drawer>
      </div>
    </header>
  );
}


