import NextLink, {LinkProps} from 'next/link';
import {ComponentProps} from 'react';
import {Locale, locales} from '@/lib/locale';

function stripLocalePrefix(pathname: string) {
  if (!pathname.startsWith('/')) {
    return pathname;
  }

  const firstSegment = pathname.split('/')[1];
  if (!locales.includes(firstSegment as Locale)) {
    return pathname;
  }

  const rest = pathname
    .split('/')
    .slice(2)
    .join('/');
  return rest ? `/${rest}` : '/';
}

function localizeHref(href: LinkProps['href'], _locale?: Locale): LinkProps['href'] {
  if (typeof href === 'string') {
    return stripLocalePrefix(href);
  }

  if (href && typeof href === 'object' && typeof href.pathname === 'string') {
    return {
      ...href,
      pathname: stripLocalePrefix(href.pathname)
    };
  }

  return href;
}

type NextLinkComponentProps = ComponentProps<typeof NextLink>;

type LocalizedLinkProps = Omit<NextLinkComponentProps, 'href' | 'locale'> & {
  href: NextLinkComponentProps['href'];
  locale?: Locale;
};

export function Link({href, locale, ...props}: LocalizedLinkProps) {
  return <NextLink href={localizeHref(href, locale)} {...props} />;
}
