'use client';

import Tabs from '@/components/ui/Tabs';
import {Locale} from '@/lib/locale';

export default function PricingTabsBlock({
  tabs
}: {
  tabs: Array<{key: 'plans' | 'certs' | 'promos'; label: string}>;
  locale?: Locale;
}) {
  return (
    <section className="container-wide">
      <Tabs items={tabs} />
    </section>
  );
}

