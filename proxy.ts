import {NextRequest, NextResponse} from 'next/server';
import {defaultLocale, isLocale} from '@/lib/locale';

const PUBLIC_FILE = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const firstSegment = segments[1];

  if (firstSegment && isLocale(firstSegment)) {
    const cleanPath = segments.slice(2).join('/');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = cleanPath ? `/${cleanPath}` : '/';
    return NextResponse.redirect(redirectUrl);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
