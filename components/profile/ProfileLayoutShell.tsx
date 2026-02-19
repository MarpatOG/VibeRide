'use client';

import {ReactNode} from 'react';
import {Locale} from '@/lib/locale';

export default function ProfileLayoutShell({
  locale: _locale,
  children
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <section className="container-wide py-8 md:py-10">
      <div className="min-w-0">{children}</div>
    </section>
  );
}
